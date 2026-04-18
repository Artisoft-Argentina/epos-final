# Plan de Migración de Base de Datos — EPOS

## Resumen

Este plan detalla cómo eliminar las migraciones actuales (tenant + central) y recrearlas con los nuevos nombres de tablas y columnas en inglés, manteniendo todas las relaciones de BD y modelos, y actualizando seeders.

La estrategia es **destruir y reconstruir**: borrar todos los archivos de migración existentes y crear uno nuevo por tabla, con los nombres finales ya en inglés. No se usan migraciones incrementales (renameColumn/renameTable) porque estamos en desarrollo y podemos resetear la BD.

---

## Fase 0 — Preparación (antes de tocar código)

1. ~~**Crear branch** `feature/db-rename` desde `main`~~ ✅ Ya creada
2. **Respaldo**: `php artisan schema:dump` o export SQL manual de la BD central y una tenant de referencia
3. **Verificar** que no haya datos productivos irrecuperables (estamos en dev/QA)

---

## Fase 1 — Eliminar migraciones existentes

### 1.1 Migraciones tenant a eliminar (66 archivos)

Borrar **todos** los archivos dentro de `database/migrations/tenant/`:

```
2014_10_12_100000_create_password_resets_table.php
2019_05_14_133132_create_marcas_table.php
2019_05_14_133359_create_categorias_table.php
2019_05_14_133530_create_suppliers_table.php
2019_05_14_135101_create_clientes_table.php
2019_05_14_135853_create_articulos_table.php
2019_05_14_140325_create_inventarios_table.php
2019_05_14_140347_create_movimientos_table.php
2019_05_14_141505_create_remitos_table.php
2019_05_14_141832_create_articulo_remito_table.php
2019_05_14_142138_create_presupuestos_table.php
2019_05_14_142937_create_articulo_presupuesto_table.php
2019_05_14_144632_create_facturas_table.php
2019_05_14_150017_create_articulo_factura_table.php
2019_05_31_231018_create_cuentacorrientes_table.php
2019_06_01_232356_create_pagos_table.php
2019_06_01_234054_create_recibos_table.php
2019_06_01_234802_create_pago_recibo_table.php
2019_06_02_000420_create_movimientocuentas_table.php
2019_07_16_195930_create_inicialsettings_table.php
0001_01_01_000000_create_users_table.php
0001_01_01_000001_create_cache_table.php
2025_01_03_111705_alter_user_id_in_facturas_table.php
2025_01_03_113302_alter_user_id_in_movimientos_table.php
2025_01_03_113537_alter_user_id_in_movimientocuentas_table.php
2025_01_03_113653_alter_user_id_in_presupuestos_table.php
2025_08_21_111235_add_role_id_to_users_table.php
2025_08_21_115536_create_provincias_table.php
2025_08_21_115550_create_localidades_table.php
2025_08_22_114150_create_factura_pagos_table.php
2025_08_22_121356_create_entregas_table.php
2025_08_27_210113_create_listas_precios_table.php
2025_08_27_210143_create_articulo_lista_precio_table.php
2025_08_27_211214_add_lista_precio_id_to_facturas_table.php
2025_08_28_121341_create_compras_table.php
2025_08_28_121342_create_compra_detalles_table.php
2025_08_28_123756_add_supplier_id_to_articulos_table.php
2025_08_28_134423_update_decimal_precision_in_remito_tables.php
2025_08_28_135229_add_convertido_inventario_to_remitos_table.php
2025_08_27_213915_create_articulo_imagenes_table.php
2025_08_29_115325_add_logo_to_inicialsettings_table.php
2025_08_29_202926_add_vencimiento_cae_to_facturas_table.php
2025_08_29_210131_add_id_afip_to_provincias_and_localidades.php
2025_09_02_222152_create_activity_log_table.php
2025_09_02_222153_add_event_column_to_activity_log_table.php
2025_09_02_222154_add_batch_uuid_column_to_activity_log_table.php
2025_10_30_112953_add_autorizada_afip_to_facturas_table.php
2025_10_30_143658_add_letracomprobante_to_presupuestos_table.php
2025_11_03_111000_add_descuento_to_facturas_table.php
2025_11_03_111814_increase_decimal_precision_in_facturas_table.php
2025_10_30_113049_change_cae_to_string_in_facturas_table.php
2026_01_14_191540_create_carts_table.php
2026_02_03_202207_add_estado_to_entregas_table.php
2026_02_04_000001_create_telegram_users_table.php
2026_02_04_000002_create_telegram_conversations_table.php
2026_02_04_000003_assign_default_role_to_users.php
2026_02_05_233615_add_afip_fields_to_inicialsettings_table.php
2026_02_06_193247_add_thumbnail_to_articulo_imagenes_table.php
2026_02_06_202737_add_codigo_fields_to_articulos_table.php
2026_02_24_112220_add_tour_completed_to_users_table.php
2026_04_01_000001_add_mercadopago_fields_to_inicialsettings_table.php
2026_04_13_000001_alter_movimientos_add_traceability_fields.php
```

### 1.2 Migraciones central a eliminar (7 archivos)

Borrar **todos** los archivos dentro de `database/migrations/` (raíz, no tenant):

```
0001_01_01_000001_create_cache_table.php
0001_01_01_000002_create_jobs_table.php
2019_09_15_000010_create_tenants_table.php
2019_09_15_000020_create_domains_table.php
2026_02_25_000001_create_central_users_table.php
2026_02_25_192051_add_custom_columns_to_tenants_table.php
2026_02_25_200000_create_sessions_table_central.php
```

---

## Checkpoint A — Verificar Fase 1

Antes de continuar, confirmar que no quedan archivos de migración viejos:
```bash
ls database/migrations/tenant/
ls database/migrations/
```
Ambos directorios deben estar vacíos (excepto el subdirectorio `tenant/` en el caso de la raíz).

---

## Fase 2 — Crear nuevas migraciones

