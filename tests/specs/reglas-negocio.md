# Reglas de Negocio — EPOS

Documento de referencia para generar tests. Cada regla describe
**lo que el sistema realmente hace**, extraído del código fuente.

---

## Cómo leer este documento

Cada regla tiene:
- **Qué hace**: comportamiento implementado
- **Condición**: cuándo aplica
- **Resultado**: qué pasa en la base de datos / respuesta HTTP
- **Casos negativos**: entradas inválidas y error esperado

---

## Módulo: Marcas

**Modelo:** `App\Models\Marca` | **Tabla:** `marcas`

### RN-MARCA-01 — Crear marca

**Qué hace:** Guarda una nueva marca en la base de datos.

**Condición:**
- Usuario autenticado
- Campo `marca`: string, requerido, máximo 255 caracteres

**Resultado:** Redirect a `marcas.index` con mensaje de éxito.

**Casos negativos:**

| Entrada | Error esperado |
|---|---|
| `marca` vacío | validation error en `marca` |
| `marca` ausente | validation error en `marca` |
| `marca` > 255 caracteres | validation error en `marca` |
| Sin sesión iniciada | redirect al login |

---

### RN-MARCA-02 — Actualizar marca

**Qué hace:** Actualiza el campo `marca` de un registro existente.

**Condición:** Mismas validaciones que al crear.

**Casos negativos:**

| Entrada | Error esperado |
|---|---|
| `marca` vacío | validation error en `marca` |

---

### RN-MARCA-03 — Eliminar marca

**Qué hace:** Elimina el registro de la base de datos (hard delete).

**Resultado:** Redirect a `marcas.index`. El registro ya no existe en `marcas`.

---

## Módulo: Categorías

**Modelo:** `App\Models\Categoria` | **Tabla:** `categorias`

### RN-CAT-01 — Crear categoría

**Qué hace:** Guarda una nueva categoría. El modelo aplica `ucfirst()` automáticamente
al valor del campo `categoria` antes de persistir (hook `creating`).

**Condición:**
- Campo `categoria`: string, requerido, máximo 255 caracteres

**Resultado:** El valor guardado en BD siempre tiene la primera letra en mayúscula,
sin importar cómo llegó el input.

**Ejemplo:** input `"herramientas"` → BD guarda `"Herramientas"`.

**Casos negativos:**

| Entrada | Error esperado |
|---|---|
| `categoria` vacío | validation error en `categoria` |
| `categoria` > 255 caracteres | validation error en `categoria` |
| Sin sesión iniciada | redirect al login |

---

### RN-CAT-02 — Actualizar categoría

**Qué hace:** Igual que crear. El hook `updating` también aplica `ucfirst()`.

---

### RN-CAT-03 — Eliminar categoría

**Qué hace:** Hard delete del registro.

---

## Módulo: Artículos

**Modelo:** `App\Models\Articulo` | **Tabla:** `articulos` | **Soft delete:** sí

### RN-ART-01 — Crear artículo

**Qué hace:** Guarda un nuevo artículo con sus relaciones opcionales.

**Campos requeridos:**

| Campo | Tipo | Restricción |
|---|---|---|
| `codarticulo` | string | max 255 |
| `articulo` | string | max 255 |
| `descripcion` | string | — |
| `medida` | string | max 255 |
| `precio` | numeric | min 0 |
| `alicuota` | numeric | min 0 |
| `stockminimo` | integer | min 0 |
| `marca_id` | foreign key | debe existir en `marcas` |
| `categoria_id` | foreign key | debe existir en `categorias` |

**Campos opcionales:**

| Campo | Tipo | Restricción |
|---|---|---|
| `supplier_id` | foreign key | debe existir en `suppliers` si se envía |
| `imagenes.*` | archivo | jpeg/png/jpg/gif, max 5 MB |

**Resultado:** Redirect a `articulos.index`.

**Casos negativos:**

| Campo | Entrada inválida | Error esperado |
|---|---|---|
| `codarticulo` | vacío | validation error en `codarticulo` |
| `articulo` | vacío | validation error en `articulo` |
| `descripcion` | vacío | validation error en `descripcion` |
| `medida` | vacío | validation error en `medida` |
| `precio` | negativo | validation error en `precio` |
| `precio` | texto no numérico | validation error en `precio` |
| `alicuota` | negativo | validation error en `alicuota` |
| `stockminimo` | negativo | validation error en `stockminimo` |
| `stockminimo` | 0 | **válido** (es el mínimo permitido) |
| `marca_id` | ID inexistente | validation error en `marca_id` |
| `categoria_id` | ID inexistente | validation error en `categoria_id` |

---

