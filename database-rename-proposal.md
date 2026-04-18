# Propuesta de Renombrado de Base de Datos

Migración de nombres de tablas y campos de español a inglés (snake_case).

## Tablas a Eliminar

- `cuentacorrientes`
- `pagos`
- `recibos`
- `pago_recibo`
- `movimientocuentas`
- `password_resets`
- `roles`

---

## Columnas Estándar

Todas las tablas deben incluir las siguientes columnas:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de actualización |
| deleted_at | timestamp (nullable) | Borrado lógico (soft delete) |
| active | boolean (default true) | Activar/desactivar registro |

> Las columnas marcadas con **✚ nuevo** en cada tabla indican que no existían y deben agregarse.

---

## Renombrado de Tablas y Campos

### 1. `marcas` → `brands`

| Actual | Propuesto |
|--------|-----------|
| marca | name |
| — | **✚ deleted_at** |
| — | **✚ active** |

### 2. `categorias` → `categories`

| Actual | Propuesto |
|--------|-----------|
| categoria | name |
| — | **✚ deleted_at** |
| — | **✚ active** |

### 3. `suppliers` → `suppliers` *(sin cambio de tabla)*

| Actual | Propuesto |
|--------|-----------|
| razonsocial | business_name |
| cuit | tax_id |
| direccion | address |
| telefono | phone |
| — | **✚ active** |

> Ya tiene deleted_at (soft delete).

### 4. `clientes` → `customers`

| Actual | Propuesto |
|--------|-----------|
| razonsocial | business_name |
| documentounico | tax_id |
| direccion | address |
| telefono | phone |
| codigopostal | zip_code |
| localidad | city |
| provincia | state |
| condicioniva | tax_status |
| haber | credit |
| — | **✚ active** |

> Ya tiene deleted_at (soft delete).

### 5. `articulos` → `products`

| Actual | Propuesto |
|--------|-----------|
| codprov | supplier_code |
| codarticulo | sku |
| articulo | name |
| descripcion | description |
| medida | unit |
| precio | price |
| alicuota | tax_rate |
| stockminimo | min_stock |
| marca_id | brand_id |
| categoria_id | category_id |
| codigo_barras | barcode |
| codigo_qr | qr_code |
| — | **✚ active** |

> Ya tiene deleted_at (soft delete).

### 6. `inventarios` → `stocks`

| Actual | Propuesto |
|--------|-----------|
| cantidad | quantity |
| lote | batch |
| vencimiento | expiration_date |
| articulo_id | product_id |
| — | **✚ deleted_at** |
| — | **✚ active** |

### 7. `movimientos` → `stock_movements`

| Actual | Propuesto |
|--------|-----------|
| tipo (`entrada_compra`/`entrada_asistente`/`entrada_ajuste`/`salida_entrega`/`salida_venta_pos`/`salida_ajuste`/`devolucion`) | type (`purchase_entry`/`assistant_entry`/`adjustment_entry`/`delivery_exit`/`pos_sale_exit`/`adjustment_exit`/`return`) |
| cantidad | quantity |
| fecha | date |
| inventario_id | stock_id |
| numcomprobante | voucher_number |
| referenciable_type | referenceable_type |
| referenciable_id | referenceable_id |
| motivo | reason |
| — | **✚ deleted_at** |
| — | **✚ active** |

### 8. `remitos` → `orders`

> Representa órdenes de pedido a proveedores. El número de remito del proveedor se registra opcionalmente en `supplier_receipt_number` al recibir la mercadería.

| Actual | Propuesto |
|--------|-----------|
| ptoventa | pos_number |
| numremito | order_number |
| fecha | date |
| recargo | surcharge |
| bonificacion | discount |
| subtotal | subtotal |
| total | total |
| convertido_inventario | converted_to_inventory |
| — | **✚ supplier_receipt_number** (nullable) |
| — | **✚ deleted_at** |
| — | **✚ active** |

### 9. `articulo_remito` → `order_products`

| Actual | Propuesto |
|--------|-----------|
| codprov | supplier_code |
| codarticulo | sku |
| articulo | name |
| medida | unit |
| cantidad | quantity |
| bonificacion | discount |
| alicuota | tax_rate |
| preciounitario | unit_price |
| subtotal | subtotal |
| lote | batch |
| articulo_id | product_id |
| remito_id | order_id |
| — | **✚ deleted_at** |
| — | **✚ active** |

### 10. `presupuestos` → `quotes`

| Actual | Propuesto |
|--------|-----------|
| ptoventa | pos_number |
| letracomprobante | voucher_letter |
| numpresupuesto | quote_number |
| cuit | tax_id |
| fecha | date |
| bonificacion | discount |
| recargo | surcharge |
| subtotal | subtotal |
| total | total |
| vencimiento | expiration_date |
| cliente_id | customer_id |
| — | **✚ active** |

> Ya tiene deleted_at (soft delete).

### 11. `articulo_presupuesto` → `product_quotes`

| Actual | Propuesto |
|--------|-----------|
| codprov | supplier_code |
| codarticulo | sku |
| articulo | name |
| medida | unit |
| cantidad | quantity |
| preciounitario | unit_price |
| bonificacion | discount |
| alicuota | tax_rate |
| subtotal | subtotal |
| articulo_id | product_id |
| presupuesto_id | quote_id |
| — | **✚ deleted_at** |
| — | **✚ active** |

### 12. `facturas` → `sales`