Crear un único archivo por tabla con timestamp ordenado por dependencias. Todos en `database/migrations/tenant/`.

### 2.1 Migraciones centrales (en `database/migrations/`)

```
0001_01_01_000001_create_cache_table.php
0001_01_01_000002_create_jobs_table.php
0001_01_01_000003_create_sessions_table.php
0001_01_01_000004_create_tenants_table.php
0001_01_01_000005_create_domains_table.php
0001_01_01_000006_create_central_users_table.php
```

#### `create_tenants_table` (columnas renombradas)

```php
Schema::create('tenants', function (Blueprint $table) {
    $table->string('id')->primary();
    $table->string('business_name')->nullable();   // razonsocial → business_name
    $table->string('tax_id', 20)->nullable();       // cuit → tax_id
    $table->string('plan', 20)->default('basic');
    $table->string('status', 20)->default('active');
    $table->timestamps();
    $table->json('data')->nullable();
});
```

> Las demás migraciones centrales (`cache`, `jobs`, `sessions`, `domains`, `central_users`) no tienen cambios de esquema, se recrean idénticas.

### 2.2 Orden de creación tenant (respetando FK)

```
# Tablas independientes (sin FK)
0001_01_01_000001_create_users_table.php
0001_01_01_000002_create_cache_table.php
0001_01_01_000003_create_activity_log_table.php
0001_01_01_000004_create_password_reset_tokens_table.php
0001_01_01_000005_create_roles_table.php
0001_01_01_000006_create_brands_table.php            (marcas → brands)
0001_01_01_000007_create_categories_table.php        (categorias → categories)
0001_01_01_000008_create_suppliers_table.php          (sin rename de tabla, solo columnas)
0001_01_01_000009_create_states_table.php             (provincias → states)
0001_01_01_000010_create_settings_table.php           (inicialsettings → settings)
0001_01_01_000011_create_price_lists_table.php        (listas_precios → price_lists)

# Tablas con FK a las anteriores
0001_01_01_000012_create_customers_table.php          (clientes → customers)
0001_01_01_000013_create_products_table.php            (articulos → products)
0001_01_01_000014_create_stocks_table.php              (inventarios → stocks)
0001_01_01_000015_create_cities_table.php              (localidades → cities, FK a states)
0001_01_01_000016_create_orders_table.php              (remitos → orders, FK a suppliers + users)
0001_01_01_000017_create_quotes_table.php               (presupuestos → quotes, FK a customers + users)
0001_01_01_000018_create_sales_table.php               (facturas → sales, FK a customers + users + price_lists)
0001_01_01_000019_create_purchases_table.php            (compras → purchases, FK a suppliers)

# Tablas pivote / detalle (FK a las anteriores)
0001_01_01_000020_create_order_products_table.php      (articulo_remito → order_products, FK a orders + products)
0001_01_01_000021_create_product_quotes_table.php       (articulo_presupuesto → product_quotes, FK a quotes + products)
0001_01_01_000022_create_sale_products_table.php        (articulo_factura → sale_products, FK a sales + products)
0001_01_01_000023_create_purchase_details_table.php     (compra_detalles → purchase_details, FK a purchases + products)
0001_01_01_000024_create_stock_movements_table.php      (movimientos → stock_movements, FK a stocks + users)
0001_01_01_000025_create_sale_payments_table.php         (factura_pagos → sale_payments, FK a sales)
0001_01_01_000026_create_deliveries_table.php            (entregas → deliveries, FK a sales + products)
0001_01_01_000027_create_product_images_table.php       (articulo_imagenes → product_images, FK a products)
0001_01_01_000028_create_price_list_products_table.php   (articulo_lista_precio → price_list_products, FK a price_lists + products)
0001_01_01_000029_create_carts_table.php                 (sin cambios de tabla, actualizar FKs)
0001_01_01_000030_create_telegram_users_table.php        (sin cambios)
0001_01_01_000031_create_telegram_conversations_table.php (sin cambios)

# Tablas ELIMINADAS (no se recrean):
# cuentacorrientes, pagos, recibos, pago_recibo, movimientocuentas, password_resets
# roles: se mantiene temporalmente hasta SCRUM-55 (ver Riesgos)
```

### 2.3 Detalle de cada migración nueva

A continuación, el esquema completo de cada tabla con los nuevos nombres. Las columnas estándar (`created_at`, `updated_at`, `deleted_at`, `active`) se incluyen en cada tabla según corresponda.

> **NOTA**: Se indican los nombres de columnas antiguas como comentario para referencia cruzada.

#### `create_roles_table` (TEMPORAL — se eliminará con SCRUM-55)

> **Desviación intencional del proposal**: `roles` figura en "Tablas a Eliminar" del proposal, pero se mantiene porque `users.role_id` tiene FK activa hacia ella. Se eliminará cuando se implemente Spatie Permissions (SCRUM-55), que reemplazará este sistema de roles propio.

```php
Schema::create('roles', function (Blueprint $table) {
    $table->id();
    $table->string('role');
    $table->text('permission')->nullable();
    $table->text('description')->nullable();
    $table->timestamps();
});
```

#### `create_brands_table` (antes `marcas`)

```php
Schema::create('brands', function (Blueprint $table) {
    $table->id();
    $table->string('name');                    // marca → name
    $table->softDeletes();                      // ✚ nuevo
    $table->boolean('active')->default(true);   // ✚ nuevo
    $table->timestamps();
});
```

#### `create_categories_table` (antes `categorias`)

```php
Schema::create('categories', function (Blueprint $table) {
    $table->id();
    $table->string('name');                    // categoria → name
    $table->softDeletes();                      // ✚ nuevo
    $table->boolean('active')->default(true);   // ✚ nuevo
    $table->timestamps();
});
```

#### `create_suppliers_table` (sin rename de tabla, solo columnas)

