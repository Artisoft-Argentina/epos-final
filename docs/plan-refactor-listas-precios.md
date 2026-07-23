# Plan de Refactor — Listas de Precios

## Análisis: Implementación actual vs Reglas y Especificación

### ❌ Violaciones a las reglas de Backend

| Problema | Regla violada | Ubicación |
|---|---|---|
| Controller con nombre en español (`ListaPrecioController`) | Naming: PascalCase en inglés | `app/Http/Controllers/ListaPrecioController.php` |
| Rutas en español (`listas-precios`) | Rutas: plural, kebab-case, inglés | `routes/web.php` |
| Método `regenerarPrecios` en español | Métodos adicionales en camelCase, inglés | `ListaPrecioController.php` |
| Lógica de negocio en el controller (toggle defaults, generatePrices) | Controllers delgados, lógica en Services | `ListaPrecioController@store/update` |
| No existe `PriceListService` | Servicios para lógica de negocio | `app/Services/` |
| `PriceList::generatePrices()` tiene lógica de negocio en el modelo | Mover al Service | `app/Models/PriceList.php` |
| `show()` usa `->get()` sin paginación | Paginación obligatoria en index/listados | `ListaPrecioController@show` |
| El cálculo de precios usa `product->price` en vez de `product->cost` | Spec: el precio se calcula desde `cost` | `PriceList::generatePrices()`, `ProductService::syncPriceLists()` |
| No existe `pricing_strategy` en la tabla `price_lists` | Spec: ENUM('list', 'product') | Migración `0001_01_01_000010` |
| No existe `is_manual` en `price_list_products` | Spec: protección de precios manuales | Migración `0001_01_01_000027` |
| No existe `markup_percent` en `products` | Spec: template para generar precios | Migración `0001_01_01_000012` |
| No existe tabla `price_history` | Spec: trazabilidad de cambios | — |
| `products.price` sigue existiendo (debería eliminarse) | Spec: el precio se lee de la lista | Migración + Modelo |
| Reglas de validación del ProductController todavía exigen `price` como required | Spec: el campo se elimina | `ProductController::rules()` |

### ❌ Violaciones a las reglas de Frontend

| Problema | Regla violada | Ubicación |
|---|---|---|
| `Create.tsx` usa `AppSidebarLayout` en vez de `AppLayout` | Consistencia de layouts | `ListasPrecios/Create.tsx` |
| `Edit.tsx` usa `AppSidebarLayout` en vez de `AppLayout` | Consistencia de layouts | `ListasPrecios/Edit.tsx` |
| `Show.tsx` construye tabla HTML custom | Usar siempre `DataTable` | `ListasPrecios/Show.tsx` |
| Colores hardcodeados (`bg-green-100 text-green-800`, `bg-blue-100`, etc.) | Usar tokens del design system | `ListasPrecios/Show.tsx` |
| No usa `PageHeader` ni breadcrumb en Create/Edit | Layout estándar de formularios | `Create.tsx`, `Edit.tsx` |
| No usa `FormField` para campos | Wrapper obligatorio con label + error | `Create.tsx`, `Edit.tsx` |
| Iconos con clases `w-4 h-4` en vez de `size-4` | Consistencia Tailwind | Varios |
| La lista en Show no tiene paginación | Spec + regla: no cargar todo sin límite | `Show.tsx` |
| Create/Edit son formularios simples (≤5 campos) → deberían ser **modales** | Regla: modal si ≤5 campos y entidad auxiliar | Frontend rules |

---

## Plan de Implementación por Etapas

### Etapa 1 — Migraciones y modelo de datos

**Objetivo**: Alinear la BD con la especificación `modelo-precios.md`.