| Actual | Propuesto |
|--------|-----------|
| ptoventa | pos_number |
| codcomprobante | voucher_code |
| letracomprobante | voucher_letter |
| numfactura | invoice_number |
| cuit | tax_id |
| fecha | date |
| bonificacion | discount |
| recargo | surcharge |
| descuento | additional_discount |
| subtotal | subtotal |
| total | total |
| pagada | payment_status |
| condicionventa | sale_condition |
| comprobanteafip | afip_voucher |
| cae | cae |
| fechavto | due_date |
| codbarra | barcode_string *(código de barras AFIP, distinto del barcode del producto)* |
| compago | payment_code |
| vencimiento_cae | cae_expiration |
| cliente_id | customer_id |
| lista_precio_id | price_list_id |
| tipo_venta | sale_type |
| autorizada_afip | afip_authorized *(boolean)* |
| — | **✚ active** |

> Ya tiene deleted_at (soft delete).

### 13. `articulo_factura` → `sale_products`

| Actual | Propuesto |
|--------|-----------|
| codprov | supplier_code |
| codarticulo | sku |
| articulo | name |
| medida | unit |
| cantidad | quantity |
| bonificacion | discount |
| alicuota | tax_rate |
| preciounitario | unit_price |
| subtotal | subtotal |
| articulo_id | product_id |
| factura_id | sale_id |
| — | **✚ deleted_at** |
| — | **✚ active** |

### 14. `inicialsettings` → `settings`

| Actual | Propuesto |
|--------|-----------|
| cuit | tax_id |
| razonsocial | business_name |
| direccion | address |
| telefono | phone |
| codigopostal | zip_code |
| localidad | city |
| provincia | state |
| condicioniva | tax_status |
| iibb | gross_income_tax |
| inicioactividades | activity_start_date |
| puntoventa | pos_number |
| afip_ambiente | afip_environment |
| nombrefantasia | trade_name |
| domiciliocomercial | commercial_address |
| tagline | tagline |
| logo | logo |
| numfactura | next_invoice_number |
| numremito | next_order_number |
| numpresupuesto | next_quote_number |
| numpago | next_payment_number |
| numrecibo | next_receipt_number |
| mp_access_token | mp_access_token |
| mp_public_key | mp_public_key |
| mp_ambiente | mp_environment |
| — | **✚ deleted_at** |
| — | **✚ active** |

### 15. `provincias` → `states`

| Actual | Propuesto |
|--------|-----------|
| nombre | name |
| id_afip | afip_id |
| — | **✚ deleted_at** |
| — | **✚ active** |

### 16. `localidades` → `cities`

| Actual | Propuesto |
|--------|-----------|
| nombre | name |
| provincia_id | state_id |
| id_afip | afip_id |
| — | **✚ deleted_at** |
| — | **✚ active** |

### 17. `factura_pagos` → `sale_payments`

| Actual | Propuesto |
|--------|-----------|
| factura_id | sale_id |
| monto | amount |
| metodo_pago | payment_method |
| fecha_pago | payment_date |
| observaciones | notes |
| — | **✚ deleted_at** |
| — | **✚ active** |

### 18. `entregas` → `deliveries`

| Actual | Propuesto |
|--------|-----------|
| factura_id | sale_id |
| articulo_id | product_id |
| cantidad | quantity |
| fecha_entrega | delivery_date |
| observaciones | notes |
| estado (`pendiente`/`entregada`/`cancelada`) | status (`pending`/`delivered`/`cancelled`) |
| fecha_entrega_real | actual_delivery_date |
| — | **✚ deleted_at** |
| — | **✚ active** |

### 19. `listas_precios` → `price_lists`

| Actual | Propuesto |
|--------|-----------|
| nombre | name |
| porcentaje | percentage |
| — | **✚ deleted_at** |
| — | **✚ active** |

### 20. `articulo_lista_precio` → `price_list_products`

| Actual | Propuesto |
|--------|-----------|
| articulo_id | product_id |
| lista_precio_id | price_list_id |
| precio | price |
| — | **✚ deleted_at** |
| — | **✚ active** |

### 21. `articulo_imagenes` → `product_images`

| Actual | Propuesto |
|--------|-----------|
| articulo_id | product_id |
| nombre_archivo | filename |
| ruta | path |
| ruta_thumb | thumbnail_path |
| es_principal | is_primary |
| orden | sort_order |
| — | **✚ deleted_at** |
| — | **✚ active** |

### 22. `compras` → `purchases`

| Actual | Propuesto |
|--------|-----------|
| numero_remito | order_number |
| fecha | date |
| — | **✚ deleted_at** |
| — | **✚ active** |

### 23. `compra_detalles` → `purchase_details`

| Actual | Propuesto |
|--------|-----------|
| compra_id | purchase_id |
| articulo_id | product_id |
| cantidad | quantity |
| precio_unitario | unit_price |
| subtotal | subtotal |
| — | **✚ deleted_at** |
| — | **✚ active** |

---

## Tablas sin cambios *(ya en inglés/convención Laravel)*

Estas tablas también deben cumplir el estándar de columnas (deleted_at, active) si no las tienen.

- `users` (campos: role_id, tour_completed — ya ok)
- `carts`
- `telegram_users`
- `telegram_conversations`
- `activity_log`
- `cache`
- `sessions`
- `jobs`
- `domains`

### `tenants` — columnas a renombrar

| Actual | Propuesto |
|--------|-----------|
| razonsocial | business_name |
| cuit | tax_id |

> `plan` y `status` ya están en inglés. La columna `data` (JSON) no cambia.

---

## Resumen

| Métrica | Cantidad |
|---------|----------|
| Tablas renombradas | 23 |
| Tablas eliminadas | 7 |
| Campos renombrados | ~110 |
| Columnas deleted_at agregadas | 18 |
| Columnas active agregadas | 23 |
| Tablas sin cambios | 10 |
