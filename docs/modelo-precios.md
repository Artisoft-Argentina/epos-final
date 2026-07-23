# Modelo de Precios — Especificación

## Resumen

El precio de venta de un producto se determina siempre a través de una lista de precios.
No existe un "precio" directo en el producto. El producto tiene **costo** y opcionalmente un **% de ganancia** que sirve como template para generar precios en las listas.

---

## Estructura de datos

### `products` (cambios respecto al modelo anterior)

| Campo | Tipo | Obligatorio | Nota |
|---|---|---|---|
| `cost` | `DECIMAL(12,2)` | Sí | Precio de costo. Se actualiza con compras o manualmente |
| `markup_percent` | `DECIMAL(5,2)` | No | % de ganancia propio del producto. Template para generar precios |
| ~~`price`~~ | — | — | **ELIMINADO** |

### `price_lists`

| Campo | Tipo | Obligatorio | Nota |
|---|---|---|---|
| `id` | PK | — | |
| `name` | `STRING` | Sí | Ej: "Minorista", "Mayorista" |
| `percentage` | `DECIMAL(8,2)` | Sí | % base de la lista (fallback) |
| `pricing_strategy` | `ENUM('list', 'product')` | Sí, default `'list'` | Estrategia de cálculo |
| `default_pos` | `BOOLEAN` | Default false | Lista por defecto para ventas POS |
| `default_ecommerce` | `BOOLEAN` | Default false | Lista por defecto para ecommerce |
| `active` | `BOOLEAN` | Default true | |
| `soft_deletes` | — | — | |
| `timestamps` | — | — | |

### `price_list_products` (pivot)

| Campo | Tipo | Obligatorio | Nota |
|---|---|---|---|
| `id` | PK | — | |
| `product_id` | FK | Sí | |
| `price_list_id` | FK | Sí | |
| `price` | `DECIMAL(12,2)` | Sí, NOT NULL | Precio materializado (siempre tiene valor) |
| `is_manual` | `BOOLEAN` | Default false | true = el usuario editó este precio a mano |
| `active` | `BOOLEAN` | Default true | |
| `soft_deletes` | — | — | |
| `timestamps` | — | — | |

### `price_history` (nueva)

| Campo | Tipo | Obligatorio | Nota |
|---|---|---|---|
| `id` | PK | — | |
| `product_id` | FK | Sí | |
| `price_list_id` | FK | No | null = cambio de costo |
| `type` | `ENUM` | Sí | `cost_update`, `price_override`, `bulk_recalculation` |
| `old_value` | `DECIMAL(12,2)` | Sí | |
| `new_value` | `DECIMAL(12,2)` | Sí | |
| `user_id` | FK | Sí | |
| `created_at` | TIMESTAMP | Sí | |

---

## Reglas de negocio

### R1: Siempre existe al menos una lista de precios activa
No se puede eliminar la última lista activa. Debe haber al menos una con `default_pos = true`.

### R2: El precio en la pivot nunca es NULL
Siempre se calcula y se guarda. Las queries de venta, ecommerce y reportes leen directamente `price_list_products.price`.

### R3: Estrategia de cálculo (`pricing_strategy`)

| Valor | Comportamiento |
|---|---|
| `list` | Usa siempre `price_list.percentage` para todos los productos. Ignora `product.markup_percent` |
| `product` | Usa `product.markup_percent` si existe; si no tiene, fallback a `price_list.percentage` |

### R4: Fórmula de cálculo

```
Si pricing_strategy == 'list':
    price = product.cost × (1 + price_list.percentage / 100)

Si pricing_strategy == 'product':
    markup = product.markup_percent ?? price_list.percentage
    price = product.cost × (1 + markup / 100)
```

### R5: `is_manual` marca los precios editados a mano
Permite al usuario proteger precios ajustados manualmente durante un recalculado masivo.

### R6: Snapshot en ventas
Al vender, el precio se copia a `sale_products.unit_price`. Los reportes históricos no dependen de cambios futuros en las listas.

---

## Flujos de usuario

### 1. Crear producto

1. El usuario carga `cost` (obligatorio) y `markup_percent` (opcional)
2. Al guardar, se generan automáticamente los precios en **todas las listas activas**
3. Cada lista aplica su `pricing_strategy`:
   - Si `list` → `cost × (1 + list.percentage / 100)`
   - Si `product` → `cost × (1 + (product.markup_percent ?? list.percentage) / 100)`
4. Se crean registros en `price_list_products` con `is_manual = false`

### 2. Editar costo de un producto

1. Se actualiza `products.cost`
2. Se registra en `price_history` con type `cost_update`
3. Se recalculan automáticamente los precios en todas las listas donde `is_manual = false`
4. Los precios con `is_manual = true` quedan intactos (protegidos)
5. Se registra en `price_history` con type `bulk_recalculation` por cada precio que cambió

> Si el usuario necesita forzar el recalculado de precios manuales, debe hacerlo desde el flujo 4 ("Recalcular todos" en la lista).

### 3. Editar precio individual en una lista

1. El usuario modifica el precio de un producto dentro de una lista
2. Se guarda el nuevo valor en `price_list_products.price`
3. Se marca `is_manual = true`
4. Se registra en `price_history` con type `price_override`

### 4. Recalcular precios de una lista (masivo)

El usuario va a la lista y elige "Recalcular precios". Estrategias disponibles:

| Estrategia | Comportamiento |
|---|---|
| **Recalcular todos** | Aplica la fórmula a todos los productos. Sobreescribe manuales. Resetea `is_manual = false` |
| **Solo automáticos** | Recalcula solo donde `is_manual = false`. Respeta los precios editados a mano |

En ambos casos se respeta la `pricing_strategy` de la lista para determinar qué % usar.

### 5. Crear nueva lista de precios

1. El usuario define: nombre, percentage, pricing_strategy, defaults
2. Se generan automáticamente los precios de todos los productos activos
3. Se aplica la fórmula según la `pricing_strategy` elegida
4. Todos los registros se crean con `is_manual = false`

### 6. Venta (POS o Ecommerce)

1. Se selecciona la lista de precios (por defecto `default_pos` o `default_ecommerce` según canal)
2. Se lee `price_list_products.price` directamente
3. Se graba en `sale_products.unit_price` como snapshot histórico
4. La venta guarda `price_list_id` para trazabilidad

---

## Reportes y métricas

- **Margen actual**: `(price_list_products.price - products.cost) / products.cost × 100`
- **Evolución de precios**: consultas sobre `price_history` agrupadas por período
- **Historial de venta**: siempre desde `sale_products.unit_price` (inmutable)

---

## Implementación técnica

### Migraciones necesarias

1. Eliminar `products.price`, hacer `products.cost` NOT NULL, agregar `products.markup_percent`
2. Agregar `price_lists.pricing_strategy` ENUM default 'list'
3. Agregar `price_list_products.is_manual` BOOLEAN default false
4. Crear tabla `price_history`

### Service

`app/Services/PriceService.php` con métodos:

```php
resolvePrice(Product $product, PriceList $priceList): float
generateForProduct(Product $product): void                    // genera en todas las listas
recalculateList(PriceList $priceList, string $strategy): void // 'all' | 'auto_only'
updateCost(Product $product, float $newCost, ?User $user): void
overridePrice(Product $product, PriceList $priceList, float $price, User $user): void
```

### Modelo PriceList — actualizar `generatePrices()`

Mover lógica al `PriceService`. El modelo no debe contener lógica de negocio.

### ProductController@store

Al crear un producto, llamar a `PriceService::generateForProduct()` para poblar todas las listas.