```php
Schema::create('suppliers', function (Blueprint $table) {
    $table->id();
    $table->string('business_name');           // razonsocial → business_name
    $table->bigInteger('tax_id');               // cuit → tax_id
    $table->string('address');                   // direccion → address
    $table->string('phone');                     // telefono → phone
    $table->string('email')->nullable();
    $table->boolean('active')->default(true);    // ✚ nuevo
    $table->softDeletes();                       // ya existía
    $table->timestamps();
});
```

#### `create_states_table` (antes `provincias`)

```php
Schema::create('states', function (Blueprint $table) {
    $table->id();
    $table->string('name');                    // nombre → name
    $table->integer('afip_id')->nullable();     // id_afip → afip_id
    $table->softDeletes();                      // ✚ nuevo
    $table->boolean('active')->default(true);   // ✚ nuevo
    $table->timestamps();
});
```

#### `create_settings_table` (antes `inicialsettings`)

```php
Schema::create('settings', function (Blueprint $table) {
    $table->id();
    $table->bigInteger('tax_id')->nullable();                     // cuit → tax_id
    $table->string('business_name')->nullable();                   // razonsocial → business_name
    $table->string('address')->nullable();                          // direccion → address
    $table->string('phone')->nullable();                           // telefono → phone
    $table->string('email')->nullable();
    $table->integer('zip_code')->nullable();                       // codigopostal → zip_code
    $table->string('city')->nullable();                            // localidad → city
    $table->string('state')->nullable();                           // provincia → state
    $table->string('tax_status')->nullable();                     // condicioniva → tax_status
    $table->string('gross_income_tax')->nullable();                // iibb → gross_income_tax
    $table->string('activity_start_date')->nullable();             // inicioactividades → activity_start_date
    $table->integer('pos_number')->nullable();                     // puntoventa → pos_number
    $table->string('afip_environment')->default('homologacion');   // afip_ambiente → afip_environment
    $table->string('trade_name')->nullable();                      // nombrefantasia → trade_name
    $table->string('commercial_address')->nullable();               // domiciliocomercial → commercial_address
    $table->string('tagline')->nullable();
    $table->string('logo')->nullable();
    $table->bigInteger('next_invoice_number')->nullable();          // numfactura → next_invoice_number
    $table->bigInteger('next_order_number')->nullable();             // numremito → next_order_number
    $table->bigInteger('next_quote_number')->nullable();             // numpresupuesto → next_quote_number
    $table->bigInteger('next_payment_number')->nullable();            // numpago → next_payment_number
    $table->bigInteger('next_receipt_number')->nullable();            // numrecibo → next_receipt_number
    $table->string('mp_access_token')->nullable();
    $table->string('mp_public_key')->nullable();
    $table->string('mp_environment')->default('sandbox');            // mp_ambiente → mp_environment
    $table->softDeletes();                                            // ✚ nuevo
    $table->boolean('active')->default(true);                         // ✚ nuevo
    $table->timestamps();
});
```

#### `create_price_lists_table` (antes `listas_precios`)

```php
Schema::create('price_lists', function (Blueprint $table) {
    $table->id();
    $table->string('name');                         // nombre → name
    $table->decimal('percentage', 8, 2)->default(0); // porcentaje → percentage
    $table->boolean('default_pos')->default(false);
    $table->boolean('default_ecommerce')->default(false);
    $table->softDeletes();                           // ✚ nuevo
    $table->boolean('active')->default(true);        // ✚ nuevo
    $table->timestamps();
});
```

#### `create_customers_table` (antes `clientes`)

```php
Schema::create('customers', function (Blueprint $table) {
    $table->id();
    $table->string('business_name');              // razonsocial → business_name
    $table->bigInteger('tax_id')->nullable();      // documentounico → tax_id
    $table->string('address');                      // direccion → address
    $table->string('phone')->nullable();             // telefono → phone
    $table->string('email')->nullable();
    $table->integer('zip_code');                    // codigopostal → zip_code
    $table->string('city');                          // localidad → city
    $table->string('state');                         // provincia → state
    $table->string('tax_status');                    // condicioniva → tax_status
    $table->decimal('credit', 8, 2)->default(0);    // haber → credit
    $table->boolean('active')->default(true);        // ✚ nuevo
    $table->softDeletes();                            // ya existía
    $table->timestamps();
});
```

#### `create_products_table` (antes `articulos`)

```php
Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->string('supplier_code')->nullable();     // codprov → supplier_code
    $table->string('sku');                             // codarticulo → sku
    $table->string('name');                             // articulo → name
    $table->text('description');                        // descripcion → description
    $table->string('unit');                              // medida → unit
    $table->decimal('price', 8, 2);                     // precio → price
    $table->decimal('tax_rate', 8, 2);                  // alicuota → tax_rate
    $table->integer('min_stock');                        // stockminimo → min_stock
    $table->foreignId('brand_id')->constrained('brands');            // marca_id → brand_id
    $table->foreignId('category_id')->constrained('categories');    // categoria_id → category_id
    $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
    $table->string('barcode')->nullable()->unique();    // codigo_barras → barcode
    $table->string('qr_code')->nullable()->unique();     // codigo_qr → qr_code
    $table->boolean('active')->default(true);             // ✚ nuevo
    $table->softDeletes();                                // ya existía
    $table->timestamps();
});
```

#### `create_stocks_table` (antes `inventarios`)

```php
Schema::create('stocks', function (Blueprint $table) {
    $table->id();
    $table->integer('quantity');                              // cantidad → quantity
    $table->integer('batch')->nullable();                      // lote → batch
    $table->date('expiration_date')->nullable();                // vencimiento → expiration_date
    $table->foreignId('product_id')->constrained('products');       // articulo_id → product_id
    $table->foreignId('supplier_id')->nullable()->constrained('suppliers');
    $table->softDeletes();                                      // ✚ nuevo
    $table->boolean('active')->default(true);                  // ✚ nuevo
    $table->timestamps();
});
```

#### `create_cities_table` (antes `localidades`)

