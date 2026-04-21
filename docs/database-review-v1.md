# Revisión de Base de Datos - V1

## 🔴 Problemas encontrados

### 1. Snapshot de datos en tablas de detalle

Las tablas `order_products`, `product_quotes` y `sale_products` repiten columnas del producto (`supplier_code`, `sku`, `name`, `unit`).

**Veredicto:** Patrón válido para facturación. Guarda el estado del producto al momento de la transacción para que cambios futuros no alteren comprobantes emitidos.

**Decisión:** ✅ Mantener como está.

---

### 2. `tax_id` en `quotes` y `sales`

Ambas tablas tienen `tax_id` (CUIT) además de `customer_id` (FK al cliente).

**Veredicto:** Snapshot intencional para AFIP. El CUIT del comprobante debe quedar fijo aunque el cliente actualice sus datos.

**Decisión:** ✅ Mantener como está.

---

### 3. `orders` vs `purchases` — solapamiento conceptual

- `orders` = pedido/remito a proveedor (con `converted_to_inventory`)
- `purchases` = factura de compra del proveedor

Ambas tienen `supplier_id`, productos y totales. No hay FK entre ellas.

**Decisión:** ⚠️ PENDIENTE — Definir si son etapas del mismo flujo. Si sí, agregar `order_id` en `purchases` o `purchase_id` en `orders`.

---

### 4. `purchase_details` sin snapshot

A diferencia de las otras tablas de detalle, `purchase_details` solo tiene `product_id`, `quantity`, `unit_price`, `subtotal`. No guarda `supplier_code`, `sku`, `name`, `unit`.

**Decisión:** ⚠️ PENDIENTE — Evaluar si se necesita snapshot para compras o si alcanza con la FK al producto.

---

### 5. `stocks.supplier_id` potencialmente redundante

El producto ya tiene `supplier_id`. Tenerlo también en `stocks` solo tiene sentido si un mismo producto puede venir de distintos proveedores con lotes diferentes.

**Decisión:** ⚠️ PENDIENTE — Confirmar si un producto puede tener múltiples proveedores.

---

### 6. `customers.city` y `customers.state` son strings, no FKs

Existen tablas `states` y `cities` con `afip_id`, pero `customers` guarda ciudad y provincia como texto libre en vez de usar `state_id` / `city_id`.

**Decisión:** ⚠️ PENDIENTE — Si se necesitan los `afip_id` para facturación electrónica, convertir a FKs. Si no, evaluar eliminar las tablas `states`/`cities` o dejarlas solo como catálogo de referencia.

---

### 7. `settings.state` también es string libre

Mismo caso que customers.

**Decisión:** ⚠️ PENDIENTE — Unificar criterio con el punto 6.

---

## 🟡 Observaciones menores

| Tabla | Observación | Decisión |
|-------|-------------|----------|
| `sales.date` | Definido como `string` en vez de `date` | ⚠️ Corregir a `date` |
| `brands` / `categories` (y otras) | Tienen `softDeletes` + `active`. Doble mecanismo. | ⚠️ Elegir uno solo |
| `stock_movements` | Relación polimórfica manual (`referenceable_type/id`) sin `morphs()` | Menor — funciona, pero pierde índice automático |
| `deliveries` | `delivery_date` es `date`, `actual_delivery_date` es `timestamp`. Tipos distintos para conceptos similares | ⚠️ Unificar tipo |

---

## 🟢 Lo que está bien

- Naming consistente en inglés con snake_case
- FKs bien definidas con constraints
- Uso correcto de `decimal(12,2)` para montos
- `softDeletes` en tablas de negocio
- Snapshot en tablas de detalle de comprobantes fiscales
- `price_list_products` con unique compuesto
- Separación clara entre tablas centrales y tenant

---

## Decisiones pendientes para cerrar V1

| # | Tema | Opciones |
|---|------|----------|
| 1 | Relación orders ↔ purchases | A) Vincular con FK / B) Mantener independientes |
| 2 | Snapshot en purchase_details | A) Agregar columnas de snapshot / B) Dejar solo FK |
| 3 | stocks.supplier_id | A) Mantener (multi-proveedor) / B) Eliminar (redundante) |
| 4 | city/state en customers | A) Convertir a FKs / B) Mantener strings libres |
| 5 | sales.date tipo string | Corregir a `date` |
| 6 | softDeletes + active | A) Solo softDeletes / B) Solo active / C) Mantener ambos |
| 7 | deliveries tipos de fecha | Unificar a `date` o `timestamp` |