### RN-ART-02 — Eliminar artículo

**Qué hace:** Soft delete. El registro permanece en la BD con `deleted_at` poblado.
Las imágenes del storage sí se eliminan físicamente.

**Resultado:** `deleted_at` != null en la tabla `articulos`.

---

## Módulo: Inventario

**Modelo:** `App\Models\Inventario` | **Tabla:** `inventarios`

### RN-INV-01 — Crear inventario

**Qué hace:** Registra el stock inicial de un artículo. Si la cantidad > 0,
también registra un movimiento de tipo `ENTRADA_AJUSTE` con la nota
"Stock inicial al crear inventario".

**Campos:**

| Campo | Tipo | Restricción |
|---|---|---|
| `articulo_id` | foreign key | requerido, debe existir en `articulos` |
| `cantidad` | integer | requerido, min 0 |
| `supplier_id` | foreign key | opcional |
| `lote` | integer | opcional |
| `vencimiento` | date | opcional |

**Casos negativos:**

| Entrada | Error esperado |
|---|---|
| `cantidad` negativa | validation error en `cantidad` |

---

### RN-INV-02 — Actualizar inventario

**Qué hace:** Modifica la cantidad. Registra un movimiento según la diferencia:
- Diferencia positiva → movimiento `ENTRADA_AJUSTE`
- Diferencia negativa → movimiento `SALIDA_AJUSTE`
- Sin diferencia → no registra movimiento

---

### RN-INV-03 — Eliminar inventario

**Qué hace:** Hard delete del registro de inventario.

---

## Módulo: Remitos (Compras)

**Modelo:** `App\Models\Remito` | **Tabla:** `remitos`

### RN-REM-01 — Crear remito

**Qué hace:** Guarda el encabezado del remito y sus líneas de detalle.
Calcula el subtotal como la suma de `cantidad × preciounitario` de cada detalle.
El `total` queda igual al `subtotal` (sin recargos adicionales al crear).

**Campos del encabezado:**

| Campo | Tipo | Restricción |
|---|---|---|
| `ptoventa` | integer | requerido |
| `numremito` | integer | requerido |
| `fecha` | date | requerido |
| `supplier_id` | foreign key | requerido, debe existir en `suppliers` |

**Campos de cada detalle (`detalles[]`):**

| Campo | Tipo | Restricción |
|---|---|---|
| `articulo_id` | foreign key | requerido, debe existir en `articulos` |
| `cantidad` | integer | requerido, min 1 |
| `preciounitario` | numeric | requerido, min 0 |

**Fórmula:** `subtotal = Σ (detalle.cantidad × detalle.preciounitario)`

**Ejemplo:**
- Línea 1: 3 unidades × $200 = $600
- Línea 2: 2 unidades × $150 = $300
- `subtotal = total = $900`

**Resultado:** Redirect a `remitos.index`.

---

### RN-REM-02 — Convertir remito a inventario

**Qué hace:** Por cada línea de detalle del remito:
- Si existe un inventario para ese artículo → incrementa `cantidad`
- Si no existe → crea el registro de inventario con esa cantidad
- Registra un movimiento de tipo `ENTRADA_COMPRA`
- Marca el remito con `convertido_inventario = true`

**Condición para ejecutar:** `convertido_inventario` debe ser `false`.

**Resultado si ya fue convertido:** Redirect back con mensaje de error en sesión.
El stock no se modifica.

**Nota importante:** Esta operación NO usa transacción DB en el código actual.
Si falla a mitad, puede quedar un estado inconsistente.

---

## Módulo: Ventas (POS + Ecommerce)

**Modelo:** `App\Models\Factura` | **Tabla:** `facturas`

### RN-VENTA-01 — Crear venta POS con entrega inmediata

**Condición:** `tipo_venta = "pos"` y `auto_delivery = true`

**Qué hace:**
1. Crea la factura
2. Por cada artículo:
   - Descuenta `cantidad` del inventario correspondiente
   - Registra movimiento `SALIDA_VENTA_POS`
   - Crea una entrega con `estado = "entregada"` y `fecha_entrega_real = now()`
3. Calcula `total = subtotal + recargo - descuento`
4. Crea el pago si `monto_pago > 0`

**Resultado:** El inventario tiene la cantidad descontada inmediatamente.

---

### RN-VENTA-02 — Crear venta POS con entrega diferida

**Condición:** `tipo_venta = "pos"` y `auto_delivery = false` (o ausente)

**Qué hace:**
1. Crea la factura
2. Por cada artículo:
   - **No modifica el inventario**
   - Crea una entrega con `estado = "pendiente"`
3. Calcula totales y pago igual que RN-VENTA-01

