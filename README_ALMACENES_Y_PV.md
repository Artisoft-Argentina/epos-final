# Plan — Almacenes y Puntos de Venta por Tenant (EPOS)

## Contexto

EPOS es un SaaS multi-tenant donde cada empresa hoy maneja:

- **Stock global por artículo**: tabla `stocks` con `product_id` UNIQUE + columna `quantity` materializada. No existe noción de "ubicación física".
- **Un único punto de venta ARCA**: el campo `pos_number` está hardcodeado a `3` en [VentaController.php:67](app/Http/Controllers/VentaController.php#L67) y guardado como número único en `settings.pos_number`.
- **Numeración de comprobantes sin lock**: `Sale::max('invoice_number') + 1` en [VentaController.php:69](app/Http/Controllers/VentaController.php#L69) y [CreateSaleFunction.php:59](app/Services/Functions/CreateSaleFunction.php#L59) (esto ya está identificado en SCRUM-23).
- **Auditoría sólida**: tabla `stock_movements` con tipos enum (`purchase_entry`, `pos_sale_exit`, etc.) y servicio central [MovimientoService.php](app/Services/MovimientoService.php) que persiste el movimiento + actualiza el `quantity` materializado.

### Necesidad de negocio

Una empresa que se registra debe poder:

1. **Crear N almacenes** (depósito central, sucursal Belgrano, sucursal Caballito, etc.) donde "vive" el inventario.
2. **Crear N puntos de venta** asociados a un almacén físico (ej: caja 1 y caja 2 en sucursal Belgrano), cada uno con su propia numeración ARCA.
3. **Transferir mercadería entre almacenes** cuando un punto necesita stock que no tiene.
4. **Vender desde un PV específico** descontando del almacén asociado.
5. **Configurar de qué almacén descuenta el ecommerce** y desde qué PV se factura online.

### Decisión arquitectónica clave

**Almacenes y PV son entidades dentro del tenant, NO sub-tenants.** Razones:

- Comparten certificado ARCA, catálogo de productos, listas de precios y configuración fiscal (CUIT del tenant).
- Reportes consolidados (ranking de ventas global, valuación de inventario total) son requisito.
- Sub-tenants implican BDs adicionales por almacén → costo de infra y complejidad de sincronización inviable para PyMEs.

Si en el futuro un cliente quiere cajas con BD propia y facturación 100% independiente, ese caso se resuelve con un tenant nuevo.

---

## Alcance del cambio

### En BD del tenant
- Nueva tabla `warehouses` (almacenes).
- Nueva tabla `points_of_sale` (cajas/PV ARCA).
- Refactor de `stocks`: cambiar UNIQUE de `product_id` a UNIQUE compuesta `(product_id, warehouse_id)`.
- Nueva tabla `stock_transfers` (cabecera) + `stock_transfer_items` (líneas) para transferencias entre almacenes.
- Agregar `warehouse_id` a `orders` (de qué almacén entra la mercadería comprada).
- Agregar `point_of_sale_id` y `warehouse_id` a `sales` y `quotes`.
- Agregar `default_warehouse_id` a `settings` (el que usa el ecommerce).
- Extender `StockMovement::TYPES` con `transfer_out` y `transfer_in`.

### En código PHP
- Modelos `Warehouse`, `PointOfSale`, `StockTransfer`, `StockTransferItem`.
- Refactor de `MovimientoService::registrar()` para validar que el `Stock` recibido pertenezca al almacén correcto (sin cambio de firma — el `warehouse_id` ya viaja en el `Stock`).
- Nuevo `StockTransferService` que encapsula la transferencia atómica (egreso del almacén origen + ingreso al almacén destino, ambos con `referenceable_type = StockTransfer`).
- Nuevo `InvoiceNumberService` que obtiene el próximo número con `lockForUpdate()` por punto de venta (resuelve también SCRUM-23 de paso, dejándolo bien hecho desde el inicio en vez de parchearlo).
- Provisioning del tenant: el `TenantInitSeeder` debe crear un almacén "Principal" y un PV "Principal" por defecto para no romper a los tenants existentes ni forzar decisiones a un tenant nuevo.

### En frontend
- Selector de "almacén/PV activo" en el header (similar al patrón de selector de empresa de otros SaaS multi-sucursal).
- Vistas nuevas en `Configuración`: ABM de almacenes y ABM de puntos de venta.
- Vista nueva `Inventario/Transferencias`: crear, listar, recibir transferencias.
- Vista de inventario filtrable y agrupable por almacén (hoy muestra una sola cantidad por artículo).
- POS al cargar un ítem muestra disponibilidad por almacén (y propone solicitar transferencia si el almacén del PV activo no tiene stock).

### En tenants existentes (migración de datos)
- Backfill: crear automáticamente un almacén "Principal" por tenant y un PV "Principal" con `pos_number` igual al actual `settings.pos_number`.
- Migrar todos los registros de `stocks` actuales asignándoles el `warehouse_id` del almacén "Principal".
- Backfill de `sales.point_of_sale_id` y `sales.warehouse_id` apuntando a los registros "Principal".

---

## Fases de implementación

Cada fase es deployable de forma independiente y deja el sistema en estado consistente.

### Fase 1 — Fundación: Almacenes

**Objetivo:** introducir `warehouses` sin tocar el flujo de stock todavía.

1. Migración tenant `create_warehouses_table`:
   - `id`, `name`, `code` (slug interno), `address`, `city_id`, `state_id`, `phone`, `notes`, `is_default`, `active`, soft deletes, timestamps.
   - Solo un registro puede tener `is_default = true` (validar a nivel modelo).
2. Modelo `App\Models\Warehouse` con scopes `active()`, `default()`.
3. Backfill: crear almacén "Principal" en cada tenant existente (comando `php artisan tenants:run epos:backfill-default-warehouse`).
4. Actualizar `TenantInitSeeder` para que cree el almacén "Principal" al provisionar nuevos tenants.
5. ABM de almacenes:
   - Controlador `WarehouseController` (CRUD básico).
   - Rutas `routes/web.php` bajo `role:admin,superadmin`.
   - Páginas `resources/js/pages/Configuracion/Almacenes/{Index,Create,Edit}.tsx`.
   - Entrada en sidebar dentro de `Configuración`.

**Archivos críticos:**
- `database/migrations/tenant/XXXX_create_warehouses_table.php` (nuevo)
- [database/seeders/TenantInitSeeder.php](database/seeders/TenantInitSeeder.php)
- `app/Console/Commands/BackfillDefaultWarehouse.php` (nuevo, ejecutable con `tenants:run`)
- [resources/js/components/app-sidebar.tsx](resources/js/components/app-sidebar.tsx)

### Fase 2 — Stock por almacén

**Objetivo:** el inventario pasa a tener `warehouse_id`. Esta es la fase más delicada porque toca todo el flujo de stock existente.

1. Migración tenant `add_warehouse_id_to_stocks`:
   - Agregar `warehouse_id` nullable.
   - Backfill: `UPDATE stocks SET warehouse_id = (SELECT id FROM warehouses WHERE is_default = 1 LIMIT 1)`.
   - Hacer `warehouse_id` NOT NULL.
   - Drop UNIQUE en `product_id`, crear UNIQUE compuesto `(product_id, warehouse_id)`.
2. Refactor [app/Models/Stock.php](app/Models/Stock.php):
   - Agregar relación `warehouse()`.
   - Helper estático `Stock::forProductInWarehouse($productId, $warehouseId)` que hace `firstOrCreate` (centraliza el patrón usado en [OrderController.php:165](app/Http/Controllers/OrderController.php#L165) y en `AsistenteComprasController`).
3. Refactor [app/Services/MovimientoService.php](app/Services/MovimientoService.php): no cambia firma, pero todos los call sites deben pasar el `Stock` correcto del almacén apropiado.
4. Refactor de los 4 puntos de entrada/salida de stock para que reciban/elijan `warehouse_id`:
   - **Compras** ([OrderController.php](app/Http/Controllers/OrderController.php)): `orders` recibe `warehouse_id` (a qué almacén entra la mercadería). `convertToInventory()` usa ese almacén.
   - **Asistente Compras** ([AsistenteComprasController.php](app/Http/Controllers/AsistenteComprasController.php)): el endpoint `add-inventory` recibe `warehouse_id`.
   - **Ventas POS** ([VentaController.php](app/Http/Controllers/VentaController.php)): descuenta del almacén del PV (ver Fase 3).
   - **Entregas / Devoluciones**: idem.
5. Migración tenant `add_warehouse_id_to_orders`.
6. Frontend:
   - Página `Inventarios/Index.tsx`: filtro por almacén + columna "Almacén".
   - En formularios de compra y asistente compras: select de almacén destino (default = el "Principal").

**Archivos críticos:**
- `database/migrations/tenant/XXXX_add_warehouse_id_to_stocks.php` (nuevo)
- `database/migrations/tenant/XXXX_add_warehouse_id_to_orders.php` (nuevo)
- [app/Models/Stock.php](app/Models/Stock.php)
- [app/Http/Controllers/OrderController.php](app/Http/Controllers/OrderController.php)
- [app/Http/Controllers/AsistenteComprasController.php](app/Http/Controllers/AsistenteComprasController.php)
- [resources/js/pages/Inventario/Index.tsx](resources/js/pages/Inventario/Index.tsx)

### Fase 3 — Puntos de venta + numeración por PV

**Objetivo:** introducir múltiples cajas con numeración ARCA propia.

1. Migración tenant `create_points_of_sale_table`:
   - `id`, `name`, `pos_number` (1–99, UNIQUE), `warehouse_id` (FK), `voucher_letter_default` (A/B/C según condición IVA del tenant), `next_invoice_number_a`, `next_invoice_number_b`, `next_invoice_number_c`, `is_default`, `active`, timestamps, soft deletes.
   - Numeración por letra de comprobante porque ARCA exige secuencias separadas por (PtoVta, CbteTipo).
2. Backfill: crear PV "Principal" por tenant con `pos_number = settings.pos_number` y `next_invoice_number_X` calculado a partir de `MAX(invoice_number) + 1` en `sales` agrupado por letra.
3. Migración tenant `add_pos_and_warehouse_to_sales_and_quotes`:
   - `sales`: agregar `point_of_sale_id`, `warehouse_id` (ambos nullable, backfill al "Principal", luego NOT NULL).
   - `quotes`: idem.
4. Nuevo `app/Services/InvoiceNumberService.php`:
   ```
   public function next(PointOfSale $pos, string $letter): int {
       return DB::transaction(function () use ($pos, $letter) {
           $pos = PointOfSale::lockForUpdate()->find($pos->id);
           $col = "next_invoice_number_{$letter}";
           $number = $pos->$col;
           $pos->increment($col);
           return $number;
       });
   }
   ```
   Esto resuelve SCRUM-23 (duplicados por concurrencia) como efecto colateral.
5. Refactor [VentaController.php](app/Http/Controllers/VentaController.php) y [CreateSaleFunction.php](app/Services/Functions/CreateSaleFunction.php) para:
   - Recibir `point_of_sale_id` desde el front (el PV activo del usuario).
   - Llamar a `InvoiceNumberService::next()`.
   - Pasar `pos_number` real (no hardcodeado) al payload ARCA en [AfipService.php:90](app/Services/AfipService.php#L90).
6. ABM de PV en `Configuración/PuntosDeVenta` (Index/Create/Edit).
7. Selector de "PV activo" en el header (persistente en sesión del usuario).

**Archivos críticos:**
- `database/migrations/tenant/XXXX_create_points_of_sale_table.php` (nuevo)
- `database/migrations/tenant/XXXX_add_pos_and_warehouse_to_sales.php` (nuevo)
- `app/Services/InvoiceNumberService.php` (nuevo)
- [app/Services/AfipService.php](app/Services/AfipService.php)
- [app/Http/Controllers/VentaController.php](app/Http/Controllers/VentaController.php)
- [app/Services/Functions/CreateSaleFunction.php](app/Services/Functions/CreateSaleFunction.php)

### Fase 4 — Transferencias entre almacenes

**Objetivo:** mover stock de un almacén a otro con trazabilidad.

1. Migración tenant `create_stock_transfers_table`:
   - `id`, `transfer_number` (correlativo por tenant), `date`, `origin_warehouse_id`, `destination_warehouse_id`, `status` (`draft`, `in_transit`, `received`, `cancelled`), `requested_by_user_id`, `received_by_user_id`, `notes`, soft deletes, timestamps.
2. Migración tenant `create_stock_transfer_items_table`:
   - `id`, `stock_transfer_id`, `product_id`, `quantity`, `received_quantity` (nullable hasta recepción).
3. Extender `StockMovement::TYPES`:
   - `TYPE_TRANSFER_OUT = 'transfer_out'` (en `EXIT_TYPES`).
   - `TYPE_TRANSFER_IN = 'transfer_in'` (en `ENTRY_TYPES`).
4. Nuevo `app/Services/StockTransferService.php`:
   - `request(origin, destination, items, user)` → crea `StockTransfer` en `draft`.
   - `dispatch(transfer)` → cambia a `in_transit`, descuenta stock del origen y registra `transfer_out` (referenceable = transfer).
   - `receive(transfer, receivedItems)` → cambia a `received`, suma stock al destino y registra `transfer_in`.
   - `cancel(transfer)` → solo si está en `draft` o reversa el `in_transit` con un `return`.
   - Toda la lógica dentro de `DB::transaction()` con `lockForUpdate()` sobre los stocks involucrados.
5. Frontend: módulo `Inventarios/Transferencias`:
   - `Index.tsx` (listado con filtros por estado y almacén).
   - `Create.tsx` (selección de origen/destino + búsqueda de productos con stock disponible en origen).
   - `Show.tsx` con acciones según estado (despachar, recibir, cancelar).
6. En la vista del POS, cuando un ítem no tiene stock en el almacén del PV activo pero sí en otro, mostrar botón "Solicitar transferencia" que abre el formulario pre-completado.

**Archivos críticos:**
- `database/migrations/tenant/XXXX_create_stock_transfers_table.php` (nuevo)
- `database/migrations/tenant/XXXX_create_stock_transfer_items_table.php` (nuevo)
- `app/Services/StockTransferService.php` (nuevo)
- [app/Models/StockMovement.php](app/Models/StockMovement.php) (extender constantes)
- `resources/js/pages/Inventario/Transferencias/{Index,Create,Show}.tsx` (nuevos)

### Fase 5 — Ecommerce multi-almacén

**Objetivo:** que el ecommerce sepa de qué almacén descontar y desde qué PV facturar.

1. Migración tenant `add_ecommerce_warehouse_and_pos_to_settings`:
   - `default_ecommerce_warehouse_id`, `default_ecommerce_point_of_sale_id`.
2. Refactor [CheckoutController.php:115](app/Http/Controllers/CheckoutController.php#L115): descontar del `default_ecommerce_warehouse_id`.
3. Refactor del catálogo público: mostrar disponibilidad como `SUM(quantity) WHERE warehouse_id = default_ecommerce_warehouse_id`. Decidir si se exponen "todos los almacenes" o solo el ecommerce — por defecto solo el ecommerce, configurable a futuro.
4. Configuración en `Configuración/Empresa`: dos selectores nuevos.

**Archivos críticos:**
- `database/migrations/tenant/XXXX_add_ecommerce_warehouse_and_pos_to_settings.php` (nuevo)
- [app/Http/Controllers/CheckoutController.php](app/Http/Controllers/CheckoutController.php)
- [resources/js/pages/Configuracion/Empresa/Edit.tsx](resources/js/pages/Configuracion/Empresa/Edit.tsx)

### Fase 6 — Hardening + tests

1. Tests Pest (estructura base SCRUM-67):
   - `WarehouseCrudTest`: ABM y validación de único default.
   - `PointOfSaleCrudTest`: ABM y unicidad de `pos_number`.
   - `StockPerWarehouseTest`: stock se segrega correctamente, no hay leakage entre almacenes.
   - `StockTransferTest`: dispatch + receive + cancel + reversiones.
   - `InvoiceNumberConcurrencyTest`: 50 ventas concurrentes en el mismo PV/letra → todas con `invoice_number` único y consecutivo.
   - `MultiPosNumberingTest`: dos PV emiten facturas en paralelo, cada uno con su secuencia.
2. Permisos granulares (alineado con SCRUM-55):
   - `warehouses.manage`, `points_of_sale.manage`, `stock_transfers.create`, `stock_transfers.receive`, `stock.view_all_warehouses`.
3. Activity log en `Warehouse`, `PointOfSale`, `StockTransfer` (alineado con SCRUM-58).
4. Documentar en [FUNCIONALIDADES_SISTEMA.md](FUNCIONALIDADES_SISTEMA.md) la sección "Multi-almacén y multi-PV".

---

## Modelo de datos resultante (resumen)

```
warehouses
  id, name, code, address, city_id, state_id, is_default, active

points_of_sale
  id, name, pos_number (1-99), warehouse_id (FK warehouses)
  next_invoice_number_a, next_invoice_number_b, next_invoice_number_c
  is_default, active

stocks
  id, product_id, warehouse_id (FK), quantity
  UNIQUE (product_id, warehouse_id)

stock_movements (sin cambios estructurales — el warehouse_id ya viaja vía stock_id)
  + nuevos type: transfer_out, transfer_in

stock_transfers
  id, transfer_number, date, origin_warehouse_id, destination_warehouse_id
  status (draft|in_transit|received|cancelled)
  requested_by_user_id, received_by_user_id, notes

stock_transfer_items
  id, stock_transfer_id, product_id, quantity, received_quantity

orders
  + warehouse_id (FK)

sales / quotes
  + point_of_sale_id (FK)
  + warehouse_id (FK)  // denormalizado para queries de reporte

settings
  + default_ecommerce_warehouse_id
  + default_ecommerce_point_of_sale_id
```

---

## Verificación end-to-end

Una vez completas todas las fases, validar el siguiente recorrido en un tenant nuevo:

1. `make fresh` → tenant nuevo creado con almacén y PV "Principal" por defecto.
2. Login como admin → entrar a `Configuración/Almacenes` → crear "Sucursal Centro" y "Depósito Belgrano".
3. `Configuración/Puntos de Venta` → crear "Caja 1 - Centro" (`pos_number=2`, almacén Centro) y "Caja 2 - Belgrano" (`pos_number=3`, almacén Belgrano).
4. Cargar una orden de compra dirigida al "Depósito Belgrano" → convertir a inventario → verificar que `stocks` tenga la fila con `warehouse_id = Belgrano`.
5. Crear transferencia Belgrano → Centro de 5 unidades de un artículo → despachar → recibir → verificar que el stock se movió y que hay 2 movimientos (`transfer_out`, `transfer_in`) referenceando el mismo `StockTransfer`.
6. Cambiar PV activo a "Caja 1 - Centro" → emitir factura B → verificar que `pos_number = 2` y que `invoice_number` arranca desde 1 para esa caja.
7. Cambiar a "Caja 2 - Belgrano" → emitir factura B en paralelo → `pos_number = 3`, secuencia independiente.
8. Test concurrente: lanzar 20 requests de venta en paralelo a la misma caja → todos los `invoice_number` deben ser únicos y consecutivos (verificación contra SCRUM-23).
9. Configurar PV ecommerce = "Caja 1 - Centro" y almacén ecommerce = "Centro" → comprar online → verificar descuento desde Centro y factura emitida con PV correcto.
10. Validar con MCP `playwright` que las pantallas de almacenes, PV, transferencias e inventario filtrado por almacén funcionen visualmente en mobile y desktop.
11. Tests Pest: `make shell && php artisan test --filter=Warehouse|PointOfSale|StockTransfer|InvoiceNumber`.

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Romper tenants existentes al cambiar UNIQUE en `stocks` | Backfill obligatorio antes del cambio de constraint; comando idempotente con verificación previa |
| Numeración ARCA descalibrada al backfill | Calcular `next_invoice_number_X = MAX(invoice_number WHERE letter=X) + 1` por PV antes de habilitar emisión |
| Doble cómputo de stock si dos transferencias compiten por el mismo origen | `lockForUpdate()` sobre el `Stock` origen dentro de `dispatch()` |
| Confusión UX con PV activo | Selector visible siempre en header + badge en sidebar + persistencia en sesión, no solo en localStorage |
| Migración masiva de `stocks` larga en tenants grandes | Ejecutar en chunks de 1000 con `tenants:run`, monitorear con `MCP logs` |
| Permisos: vendedor podría ver/transferir stock de otro almacén | Validar `warehouse_id` del PV activo del usuario contra el `warehouse_id` de la operación en cada controlador |

---

## Fuera de alcance (futuro)

- Reservas de stock (lock temporal mientras un PV arma el ticket).
- Asignación de usuarios a almacenes/PV específicos (hoy un admin opera cualquier PV).
- Costos por almacén (valuación FIFO/promedio por ubicación).
- Sub-tenants reales (BD propia por sucursal) — solo si aparece un cliente con esa necesidad concreta.
- Picking / packing workflows para almacenes grandes.