1. Modificar migración `products`: eliminar `price` (NOT NULL → drop), hacer `cost` NOT NULL, agregar `markup_percent DECIMAL(5,2) NULLABLE`
2. Modificar migración `price_lists`: agregar `pricing_strategy ENUM('list','product') DEFAULT 'list'`
3. Modificar migración `price_list_products`: agregar `is_manual BOOLEAN DEFAULT false`
4. Crear migración `price_history`
5. Actualizar modelo `Product`: quitar `price` de `$fillable` y `$casts`, agregar `markup_percent`
6. Actualizar modelo `PriceList`: agregar `pricing_strategy` a `$fillable` y `$casts`, eliminar método `generatePrices()`
7. Crear modelo `PriceHistory`

> Como no hay producción: modificar migraciones existentes + `migrate:fresh --seed`

---

### Etapa 2 — PriceService (lógica de negocio)

**Objetivo**: Centralizar toda la lógica de precios en un service siguiendo la spec.

Crear `app/Services/PriceService.php` con:

```php
resolvePrice(Product $product, PriceList $priceList): float
generateForProduct(Product $product): void
recalculateList(PriceList $priceList, string $strategy): void  // 'all' | 'auto_only'
updateCost(Product $product, float $newCost, ?User $user): void
overridePrice(Product $product, PriceList $priceList, float $price, User $user): void
```

- `resolvePrice`: aplica la fórmula según `pricing_strategy`
- `generateForProduct`: genera precios en todas las listas activas al crear producto
- `recalculateList`: recalcula masivamente (respetando `is_manual` según strategy)
- `updateCost`: actualiza costo + recalcula precios no-manuales + registra history
- `overridePrice`: guarda precio custom + marca `is_manual = true` + history

---

### Etapa 3 — Refactor del Controller (renaming + lógica + permisos)

**Objetivo**: Renombrar a inglés y hacer el controller delgado.

1. Renombrar `ListaPrecioController` → `PriceListController`
2. Inyectar `PriceService` en constructor
3. Métodos:
   - `index` — listar listas paginadas
   - `store` — validar + llamar service
   - `show` — mostrar precios de la lista con paginación
   - `update` — validar + llamar service
   - `destroy` — validación de uso en ventas + soft delete
   - `recalculate` (reemplaza `regenerarPrecios`) — llamar `PriceService::recalculateList()`
   - `overridePrice` — para edición individual de precio
4. Actualizar rutas en `web.php`:
   - `listas-precios` → `price-lists`
   - `regenerar` → `recalculate`
   - Nombre de parámetro: `{priceList}`
   - Agregar ruta `price-lists/{priceList}/override-price` con nombre `price-lists.override-price`
5. **Actualizar `config/custom/permissions.php`** — reemplazar TODOS los permisos de listas de precios:

   | Permiso anterior | Permiso nuevo |
   |---|---|
   | `listas-precios.index` | `price-lists.index` |
   | `listas-precios.create` | `price-lists.create` |
   | `listas-precios.store` | `price-lists.store` |
   | `listas-precios.show` | `price-lists.show` |
   | `listas-precios.edit` | `price-lists.edit` |
   | `listas-precios.update` | `price-lists.update` |
   | `listas-precios.destroy` | `price-lists.destroy` |
   | `listas-precios.regenerar` | `price-lists.recalculate` |
   | _(nuevo)_ | `price-lists.override-price` |

   > **IMPORTANTE**: El `RoleSeeder` lee este archivo para crear los permisos Spatie.
   > Si los nombres no coinciden exactamente con el `->name()` y `->middleware('can:...')` de la ruta, se rompe la autorización.
   > Después de este cambio, ejecutar `make fresh` para regenerar roles y permisos.

---

### Etapa 4 — Refactor ProductController y ProductService

**Objetivo**: Adaptar el flujo de productos al nuevo modelo.

1. `ProductController::rules()`: quitar `price` required, agregar `cost` required, `markup_percent` nullable
2. `ProductService::create()`: llamar `PriceService::generateForProduct()` en vez de `syncPriceLists()`
3. `ProductService::update()`: si cambió `cost`, llamar `PriceService::updateCost()`
4. Eliminar método privado `syncPriceLists()` del `ProductService`

---

### Etapa 5 — Frontend: Refactor al Design System