**Resultado:** El inventario no cambia. Existe una entrega pendiente en `entregas`.

---

### RN-VENTA-03 — Crear venta Ecommerce

**Condición:** `tipo_venta = "ecommerce"`

**Qué hace:**
1. Crea la factura
2. Por cada artículo:
   - **No modifica el inventario**
   - Crea una entrega con `estado = "pendiente"` y fecha estimada `+3 días`
3. Calcula totales igual

**Resultado:** Igual que RN-VENTA-02. Sin cambio de stock.

---

### RN-VENTA-04 — Cálculo del total

**Fórmula:** `total = subtotal + recargo - descuento`

Donde `subtotal = Σ (articulo.cantidad × articulo.precio)`.

`recargo` y `descuento` son opcionales, default `0`.

---

### RN-VENTA-05 — Eliminar venta

**Qué hace:**
1. Por cada artículo de la factura (via pivot `articulo_factura`):
   - Incrementa el `cantidad` en el inventario en `pivot.cantidad`
   - Registra movimiento `DEVOLUCION`
2. Elimina la factura (hard delete)

**Nota:** El sistema restaura stock **siempre**, sin verificar si la entrega
era pendiente o entregada. Esto puede ser un bug a corregir (SCRUM-25).

---

### RN-VENTA-06 — Validaciones al crear venta

| Campo | Restricción |
|---|---|
| `cliente_id` | requerido, debe existir en `clientes` |
| `articulos` | array requerido, mínimo 1 elemento |
| `articulos[].articulo_id` | requerido, debe existir en `articulos` |
| `articulos[].cantidad` | integer, min 1 |
| `articulos[].precio` | numeric, min 0 |
| `metodo_pago` | string requerido |
| `monto_pago` | numeric, min 0 |
| `tipo_venta` | opcional, enum: `pos` o `ecommerce` |
| `recargo` | numeric, min 0, opcional |
| `descuento` | numeric, min 0, opcional |

---

## Módulo: Entregas

**Modelo:** `App\Models\Entrega` | **Tabla:** `entregas`

**Estados posibles:** `pendiente` | `entregada` | `cancelada`

### RN-ENT-01 — Marcar entrega como entregada

**Ruta:** `POST entregas/{entrega}/marcar-entregada`

**Condición para ejecutar:** `entrega.estado != "entregada"`

**Qué hace:**
1. Verifica que el inventario tenga stock suficiente (`inventario.cantidad >= entrega.cantidad`)
2. Descuenta `entrega.cantidad` del inventario
3. Registra movimiento `SALIDA_ENTREGA`
4. Llama a `$entrega->marcarComoEntregada()` → pone `estado = "entregada"` y `fecha_entrega_real = now()`

**Si ya está entregada:** Redirect back con error en sesión. No modifica nada.

**Si stock insuficiente:** Lanza excepción `"Stock insuficiente para completar la entrega"`.

---

### RN-ENT-02 — Cancelar entrega

**Ruta:** `POST entregas/{entrega}/cancelar`

**Condición para ejecutar:** `entrega.estado != "entregada"`

**Qué hace:** Actualiza `estado = "cancelada"`. No modifica el inventario.

**Si ya está entregada:** Redirect back con error. No modifica nada.

---

### RN-ENT-03 — Eliminar entrega

**Ruta:** `DELETE entregas/{entrega}`

**Qué hace según el estado:**

| Estado de la entrega | Efecto en inventario |
|---|---|
| `entregada` | Restaura el stock: `inventario.cantidad += entrega.cantidad` + registra movimiento `DEVOLUCION` |
| `pendiente` | No modifica el inventario |
| `cancelada` | No modifica el inventario |

Luego elimina el registro (hard delete).

---

## Métodos del Modelo Entrega (Unit Tests)

Estos métodos no tienen lógica compleja pero son usados por el sistema:

### `isPendiente()`
Retorna `true` si `estado === "pendiente"`, `false` en cualquier otro estado.

### `isEntregada()`
Retorna `true` si `estado === "entregada"`, `false` en cualquier otro estado.

### `marcarComoEntregada()`
Actualiza `estado = "entregada"` y `fecha_entrega_real = now()`.

---

## Notas sobre bugs conocidos

| ID | Módulo | Descripción |
|---|---|---|
| SCRUM-25 | Ventas | `destroy()` restaura stock siempre, sin considerar si `auto_delivery` fue false |
| SCRUM-40 | Remitos | `convertirAInventario` no usa `DB::transaction`, puede quedar estado inconsistente |
| SCRUM-23 | Ventas | `numfactura` usa `MAX + 1` sin lock, puede generar duplicados en concurrencia |
