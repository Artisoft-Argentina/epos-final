# Evaluación — Refactor de Listas de Precios

## Contexto

Se solicitó **analizar y evaluar** (sin aplicar cambios) la implementación ya
realizada del plan `docs/plan-refactor-listas-precios.md`, contrastándola contra
la especificación `docs/modelo-precios.md`, y opinar sobre la consistencia del
nuevo flujo de listas de precios.

Se auditó: modelo de datos (migraciones + modelos), capa de servicio
(`PriceService`), controllers (`PriceListController`, `ProductController`,
`VentaController`), rutas, permisos, seeder y frontend (páginas `PriceLists/*`,
`Products/*`, `Ventas/Create`).

> **Estado (2026-07-10): RESUELTO.** Todos los hallazgos (P1, P2, P3 y limpieza)
> fueron implementados y verificados. Ver la sección [Resolución](#resolución-2026-07-10)
> al final del documento. La evaluación original se conserva abajo como referencia.

---

## Veredicto general

✅ **El refactor está sustancialmente completo y bien alineado con la spec.** La
arquitectura es correcta: controller delgado, lógica centralizada en
`PriceService`, tabla `price_history` append-only, eliminación limpia de
`products.price` (cero referencias residuales a la columna en `app/`).

La mayoría de las "violaciones" listadas en el plan fueron efectivamente
corregidas. Pero hay **un bug funcional real (P1)** que rompe uno de los seis
flujos de la spec, más algunos puntos de robustez/consistencia.

### Cumplimiento de la spec (resumen)

| Área | Estado |
|---|---|
| Migraciones (`cost` NOT NULL, `markup_percent`, `pricing_strategy`, `is_manual`, `price_history`) | ✅ Correcto |
| `products.price` eliminado + sin referencias residuales | ✅ Correcto |
| `PriceService.resolvePrice` (fórmula + strategy list/product + fallback) | ✅ Correcto |
| `generateForProduct` al crear producto (flujo #1) | ✅ Correcto |
| `overridePrice` marca `is_manual` + history (flujo #3) | ✅ Correcto |
| `recalculateList` all/auto_only (flujo #4) | ⚠️ Correcto salvo edge case (P2) |
| Crear lista genera precios de todos los productos (flujo #5) | ✅ Correcto (reusa `recalculateList('all')`) |
| **Editar costo → recalcular listas (flujo #2)** | ❌ **Roto (P1)** |
| Rutas `price-lists.*`, permisos, sidebar | ✅ Correcto |
| Frontend: DataTable, PageHeader, Badge semántico, modales, FormField, Switch | ✅ Correcto |

---

## Hallazgos de correctitud (bugs)

### 🔴 P1 — Editar el costo de un producto NO recalcula precios ni registra historial

**El flujo #2 de la spec está muerto.** Cadena rota entre
`ProductService::update()` y `PriceService::updateCost()`:

- `app/Services/ProductService.php:47-55`
  ```php
  $previousCost = (float) $product->cost;
  $product->update($data);              // ← ya persiste el cost NUEVO
  $freshProduct = $product->fresh();    // ← su ->cost es el NUEVO
  if ((float) $freshProduct->cost !== $previousCost) {
      $this->priceService->updateCost($freshProduct, (float) $freshProduct->cost, Auth::user());
  }
  ```
- `app/Services/PriceService.php:96-104`
  ```php
  public function updateCost(Product $product, float $newCost, ?User $user = null): void {
      $oldCost = (float) $product->cost;   // = NUEVO (ya se guardó arriba)
      if ($oldCost === $newCost) { return; } // NUEVO === NUEVO → return inmediato
      ...
  }
  ```

Como el producto ya fue guardado con el costo nuevo *antes* de llamar a
`updateCost`, dentro del service `$oldCost === $newCost` es siempre verdadero y
**retorna sin hacer nada**: no recalcula precios no-manuales en ninguna lista y
no escribe `price_history` (`cost_update` ni `bulk_recalculation`).

`updateCost` tiene **un solo llamador** (verificado por grep), y es este camino
roto → la funcionalidad completa de recálculo por cambio de costo, y el tipo de
historial `cost_update`, nunca se ejercitan desde la UI.

**Corrección sugerida** (elegir una): pasar el costo *previo* a `updateCost` y
que el service compare contra ese valor; o no incluir `cost` en el `$product->update($data)`
inicial y dejar que `updateCost` haga el update + comparación. En cualquier caso,
el `$product->update(['cost' => $newCost])` interno de `updateCost` (línea 104)
queda redundante con el update de `ProductService` y hay que reconciliarlo.

---

### 🟠 P2 — `recalculateList('all')` no resetea `is_manual` cuando el precio no cambia

`PriceService.php:68` hace `if ($oldPrice === $newPrice) continue;` **antes** de
escribir el pivot. Bajo strategy `'all'`, si un precio manual coincide con el
valor recalculado, el `continue` salta la escritura y `is_manual` queda en `true`
en vez de resetearse a `false`. La spec (flujo #4) dice que "Recalcular todos …
resetea `is_manual = false`". Edge case, pero es una desviación de la regla.

### 🟠 P2 — Comparación estricta de floats (`===` / `!==`) sobre dinero

En `PriceService.php:68,100,133` y `PriceListController.php:103` se comparan
precios/costos/porcentajes con `===`/`!==`. Un lado es `round(...,2)`, el otro es
un decimal traído de BD y casteado a float. Con 2 decimales suele funcionar, pero
la igualdad estricta de floats es frágil (representación binaria). Recomendado:
comparar con tolerancia (`abs($a-$b) < 0.005`) o en centavos enteros. Además,
este mismo patrón alimenta el edge case de P2 anterior.

---

## Robustez / atomicidad

### 🟡 `updateCost` y `store()` no son transaccionales
`recalculateList` sí envuelve todo en `DB::transaction`, pero:
- `updateCost` hace update de costo + múltiples writes de pivot + history sin transacción.
- `PriceListController::store()` (líneas 32-40) apaga los `default_pos`/`default_ecommerce`
  existentes y luego crea la lista, sin transacción. Un fallo intermedio puede dejar
  el tenant sin ninguna lista `default_pos`.

Recomendado envolver ambos en `DB::transaction`.

### 🟡 R1 parcialmente sin garantizar (invariante `default_pos`)
La spec R1 exige "al menos una lista con `default_pos = true`". `destroy()`
(`PriceListController.php:110-128`) bloquea borrar la última lista activa, pero
**nada impide borrar la lista que hoy es `default_pos`** (habiendo ≥2 activas),
dejando el sistema sin default POS. En ese estado, `Product::getSalePriceAttribute`
cae al `first()` y `VentaController` obtiene `defaultPosList = null`. Tampoco se
garantiza que exista un `default_pos` inicial. Conviene impedir eliminar/desmarcar
el `default_pos` sin reasignar otro.

---

## Consistencia / diseño (observaciones, no bugs)

- **N+1 en recálculo masivo.** `recalculateList`/`updateCost` hacen, por producto,
  un `DB::table(...)->first()` + un `syncWithoutDetaching()` (2 queries c/u) dentro
  del loop, y cargan todos los productos en memoria (`->get()`). Correcto para
  escala PyME; si el catálogo crece, conviene upsert por lotes.

- **Nueva lista solo precia productos activos.** `store()` → `recalculateList` itera
  `Product::where('active', true)`; los productos inactivos no reciben pivot en la
  lista nueva. `generateForProduct` (al crear) sí agrega a todas las listas activas.
  Inconsistencia menor, razonable.

- **Fallback `markup_percent ?? percentage` solo dispara con NULL.** Un producto con
  `markup_percent = 0.00` (no null) da 0% de markup (precio = costo) bajo strategy
  `'product'`, no el fallback al % de la lista. El seeder nunca setea `markup_percent`,
  así que la lista 'Mayorista' (strategy `'product'`) hoy se comporta igual que
  `'list'`. Confirmar si es la intención.

- **El IVA no entra en la fórmula.** `resolvePrice = cost × (1 + markup/100)`;
  `tax_rate` se guarda pero no se aplica. Es consistente con la spec (precios de
  lista sin impuesto). Solo confirmar que POS/ARCA suman IVA aguas abajo.

- **Preview de precios en `Products/Create|Edit` ignora `pricing_strategy`.**
  El preview usa siempre `cost × (1 + list.percentage/100)`
  (`Products/Create.tsx:171-173`), así que para listas `'product'` con
  `markup_percent` seteado el preview no coincide con el precio realmente generado.
  Cosmético.

- **`Ventas/Create.tsx`: fallback a `articulo.price` quedó muerto.** La interfaz aún
  declara `price: number` y el fallback usa `articulo.price`
  (líneas 30, 187, 196-197). El modelo `Product` ya no tiene ese atributo (no está en
  `$appends`), así que el payload no lo trae → el fallback da `NaN`. El camino feliz
  (producto con pivot en la lista seleccionada) funciona bien; solo el fallback está
  roto. Debería caer a `0`/`cost` y quitarse el campo de la interfaz. Impacto bajo.

- **Deltas menores plan-vs-implementación** (internamente consistentes):
  - No se extrajo `price-list-form-dialog.tsx`; el form vive inline en `PriceLists/Index.tsx`. OK.
  - Permisos/rutas omiten `price-lists.create` y `.edit` (el plan los listaba). Correcto dado el enfoque modal.
  - El wrapper de middleware por rol quedó comentado (`// });` en `routes/web.php:162`);
    las rutas dependen solo de `can:price-lists.*`. Efecto equivalente (permisos ↔ rol),
    pero es código muerto a limpiar.

- **Historial condicionado a `$user`.** `recalculateList`/`updateCost` solo escriben
  `price_history` si reciben usuario. El seeder pasa `null` (ok); el controller siempre
  pasa el usuario del request. Una recalculación disparada por job/sistema saltaría el
  historial en silencio.

---

## Recomendación

El nuevo flujo de listas de precios es **sólido y coherente con la spec**. Si se
aprueba, el orden de remediación sugerido es:

1. **P1** — arreglar la cadena `ProductService::update` → `PriceService::updateCost`
   (el bug funcional que rompe el flujo #2). Prioridad alta.
2. **P2** — reset de `is_manual` en `recalculateList('all')` + tolerancia en
   comparaciones de dinero.
3. **P3** — transacciones en `updateCost`/`store`, invariante `default_pos` en `destroy`.
4. Limpieza menor de frontend (`articulo.price` muerto, preview con strategy) y del
   `// });` comentado en rutas.

## Verificación sugerida (cuando se apliquen fixes)

- **Flujo #2**: editar el `cost` de un producto desde `Products/Edit` → confirmar que
  las listas no-manuales recalculan y que se generan filas en `price_history`
  (`cost_update` + `bulk_recalculation`). Ej.: `make tinker` o consulta MCP `db`
  sobre `price_history` tras editar un producto.
- **Recalcular 'all'** sobre una lista con un precio manual idéntico al recalculado →
  verificar `is_manual = false` en `price_list_products`.
- **POS**: cargar una venta con la lista default y con otra lista → confirmar que el
  precio sale del pivot y nunca `NaN` (incluye un producto sin pivot para probar el fallback).

---

## Resolución (2026-07-10)

Todos los hallazgos fueron implementados y verificados.

### Cambios aplicados

| # | Hallazgo | Archivos |
|---|---|---|
| P1 | Recálculo por cambio de costo. `ProductService::update` ahora persiste los campos no-cost primero y delega el costo a `PriceService::updateCost` (que ve el costo previo). | `app/Services/ProductService.php`, `app/Services/PriceService.php` |
| P2 | `recalculateList('all')` resetea `is_manual` aunque el precio no cambie; comparaciones de dinero via helper `sameMoney()` (tolerancia de medio centavo). | `app/Services/PriceService.php`, `app/Http/Controllers/PriceListController.php` |
| P3 | `updateCost`, `store` y `update` envueltos en `DB::transaction`; `destroy` bloquea eliminar la lista `default_pos` (invariante R1). | `app/Services/PriceService.php`, `app/Http/Controllers/PriceListController.php` |
| P3b | `destroy` endurecido: bloquea también la lista `default_ecommerce`; el borrado es **soft-delete de la lista y de sus precios** (antes hacía `detach()` = borrado físico de los pivots mientras la lista quedaba soft-deleted). Ahora nada se borra físicamente y los precios son recuperables al restaurar la lista. Las lecturas por lista (`Product::priceLists`) ya excluyen la lista via su scope de `SoftDeletes`. | `app/Http/Controllers/PriceListController.php` |
| Limpieza | Fallback muerto a `articulo.price` en POS → `0`; preview de producto respeta `pricing_strategy`/`markup_percent`; comentario `// });` muerto eliminado. | `resources/js/pages/Ventas/Create.tsx`, `resources/js/pages/Products/{Create,Edit}.tsx`, `app/Http/Controllers/ProductController.php`, `routes/web.php` |

### Verificación

- **Tests**: `tests/Feature/PriceServiceTest.php` — 12 tests / 29 asserts, todos en verde.
  Cubren `resolvePrice` (ambas estrategias + fallback), `generateForProduct`, `updateCost`
  (recálculo, respeto de manuales, no-op), regresión de P1 vía `ProductService::update`,
  `recalculateList` (`auto_only`/`all` + edge case de `is_manual`) y `overridePrice`.
  Corren solo las migraciones tenant sobre sqlite `:memory:` (sin depender de infra
  central; ver SCRUM-67).
  ```
  docker compose exec app php artisan test --filter=PriceServiceTest
  ```
- **Pasada manual** (tenant real, Postgres): editar el costo de un producto vía
  `ProductService::update` recalculó el pivot (`450 → 561,11`) y registró en
  `price_history` 4 filas (`cost_update` + un `bulk_recalculation` por lista activa).
- **Frontend**: `tsc --noEmit` sin errores nuevos en los archivos tocados; `npm run build` OK.
- Los tests preexistentes de `Auth/`, `Settings/`, `Dashboard` fallan por falta de infra
  de test-DB central (SCRUM-67, `RefreshDatabase` deshabilitado en `Pest.php`) — no
  relacionados con estos cambios.