```php
Schema::create('cities', function (Blueprint $table) {
    $table->id();
    $table->string('name');                                  // nombre → name
    $table->foreignId('state_id')->constrained('states')->cascadeOnDelete();  // provincia_id → state_id
    $table->integer('afip_id')->nullable();                   // id_afip → afip_id
    $table->softDeletes();                                     // ✚ nuevo
    $table->boolean('active')->default(true);                 // ✚ nuevo
    $table->timestamps();
});
```

#### `create_orders_table` (antes `remitos`)

> **Nota semántica**: `orders` representa órdenes de pedido a proveedores (no remitos de entrega). El número de remito del proveedor se registra opcionalmente en `supplier_receipt_number` cuando llega la mercadería.

```php
Schema::create('orders', function (Blueprint $table) {
    $table->id();
    $table->integer('pos_number');                                    // ptoventa → pos_number
    $table->integer('order_number');                                   // numremito → order_number
    $table->string('date');                                            // fecha → date
    $table->decimal('surcharge', 15, 2);                               // recargo → surcharge
    $table->decimal('discount', 15, 2);                                // bonificacion → discount
    $table->decimal('subtotal', 15, 2);
    $table->decimal('total', 15, 2);
    $table->string('supplier_receipt_number')->nullable();             // ✚ nuevo: nro de remito del proveedor
    $table->boolean('converted_to_inventory')->default(false);         // convertido_inventario → converted_to_inventory
    $table->foreignId('supplier_id')->constrained('suppliers');
    $table->foreignId('user_id')->constrained('users');
    $table->softDeletes();                                             // ✚ nuevo
    $table->boolean('active')->default(true);                         // ✚ nuevo
    $table->timestamps();
});
```

#### `create_quotes_table` (antes `presupuestos`)

```php
Schema::create('quotes', function (Blueprint $table) {
    $table->id();
    $table->integer('pos_number');                            // ptoventa → pos_number
    $table->string('voucher_letter');                          // letracomprobante → voucher_letter
    $table->integer('quote_number');                           // numpresupuesto → quote_number
    $table->bigInteger('tax_id');                              // cuit → tax_id
    $table->string('date');                                    // fecha → date
    $table->decimal('discount', 8, 2);                         // bonificacion → discount
    $table->decimal('surcharge', 8, 2);                       // recargo → surcharge
    $table->decimal('subtotal', 8, 2);
    $table->decimal('total', 8, 2);
    $table->string('expiration_date')->nullable();             // vencimiento → expiration_date
    $table->foreignId('customer_id')->constrained('customers');  // cliente_id → customer_id
    $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
    $table->boolean('active')->default(true);                 // ✚ nuevo
    $table->softDeletes();                                     // ya existía
    $table->timestamps();
});
```

#### `create_sales_table` (antes `facturas`)

```php
Schema::create('sales', function (Blueprint $table) {
    $table->id();
    $table->integer('pos_number');                              // ptoventa → pos_number
    $table->integer('voucher_code')->nullable();                  // codcomprobante → voucher_code
    $table->string('voucher_letter');                            // letracomprobante → voucher_letter
    $table->bigInteger('invoice_number');                        // numfactura → invoice_number
    $table->bigInteger('tax_id');                                 // cuit → tax_id
    $table->string('date');                                       // fecha → date
    $table->decimal('discount', 12, 2);                           // bonificacion → discount
    $table->decimal('surcharge', 12, 2);                          // recargo → surcharge
    $table->decimal('additional_discount', 12, 2)->default(0);     // descuento → additional_discount
    $table->decimal('subtotal', 12, 2);
    $table->decimal('total', 12, 2);
    $table->string('payment_status');                              // pagada → payment_status
    $table->string('sale_condition');                               // condicionventa → sale_condition
    $table->bigInteger('afip_voucher')->nullable();                 // comprobanteafip → afip_voucher
    $table->string('cae', 50)->nullable();                           // cae → cae (cambio de tipo)
    $table->string('cae_expiration')->nullable();                     // vencimiento_cae → cae_expiration
    $table->date('due_date')->nullable();                              // fechavto → due_date
    $table->string('barcode_string')->nullable();                      // codbarra → barcode_string (código de barras AFIP, distinto del barcode del producto)
    $table->string('payment_code')->nullable();                        // compago → payment_code
    $table->enum('sale_type', ['pos', 'ecommerce'])->default('pos');  // tipo_venta → sale_type
    $table->boolean('afip_authorized')->default(false);              // autorizada_afip → afip_authorized
    $table->foreignId('customer_id')->constrained('customers');       // cliente_id → customer_id
    $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignId('price_list_id')->nullable()->constrained('price_lists')->nullOnDelete();  // lista_precio_id → price_list_id
    $table->boolean('active')->default(true);                         // ✚ nuevo
    $table->softDeletes();                                              // ya existía
    $table->timestamps();
});
```

#### `create_order_products_table` (antes `articulo_remito`)

```php
Schema::create('order_products', function (Blueprint $table) {
    $table->id();
    $table->string('supplier_code')->nullable();                // codprov → supplier_code
    $table->string('sku');                                       // codarticulo → sku
    $table->string('name');                                       // articulo → name
    $table->string('unit');                                       // medida → unit
    $table->integer('quantity');                                  // cantidad → quantity
    $table->decimal('discount', 15, 2);                          // bonificacion → discount
    $table->decimal('tax_rate', 8, 2);                           // alicuota → tax_rate
    $table->decimal('unit_price', 15, 2);                        // preciounitario → unit_price
    $table->decimal('subtotal', 15, 2);
    $table->integer('batch')->nullable();                         // lote → batch
    $table->foreignId('product_id')->constrained('products');     // articulo_id → product_id
    $table->foreignId('order_id')->constrained('orders');          // remito_id → order_id
    $table->softDeletes();                                        // ✚ nuevo
    $table->boolean('active')->default(true);                    // ✚ nuevo
    $table->timestamps();
});
```

#### `create_product_quotes_table` (antes `articulo_presupuesto`)