**Objetivo**: Migrar las pantallas de listas de precios al design system y reglas de frontend.

#### 5.1 — Index (ya está bastante bien, ajustes menores)
- Actualizar rutas de `listas-precios.*` a `price-lists.*`
- Agregar badge `pricing_strategy` en la tabla

#### 5.2 — Create/Edit → Convertir a **Modal**
- Son formularios de ≤5 campos → usar `Dialog`
- Campos: `name`, `percentage`, `pricing_strategy`, `default_pos`, `default_ecommerce`
- Eliminar archivos `Create.tsx` y `Edit.tsx` separados
- Mover el formulario a un componente `PriceListFormDialog.tsx` reutilizable para crear y editar
- Usar `FormField`, tokens del design system, `Switch` en vez de `Checkbox` para booleans

#### 5.3 — Show → Refactor completo
- Usar `PageHeader` con breadcrumb
- Usar `DataTable` en vez de tabla HTML custom
- Usar `Badge` con variantes semánticas (`success`, `info`, `warning`) en vez de colores hardcodeados
- Agregar filtro/búsqueda de productos dentro de la lista
- Paginación (backend debe paginar)
- Agregar columna `is_manual` con badge
- Agregar acciones: editar precio individual (modal inline), recalcular
- Botón "Recalcular" con opción de estrategia (all / auto_only) via Dialog de confirmación

#### 5.4 — Interfaces TypeScript
```tsx
interface PriceList {
    id: number;
    name: string;
    percentage: number;
    pricing_strategy: 'list' | 'product';
    default_pos: boolean;
    default_ecommerce: boolean;
    active: boolean;
}

interface PriceListProduct {
    id: number;
    product_id: number;
    sku: string;
    name: string;
    category: string | null;
    brand: string | null;
    cost: number;
    price: number;
    is_manual: boolean;
    margin_percent: number;
}
```

---

### Etapa 6 — Actualizar Seeder y Tests

1. Actualizar `DatabaseSeeder` para generar listas con `pricing_strategy`
2. Actualizar seeders de productos: usar `cost` en vez de `price`
3. Escribir tests para `PriceService`:
   - Test resolvePrice con strategy 'list'
   - Test resolvePrice con strategy 'product' + fallback
   - Test updateCost respeta `is_manual`
   - Test recalculateList con ambas strategies
   - Test overridePrice marca `is_manual = true`

---

## Orden de ejecución recomendado

```
Etapa 1 (migraciones)
  ↓
Etapa 2 (PriceService)
  ↓
Etapa 3 (PriceListController) + Etapa 4 (ProductController) — en paralelo
  ↓
Etapa 5 (Frontend)
  ↓
Etapa 6 (Seeds + Tests)
```

---

## Archivos afectados (resumen)

### Crear
- `app/Services/PriceService.php`
- `app/Models/PriceHistory.php`
- `resources/js/pages/PriceLists/Index.tsx` (rename)
- `resources/js/pages/PriceLists/Show.tsx` (rewrite)
- `resources/js/components/price-list-form-dialog.tsx`

### Modificar
- `database/migrations/tenant/0001_01_01_000010_create_price_lists_table.php`
- `database/migrations/tenant/0001_01_01_000012_create_products_table.php`
- `database/migrations/tenant/0001_01_01_000027_create_price_list_products_table.php`
- `app/Models/Product.php`
- `app/Models/PriceList.php`
- `app/Http/Controllers/ProductController.php`
- `app/Services/ProductService.php`
- `routes/web.php`
- `config/custom/permissions.php` — renombrar permisos `listas-precios.*` → `price-lists.*`

### Eliminar
- `app/Http/Controllers/ListaPrecioController.php` (reemplazado por `PriceListController`)
- `resources/js/pages/ListasPrecios/Create.tsx` (pasa a modal)
- `resources/js/pages/ListasPrecios/Edit.tsx` (pasa a modal)

### Renombrar
- `resources/js/pages/ListasPrecios/` → `resources/js/pages/PriceLists/`