```php
Schema::create('product_quotes', function (Blueprint $table) {
    $table->id();
    $table->string('supplier_code')->nullable();                // codprov → supplier_code
    $table->string('sku');                                       // codarticulo → sku
    $table->string('name');                                       // articulo → name
    $table->string('unit');                                       // medida → unit
    $table->integer('quantity');                                  // cantidad → quantity
    $table->decimal('unit_price', 8, 2);                          // preciounitario → unit_price
    $table->decimal('discount', 8, 2);                           // bonificacion → discount
    $table->decimal('tax_rate', 8, 2);                           // alicuota → tax_rate
    $table->decimal('subtotal', 8, 2);
    $table->foreignId('product_id')->constrained('products');     // articulo_id → product_id
    $table->foreignId('quote_id')->constrained('quotes');          // presupuesto_id → quote_id
    $table->softDeletes();                                        // ✚ nuevo
    $table->boolean('active')->default(true);                    // ✚ nuevo
    $table->timestamps();
});
```

#### `create_sale_products_table` (antes `articulo_factura`)

```php
Schema::create('sale_products', function (Blueprint $table) {
    $table->id();
    $table->string('supplier_code')->nullable();                // codprov → supplier_code
    $table->string('sku');                                       // codarticulo → sku
    $table->string('name');                                       // articulo → name
    $table->string('unit');                                       // medida → unit
    $table->integer('quantity');                                  // cantidad → quantity
    $table->decimal('discount', 8, 2);                           // bonificacion → discount
    $table->decimal('tax_rate', 8, 2);                           // alicuota → tax_rate
    $table->decimal('unit_price', 8, 2);                          // preciounitario → unit_price
    $table->decimal('subtotal', 8, 2);
    $table->foreignId('product_id')->constrained('products');     // articulo_id → product_id
    $table->foreignId('sale_id')->constrained('sales');            // factura_id → sale_id
    $table->softDeletes();                                        // ✚ nuevo
    $table->boolean('active')->default(true);                    // ✚ nuevo
    $table->timestamps();
});
```

#### `create_purchases_table` (antes `compras`)

```php
Schema::create('purchases', function (Blueprint $table) {
    $table->id();
    $table->string('order_number');                               // numero_remito → order_number
    $table->date('date');                                          // fecha → date
    $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
    $table->decimal('subtotal', 10, 2)->default(0);
    $table->decimal('total', 10, 2)->default(0);
    $table->text('notes')->nullable();                              // observaciones → notes
    $table->softDeletes();                                          // ✚ nuevo
    $table->boolean('active')->default(true);                      // ✚ nuevo
    $table->timestamps();
});
```

#### `create_purchase_details_table` (antes `compra_detalles`)

```php
Schema::create('purchase_details', function (Blueprint $table) {
    $table->id();
    $table->foreignId('purchase_id')->constrained('purchases')->cascadeOnDelete();  // compra_id → purchase_id
    $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();      // articulo_id → product_id
    $table->integer('quantity');                                  // cantidad → quantity
    $table->decimal('unit_price', 10, 2);                          // precio_unitario → unit_price
    $table->decimal('subtotal', 10, 2);
    $table->softDeletes();                                        // ✚ nuevo
    $table->boolean('active')->default(true);                     // ✚ nuevo
    $table->timestamps();
});
```

#### `create_stock_movements_table` (antes `movimientos`)

```php
Schema::create('stock_movements', function (Blueprint $table) {
    $table->id();
    $table->enum('type', [
        'purchase_entry',    // entrada_compra
        'assistant_entry',   // entrada_asistente
        'adjustment_entry',  // entrada_ajuste
        'delivery_exit',     // salida_entrega
        'pos_sale_exit',     // salida_venta_pos
        'adjustment_exit',   // salida_ajuste
        'return',            // devolucion
    ]);                                                             // tipo → type
    $table->integer('quantity');                                    // cantidad → quantity
    $table->string('date');                                          // fecha → date
    $table->foreignId('stock_id')->constrained('stocks');            // inventario_id → stock_id
    $table->bigInteger('voucher_number')->nullable();                 // numcomprobante → voucher_number
    $table->string('referenceable_type')->nullable();
    $table->unsignedBigInteger('referenceable_id')->nullable();
    $table->string('reason')->nullable();                              // motivo → reason
    $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
    $table->softDeletes();                                              // ✚ nuevo
    $table->boolean('active')->default(true);                          // ✚ nuevo
    $table->timestamps();
});
```

#### `create_sale_payments_table` (antes `factura_pagos`)

```php
Schema::create('sale_payments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('sale_id')->constrained('sales');              // factura_id → sale_id
    $table->decimal('amount', 10, 2);                                 // monto → amount
    $table->string('payment_method');                                  // metodo_pago → payment_method
    $table->date('payment_date');                                      // fecha_pago → payment_date
    $table->text('notes')->nullable();                                  // observaciones → notes
    $table->softDeletes();                                              // ✚ nuevo
    $table->boolean('active')->default(true);                         // ✚ nuevo
    $table->timestamps();
});
```

#### `create_deliveries_table` (antes `entregas`)

```php
Schema::create('deliveries', function (Blueprint $table) {
    $table->id();
    $table->foreignId('sale_id')->constrained('sales');              // factura_id → sale_id
    $table->foreignId('product_id')->constrained('products');          // articulo_id → product_id
    $table->integer('quantity');                                      // cantidad → quantity
    $table->date('delivery_date');                                    // fecha_entrega → delivery_date
    $table->text('notes')->nullable();                                  // observaciones → notes
    $table->enum('status', ['pending', 'delivered', 'cancelled'])->default('pending');  // valores en inglés
    $table->timestamp('actual_delivery_date')->nullable();             // fecha_entrega_real → actual_delivery_date
    $table->softDeletes();                                              // ✚ nuevo
    $table->boolean('active')->default(true);                         // ✚ nuevo
    $table->timestamps();
});
```

#### `create_product_images_table` (antes `articulo_imagenes`)

```php
Schema::create('product_images', function (Blueprint $table) {
    $table->id();
    $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();  // articulo_id → product_id
    $table->string('filename');                                       // nombre_archivo → filename
    $table->string('path');                                           // ruta → path
    $table->string('thumbnail_path')->nullable();                      // ruta_thumb → thumbnail_path
    $table->boolean('is_primary')->default(false);                     // es_principal → is_primary
    $table->integer('sort_order')->default(0);                          // orden → sort_order
    $table->softDeletes();                                              // ✚ nuevo
    $table->boolean('active')->default(true);                         // ✚ nuevo
    $table->timestamps();
});
```

#### `create_price_list_products_table` (antes `articulo_lista_precio`)

```php
Schema::create('price_list_products', function (Blueprint $table) {
    $table->id();
    $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();       // articulo_id → product_id
    $table->foreignId('price_list_id')->constrained('price_lists')->cascadeOnDelete();  // lista_precio_id → price_list_id
    $table->decimal('price', 10, 2);
    $table->softDeletes();                                               // ✚ nuevo
    $table->boolean('active')->default(true);                           // ✚ nuevo
    $table->timestamps();
    $table->unique(['product_id', 'price_list_id']);
});
```

#### `create_carts_table` (sin rename de tabla, actualizar FKs)

```php
Schema::create('carts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->nullable()->constrained('users');
    $table->foreignId('product_id')->constrained('products');       // articulo_id → product_id
    $table->integer('quantity')->default(1);
    $table->string('session_id')->nullable();
    $table->timestamps();
});
```

---

## Checkpoint B — Verificar migraciones

```bash
php artisan migrate:fresh
```

Debe completar sin errores. **No usar `--seed` todavía.** Verificar que todas las tablas existen con la estructura correcta antes de continuar con modelos y seeders.

---

## Fase 3 — Actualizar Modelos

### 3.1 Mapa de renombrado de modelos

| Archivo actual | Nuevo archivo | Nueva tabla |
|---|---|---|
| `Articulo.php` | `Product.php` | `products` |
| `ArticuloImagen.php` | `ProductImage.php` | `product_images` |
| `ArticuloRemito.php` | `OrderProduct.php` | `order_products` |
| `Categoria.php` | `Category.php` | `categories` |
| `Cliente.php` | `Customer.php` | `customers` |
| `Compra.php` | `Purchase.php` | `purchases` |
| `CompraDetalle.php` | `PurchaseDetail.php` | `purchase_details` |
| `Entrega.php` | `Delivery.php` | `deliveries` |
| `Factura.php` | `Sale.php` | `sales` |
| `FacturaPago.php` | `SalePayment.php` | `sale_payments` |
| `InicialSetting.php` | `Setting.php` | `settings` |
| `Inventario.php` | `Stock.php` | `stocks` |
| `ListaPrecio.php` | `PriceList.php` | `price_lists` |
| `Localidad.php` | `City.php` | `cities` |
| `Marca.php` | `Brand.php` | `brands` |
| `Movimiento.php` | `StockMovement.php` | `stock_movements` |
| `Presupuesto.php` | `Quote.php` | `quotes` |
| `Provincia.php` | `State.php` | `states` |
| `Remito.php` | `Order.php` | `orders` |
| `Supplier.php` | `Supplier.php` | `suppliers` (sin cambio de nombre) |
| `Role.php` | `Role.php` | `roles` (temporal) |
| `User.php` | `User.php` | `users` (sin cambio) |
| `Cart.php` | `Cart.php` | `carts` (cambiar `articulo_id` → `product_id`) |
| `Tenant.php` | `Tenant.php` | `tenants` (renombrar columnas) |

### 3.2 Cambios clave en relaciones

| Relación actual | Nueva relación |
|---|---|
| `Product::belongsToMany(PriceList::class, 'articulo_lista_precio')` | `Product::belongsToMany(PriceList::class, 'price_list_products')` con `product_id`/`price_list_id` |
| `Product::hasMany(ProductImage::class)` | `Product::hasMany(ProductImage::class)` con `product_id` |
| `Sale::belongsToMany(Product::class, 'articulo_factura')` | `Sale::belongsToMany(Product::class, 'sale_products')` con `sale_id`/`product_id` y pivote renombrado |
| `Sale::hasMany(SalePayment::class)` | `Sale::hasMany(SalePayment::class)` con `sale_id` |
| `Sale::hasMany(Delivery::class)` | `Sale::hasMany(Delivery::class)` con `sale_id` |
| `Sale::belongsTo(Customer::class)` | `Sale::belongsTo(Customer::class)` con `customer_id` |
| `Quote::belongsToMany(Product::class, 'articulo_presupuesto')` | `Quote::belongsToMany(Product::class, 'product_quotes')` con `quote_id`/`product_id` |
| `Order::hasMany(OrderProduct::class)` | `Order::hasMany(OrderProduct::class)` con `order_id` |
| `Stock::hasMany(StockMovement::class)` | `Stock::hasMany(StockMovement::class)` con `stock_id` |
| `StockMovement::morphTo('referenciable')` → Sale/Order/Delivery | `StockMovement::morphTo('referenceable')` → Sale/Order/Delivery |
| `City::belongsTo(State::class)` | `City::belongsTo(State::class)` con `state_id` |
| `Cart::belongsTo(Product::class, 'articulo_id')` | `Cart::belongsTo(Product::class, 'product_id')` |

### 3.3 Constantes de modelo — StockMovement

El modelo `StockMovement` (antes `Movimiento`) debe actualizar todas sus constantes a los nuevos valores del enum:

```php
const TYPE_PURCHASE_ENTRY   = 'purchase_entry';   // entrada_compra
const TYPE_ASSISTANT_ENTRY  = 'assistant_entry';  // entrada_asistente
const TYPE_ADJUSTMENT_ENTRY = 'adjustment_entry'; // entrada_ajuste
const TYPE_DELIVERY_EXIT    = 'delivery_exit';    // salida_entrega
const TYPE_POS_SALE_EXIT    = 'pos_sale_exit';    // salida_venta_pos
const TYPE_ADJUSTMENT_EXIT  = 'adjustment_exit';  // salida_ajuste
const TYPE_RETURN           = 'return';           // devolucion

const ENTRY_TYPES = [
    self::TYPE_PURCHASE_ENTRY,
    self::TYPE_ASSISTANT_ENTRY,
    self::TYPE_ADJUSTMENT_ENTRY,
    self::TYPE_RETURN,
];

const EXIT_TYPES = [
    self::TYPE_DELIVERY_EXIT,
    self::TYPE_POS_SALE_EXIT,
    self::TYPE_ADJUSTMENT_EXIT,
];
```

### 3.4 Constantes de modelo — Delivery

```php
const STATUS_PENDING   = 'pending';    // pendiente
const STATUS_DELIVERED = 'delivered';  // entregada
const STATUS_CANCELLED = 'cancelled';  // cancelada
```

Los scopes `scopePendientes` / `scopeEntregadas` se renombran a `scopePending` / `scopeDelivered`.

### 3.5 Polymorphic relationship — cambio importante

El sistema usa `referenciable_type` / `referenciable_id` en `movimientos`. Al renombrar:
- Se renombra columna: `referenciable_type` → `referenceable_type`, `referenciable_id` → `referenceable_id`
- Se renombran modelos: `Factura` → `Sale`, `Remito` → `Order`, `Entrega` → `Delivery`
- Los valores almacenados serán `App\Models\Sale`, `App\Models\Order`, `App\Models\Delivery`
- Como se resetea la BD, no hay conflicto con datos existentes

---

## Fase 4 — Seeders

### Estrategia: solo seeders base

Se eliminan todos los seeders de datos de ejemplo. Solo se conservan los seeders estrictamente necesarios para que el sistema arranque. Los datos de prueba (productos, clientes, ventas, etc.) se cargarán manualmente durante el desarrollo.

### 4.1 Seeders a ELIMINAR

```
MarcasTableSeeder.php
CategoriasTableSeeder.php
ClientesTableSeeder.php
ArticulosTableSeeder.php
InventariosTableSeeder.php
ListaPrecioSeeder.php
SuppliersTableSeeder.php
VentasSeeder.php
FacturasTableSeeder.php
PresupuestosTableSeeder.php
RemitosTableSeeder.php
EntregasTestSeeder.php
```

### 4.2 Seeders a conservar y actualizar

| Seeder actual | Nuevo nombre | Cambios |
|---|---|---|
| `RoleSeeder.php` | `RoleSeeder.php` | Sin cambios |
| `UserSeeder.php` | `UserSeeder.php` | Sin cambios (usa `role_id` que sigue igual) |
| `CentralAdminSeeder.php` | `CentralAdminSeeder.php` | Sin cambios |
| `ProvinciaSeeder.php` | `StatesSeeder.php` | Reescribir: modelos `State`/`City`, columnas `name`/`state_id`/`afip_id`. Fusiona `ProvinciasAfipSeeder` (el `afip_id` ya va en la misma tabla) |
| `ProvinciasAfipSeeder.php` | **ELIMINAR** | Fusionado en `StatesSeeder` |
| `TenantInitSeeder.php` | `TenantInitSeeder.php` | Actualizar: `Provincia` → `State`, llamar a `StatesSeeder` |
| `InitialSettingsSeeder.php` | `SettingsSeeder.php` | Reescribir con columnas nuevas y valores placeholder (no datos reales) |

### 4.3 Detalle de cambios por seeder

**StatesSeeder** (fusión de `ProvinciaSeeder` + `ProvinciasAfipSeeder`):
- Usar modelos `State` y `City`
- Columna `nombre` → `name`, `id_afip` → `afip_id`
- Columna `provincia_id` → `state_id` en `cities`
- El `afip_id` se setea directamente en `State::create()`, eliminando la necesidad del seeder separado

**SettingsSeeder** (antes `InitialSettingsSeeder`):
- `DB::table('inicialsettings')` → modelo `Setting`
- Todos los campos según mapeo de Fase 2.3
- Valores placeholder vacíos o nulos (no datos de empresa real)

**DatabaseSeeder** — reescribir completo:
- Crear tenant con `business_name` y `tax_id` (no `razonsocial`/`cuit`)
- Llamar solo a los seeders base en orden:

```
# BD central
1. CentralAdminSeeder

# Dentro del contexto tenant
2. RoleSeeder
3. UserSeeder
4. StatesSeeder
5. SettingsSeeder
```

**TenantSeeder** — actualizar para el mismo orden base:
```
1. RoleSeeder
2. UserSeeder
3. StatesSeeder
4. SettingsSeeder
```

---

## Checkpoint C — Verificar seeders

```bash
php artisan migrate:fresh --seed
```

Debe completar sin errores. Verificar:
- Login funciona con `superadmin@mail.com`
- Provincias y localidades cargadas
- Settings iniciales presentes

---

## Fase 5 — Actualizar Controllers

### 5.1 Renombrado de imports

| Import antiguo | Import nuevo |
|---|---|
| `App\Models\Articulo` | `App\Models\Product` |
| `App\Models\ArticuloImagen` | `App\Models\ProductImage` |
| `App\Models\ArticuloRemito` | `App\Models\OrderProduct` |
| `App\Models\Categoria` | `App\Models\Category` |
| `App\Models\Cliente` | `App\Models\Customer` |
| `App\Models\Compra` | `App\Models\Purchase` |
| `App\Models\CompraDetalle` | `App\Models\PurchaseDetail` |
| `App\Models\Entrega` | `App\Models\Delivery` |
| `App\Models\Factura` | `App\Models\Sale` |
| `App\Models\FacturaPago` | `App\Models\SalePayment` |
| `App\Models\InicialSetting` | `App\Models\Setting` |
| `App\Models\Inventario` | `App\Models\Stock` |
| `App\Models\ListaPrecio` | `App\Models\PriceList` |
| `App\Models\Localidad` | `App\Models\City` |
| `App\Models\Marca` | `App\Models\Brand` |
| `App\Models\Movimiento` | `App\Models\StockMovement` |
| `App\Models\Presupuesto` | `App\Models\Quote` |
| `App\Models\Provincia` | `App\Models\State` |
| `App\Models\Remito` | `App\Models\Order` |

### 5.2 Validaciones con nombres de tabla

| Actual | Nuevo |
|---|---|
| `exists:marcas,id` | `exists:brands,id` |
| `exists:categorias,id` | `exists:categories,id` |
| `exists:articulos,id` | `exists:products,id` |
| `exists:clientes,id` | `exists:customers,id` |
| `exists:listas_precios,id` | `exists:price_lists,id` |

### 5.3 Controllers que necesitan actualización completa

Todos los controllers listados en el análisis (~45 archivos) necesitan actualización de referencias a modelos, columnas, y relaciones.

---

## Fase 6 — Actualizar Frontend (React/TypeScript)

Todos los archivos en `resources/js/pages/` y `resources/js/components/` que usen nombres de columnas antiguos deben actualizarse. Los cambios más frecuentes:

| Prop/field actual | Nuevo nombre |
|---|---|
| `articulo` (campo nombre) | `name` |
| `codarticulo` | `sku` |
| `codprov` | `supplier_code` |
| `precio` | `price` |
| `razonsocial` | `business_name` |
| `documentounico` | `tax_id` |
| `condicioniva` | `tax_status` |
| `numfactura` | `invoice_number` |
| `ptoventa` | `pos_number` |
| `letracomprobante` | `voucher_letter` |
| `marca` | `name` (en brands) |
| `categoria` | `name` (en categories) |

### Decisión pendiente: Nombres de rutas

Se recomienda **mantener los nombres de ruta actuales** (`articulos.index`, `clientes.index`, etc.) en una primera fase para minimizar el scope de cambios. Las rutas se pueden renombrar en una fase posterior si se desea consistencia total.

---

## Fase 7 — Actualizar Services

| Archivo | Cambios principales |
|---|---|
| `TextToSqlService.php` | Actualizar mapeo tabla/columna |
| `FunctionCallingService.php` | Actualizar `DB::table()` calls |
| `AnalyticsService.php` | Actualizar `DB::table()` calls |
| `AfipService.php` | Actualizar columnas de settings |
| `Afip/AfipWebService.php` | Actualizar columnas de settings |
| `PdfProcessorService.php` | Actualizar columnas de productos |
| `ImageService.php` | Path `articulos/{id}` → `products/{id}` |
| `CodigoService.php` | `codarticulo` → `sku` |
| `Functions/SearchClientFunction.php` | `razonsocial` → `business_name`, `documentounico` → `tax_id` |
| `Functions/SearchProductFunction.php` | `codarticulo` → `sku` |
| `Functions/CreateSaleFunction.php` | Múltiples columnas |
| `Functions/CreateAndSendInvoiceFunction.php` | Múltiples columnas |
| `Functions/AuthorizeInvoiceFunction.php` | Relaciones y columnas |

> **Importante**: Todos los servicios que usen valores de enum hardcodeados (`'pendiente'`, `'entregada'`, `'entrada_compra'`, etc.) deben actualizarse a los nuevos valores en inglés.

---

## Fase 8 — Actualizar archivos auxiliares

| Archivo | Cambios |
|---|---|
| `resources/views/pdf/factura.blade.php` | Todas las referencias a columnas |
| `resources/views/pdf/estado-cuenta.blade.php` | Referencias a columnas |
| `lang/es/validation.php` | Labels de validación |
| `config/telegram-agents.php` | Referencias a tablas |
| `app/Exports/EstadoCuentaExport.php` | Columnas |
| `app/Console/Commands/MigrateExistingTenant.php` | Lista de tablas |

---

## Riesgos y consideraciones

1. **Datos existentes**: Este plan resetea la BD completamente. No hay migración de datos. Solo para dev/QA.
2. **Polymorphic types**: Los registros de `stock_movements.referenceable_type` usarán los nuevos nombres de modelo automáticamente.
3. **Tabla `roles`**: Se mantiene temporalmente hasta SCRUM-55 (Spatie Permissions).
4. **Storage paths**: `ImageService` usa `articulos/{id}` como path. Debe cambiarse a `products/{id}`. Archivos existentes en `storage/app/public/articulos/` deberán moverse.
5. **Nombres de ruta**: Se recomienda mantener los nombres de ruta actuales en esta fase. Renombrado de rutas queda como deuda técnica (SCRUM pendiente).
6. **Enum values en servicios**: `TextToSqlService`, `FunctionCallingService` y cualquier servicio que compare valores de enum de `stock_movements.type` o `deliveries.status` deben actualizarse a los nuevos valores en inglés.
6. **Spatie Activity Log**: La tabla `activity_log` no se renombra. Los valores de `subject_type` y `causer_type` usarán los nuevos nombres de clase.
7. **Unique constraint en `price_list_products`**: Con soft deletes, el unique compuesto `(product_id, price_list_id)` puede dar colisiones si se elimina y recrea un registro. Considerar usar unique compuesto global o manejar vía lógica de aplicación.

---

## Resumen de cantidades estimadas

| Tipo de archivo | Cantidad aproximada |
|---|---|
| Migraciones tenant a crear | 31 archivos nuevos |
| Migraciones central a crear | 6 archivos nuevos |
| Migraciones a eliminar | 73 archivos |
| Modelos a renombrar/actualizar | 23 archivos |
| Seeders a eliminar | 12 archivos |
| Seeders a conservar/actualizar | 6 archivos |
| Controllers a actualizar | ~45 archivos |
| Services a actualizar | ~10 archivos |
| Componentes React a actualizar | ~50+ archivos |
| Archivos auxiliares | ~6 archivos |