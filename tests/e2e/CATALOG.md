# EPOS — Catálogo de flujos para tests E2E

Mapa completo de flujos del sistema, agrupados por módulo/feature, con estado de cobertura y observaciones de UX/UI accionables.

> **Cómo usar este archivo**:
> - Sirve como índice para el skill `e2e-tester` y para el equipo cuando prioriza nueva cobertura.
> - Estado: ✅ cubierto · 🟡 parcial · ⬜ sin cobertura · 🐛 cubierto pero con bug conocido.
> - Si agregás un test nuevo, actualizá el estado en este archivo en el mismo PR.

---

## Índice por área de negocio

1. [Acceso y administración](#1-acceso-y-administración)
2. [Catálogo: artículos, marcas, categorías](#2-catálogo-artículos-marcas-categorías)
3. [Listas de precios](#3-listas-de-precios)
4. [Inventario, almacenes y stock](#4-inventario-almacenes-y-stock)
5. [Compras y proveedores](#5-compras-y-proveedores)
6. [Clientes](#6-clientes)
7. [Ventas POS](#7-ventas-pos)
8. [Cobros y pagos](#8-cobros-y-pagos)
9. [Entregas](#9-entregas)
10. [Ecommerce público](#10-ecommerce-público)
11. [Portal del cliente](#11-portal-del-cliente)
12. [Asistentes IA](#12-asistentes-ia)
13. [Reportes, dashboard y auditoría](#13-reportes-dashboard-y-auditoría)
14. [Códigos QR / barras / escáner](#14-códigos-qr--barras--escáner)

---

## 1. Acceso y administración

Roles: `superadmin` (panel central), `admin`, `vendedor`, `cliente`.

| Flujo | Estado | Spec | Notas |
|---|---|---|---|
| Login admin / vendedor / cliente | ✅ | [auth.spec.ts](specs/auth.spec.ts) | OK |
| Redirect según rol al `/dashboard` | ✅ | auth.spec.ts | OK |
| Credenciales inválidas | ✅ | auth.spec.ts | Verificar que el toast/error es legible |
| Logout y reseteo de sesión | ⬜ | — | Falta: después de logout, intentar `/customers` debe redirigir a login |
| Tour onboarding (`tour_completed`) | ⬜ | — | Verificar que aparece en primer login y no en sucesivos |
| Vendedor intenta acceder a rutas admin | ⬜ | — | Crítico para SCRUM-54. Crear spec con `vendedorPage` + 403/redirect en `/users`, `/empresa`, `/almacenes` |
| Vendedor sin PV asignado intenta vender | ⬜ | — | Debería tirar 403 con mensaje claro (existe `abort_if` en VentaController) |
| Cliente accede a su portal | ⬜ | — | `/client/dashboard`, `/client/profile` |
| ABM de usuarios (solo superadmin) | ⬜ | — | CRUD completo desde `/users` |
| ABM de roles | ⬜ | — | `/roles` |
| Cambio de password | ⬜ | — | `/settings/password` |
| Configuración de empresa (CUIT, datos fiscales) | ⬜ | — | `/empresa` |
| Activity Log: registro de acciones críticas | ⬜ | — | Después de crear una venta, verificar que aparece en `/activity-log` |

**UX/UI — observaciones y sugerencias**:
- ⚠️ El layout sidebar muestra "Configuración" solo a superadmin, "todo menos Configuración" a admin, y solo Ventas/Clientes/Inventario/Artículos al vendedor. Validar visualmente en cada rol para confirmar que no se cuela un link prohibido.
- 💡 **Sugerencia**: el módulo "Cambiar de Punto de Venta" (selector en header) es invisible para vendedor según código. Confirmar en UI que efectivamente no aparece para no romper expectativas.
- 💡 **Sugerencia**: agregar un test que mida el TTI del dashboard por rol — el admin trae más widgets que el vendedor, asegurarse de que no degradan.

---

## 2. Catálogo: artículos, marcas, categorías

| Flujo | Estado | Spec | Notas |
|---|---|---|---|
| ABM artículo (alta) | 🟡 | [products.spec.ts](specs/products.spec.ts) | Solo cubre alta. Falta edit/destroy/show. |
| Listado con búsqueda | ⬜ | — | Buscar por SKU, nombre, código de proveedor |
| Asignar artículo a lista de precios | ⬜ | — | Cobertura clave: precio default + precio en lista |
| Subir imágenes (múltiples, principal, orden) | ⬜ | — | Endpoint `articulos.imagenes.*` |
| Eliminar imagen y reordenar | ⬜ | — | |
| Editar artículo y verificar que cambios persisten | ⬜ | — | |
| Eliminar artículo (soft delete) | ⬜ | — | Verificar que no rompe ventas pasadas que lo referencian |
| Validación: SKU duplicado | ⬜ | — | |
| Validación: campos obligatorios (sku, name, price, tax_rate, min_stock, brand_id, category_id) | ⬜ | — | |
| Categorías: CRUD + toggle activo | ⬜ | — | Migrado a inglés en el merge reciente |
| Marcas: CRUD + toggle activo | ⬜ | — | Idem |
| Ver movimientos del artículo | ⬜ | — | `/articulos/{id}/movimientos` |
| Ver stock por almacén | ⬜ | — | `/articulos/{id}/stock-by-warehouse` (es JSON, usar como verificación de otros tests) |

**UX/UI — observaciones y sugerencias**:
- 🐛 **Bug conocido — TypeScript**: [resources/js/pages/Articulos/Index.tsx:46](../../resources/js/pages/Articulos/Index.tsx#L46) referencia `toast` sin importarlo. Va a romper en runtime.
- 🐛 **Bug conocido — TypeScript**: [resources/js/pages/Codigos/ImprimirEtiquetas.tsx:100](../../resources/js/pages/Codigos/ImprimirEtiquetas.tsx#L100) usa `<style jsx>` (Next.js-only). Eliminar `jsx`.
- 💡 **Sugerencia UX**: el listado de artículos no usa el componente `DataTable` (verificar). Migrar para consistencia con Categories/Brands rediseñados.
- 💡 **Sugerencia UX**: agregar buscador en tiempo real (debounced) en `/articulos`. Hoy se mira por nombre con `like`. Igual que el patrón de Ventas/Create — preload + filter client-side si el catálogo es ≤ 1000 items.
- 💡 **Sugerencia UX**: validar que al subir imágenes hay preview antes de submit y barra de progreso. Si no hay, agregar.

---

## 3. Listas de precios

| Flujo | Estado | Spec | Notas |
|---|---|---|---|
| ABM lista de precios | ⬜ | — | CRUD básico |
| Marcar como `default_pos` y `default_ecommerce` | ⬜ | — | Solo una lista puede ser default — verificar que cambiar la default desmarca la anterior |
| Regenerar precios de una lista | ⬜ | — | POST `/listas-precios/{id}/regenerar` — verificar que aplica el porcentaje a todos los artículos |
| Cargar lista de precios desde PDF (IA) | ⬜ | — | `/asistente-precios` — flujo IA |
| Verificar que el POS usa la lista `default_pos` | ⬜ | — | Crear venta sin elegir lista → asegurarse de que toma la default |
| Cambiar lista de precios en venta recalcula precios | ⬜ | — | Importante: el handler `recalcularPrecios` en Ventas/Create |

**UX/UI — observaciones y sugerencias**:
- 💡 **Sugerencia UX**: al regenerar precios de una lista, hoy no hay un "preview" de cuántos artículos van a cambiar. Agregar un dialog de confirmación con el conteo.
- 💡 **Sugerencia lógica**: en el AsistenteListaProveedor, después del match por EAN/SKU, ¿hay un step de revisión antes de aplicar? Validar que sí, para evitar updates accidentales masivos.

---

## 4. Inventario, almacenes y stock

Área grande y de alta criticidad. Se desdobló en varios sub-flujos.

### 4.1 Almacenes (Warehouses)

| Flujo | Estado | Spec | Notas |
|---|---|---|---|
| ABM almacén | ⬜ | — | Crear, editar, marcar como default, toggle activo |
| Solo un almacén puede ser `is_default = true` | ⬜ | — | Cambiar default desmarca el anterior |
| Eliminar almacén con stock > 0 | ⬜ | — | ¿Permite o bloquea? Definir y testear |

### 4.2 Puntos de Venta

| Flujo | Estado | Spec | Notas |
|---|---|---|---|
| ABM punto de venta | ⬜ | — | Cada PV se asocia a un Warehouse |
| Set Active PV (sesión) | ⬜ | — | `POST /puntos-venta/set-active` |
| Vendedor solo ve su PV asignado | ⬜ | — | `HandleInertiaRequests::resolvePointsOfSaleProp` |
| Asignar PV a usuario en alta/edit | ⬜ | — | Migration `add_point_of_sale_id_to_users` |

### 4.3 Stock (Inventarios)

| Flujo | Estado | Spec | Notas |
|---|---|---|---|
| Listado de stock por almacén | ⬜ | — | `/inventarios` |
| Ajuste manual de stock (entry / exit) | ⬜ | — | `POST /inventarios/{id}/adjust` |
| Conciliación de stock | ⬜ | — | `POST /inventarios/{id}/reconcile` y `reconcileAll` — diferencia entre `quantity` columna vs `calculatedQuantity` derivada de movimientos |
| Ver historial de movimientos de un artículo | ⬜ | — | `/articulos/{id}/movimientos` |
| Stock por almacén para un artículo (API) | 🟡 | — | Usado en POS y modal de marcar entregada. Probar como JSON spec o vía POS. |

### 4.4 Transferencias entre almacenes

| Flujo | Estado | Spec | Notas |
|---|---|---|---|
| Listado de transferencias con filtros | ⬜ | — | 🐛 Recientemente fixeado bug de SelectItem value="". Cubrir para no regresar. |
| Crear transferencia draft (buscador de productos client-side) | ⬜ | — | Recién migrado a búsqueda al estilo POS. Test crítico. |
| Despachar transferencia (solo admin) → in_transit | ⬜ | — | Verifica descuento de stock origen |
| Recibir transferencia (solo admin) → received | ⬜ | — | Verifica suma de stock destino |
| Recibir parcial (received_quantities array) | ⬜ | — | |
| Cancelar transferencia draft / in_transit | ⬜ | — | Si in_transit, debe reversar el egreso del origen |
| Vendedor crea draft pero no puede dispatch/receive/cancel | ⬜ | — | Validación 403 |
| Stock insuficiente al despachar | ⬜ | — | Verificar mensaje con nombres (mismo patrón que Delivery, revisar StockTransferService) |

**UX/UI — observaciones y sugerencias**:
- 🐛 **Acabamos de arreglar dos bugs** en transferencias: `<SelectItem value="">` y `code` vs `sku`. El catálogo debe incluir tests de regresión para ambos.
- 💡 **Sugerencia UX**: la página Index de transferencias muestra `row.date` directo desde Eloquent, que serializa como ISO. Se ve feo. Formatear a `dd/mm/yyyy` o usar `Intl.DateTimeFormat`.
- 💡 **Sugerencia UX**: el dropdown del buscador no muestra el stock disponible por color (verde si > 10, amarillo si bajo). Sería útil visualmente.
- 💡 **Sugerencia lógica**: al cancelar una transferencia `in_transit`, el reverso usa `TYPE_RETURN`. Validar que el historial de movimientos del artículo deja claro qué pasó (transferencia cancelada vs devolución de venta — ambos usan TYPE_RETURN).
- 💡 **Sugerencia perf**: el `create()` del controller hace `Stock::with('product:id,sku,name')->where('quantity', '>', 0)->get()`. Si hay miles de stocks > 0, esto puede ser pesado. Medir y considerar limit + paginación cuando supere N filas.

---

## 5. Compras y proveedores

| Flujo | Estado | Spec | Notas |
|---|---|---|---|
| ABM proveedor | ⬜ | — | CRUD |
| Validación: CUIT duplicado en proveedor | ⬜ | — | |
| Crear orden de compra | 🟡 | [purchases.spec.ts](specs/purchases.spec.ts) | Solo verifica render |
| Convertir orden a inventario (atomicidad) | ⬜ | — | Bug en SCRUM-40. **Crítico**. Verificar transacción: si falla a mitad, ni se crea movimiento ni se actualiza stock. |
| Asociar artículos a proveedor | ⬜ | — | `GET /orders/products/{supplier}` — JSON |
| Asistente Compras IA: subir PDF de factura, parsear, agregar a inventario | ⬜ | — | Flujo de 2 pasos (preview + commit). Mockear Groq. |
| Editar/eliminar orden | ⬜ | — | |

**UX/UI — observaciones y sugerencias**:
- 💡 **Sugerencia UX**: el flujo "convertir orden a inventario" es destructivo. Confirmación con dialog + texto claro de qué va a pasar (cuántos items, qué almacén, qué movimientos se crean).
- 💡 **Sugerencia perf**: medir el tiempo de procesamiento del PDF en el AsistenteCompras. Si > 10s, falta UI de progreso ("Procesando página 2 de 5...").

---

## 6. Clientes

| Flujo | Estado | Spec | Notas |
|---|---|---|---|
| Alta cliente jurídica (con CUIT) | ✅ | [customers.spec.ts](specs/customers.spec.ts) | OK |
| Alta cliente física (con DNI) | ✅ | customers.spec.ts | OK |
| Validación de campos obligatorios | ✅ | customers.spec.ts | OK |
| **CUIT duplicado bloqueado** | ⬜ | — | **Crítico — SCRUM-31**. Hoy se valida en el form pero no hay test. |
| Edición de cliente | ⬜ | — | |
| Toggle activo / inactivo | ⬜ | — | Cliente inactivo no debe aparecer en buscador de Venta |
| Doble click en submit (SCRUM-30) | ⬜ | — | El botón debería deshabilitarse o el form bloquearse |
| Consultar CUIT vía AFIP/ARCA | ⬜ | — | `POST /afip/consultar-cuit` — mockear servicio externo |
| Estado de cuenta del cliente | ⬜ | — | Saldo acumulado a partir de ventas y pagos |
| Exportar a Excel | ⬜ | — | `GET /customers/{id}/export-excel` |
| Exportar a PDF | ⬜ | — | `GET /customers/{id}/export-pdf` |
| Crear cliente + usuario en un solo flujo (SCRUM-32) | ⬜ | — | Hoy es separado, hay que unificarlo |

**UX/UI — observaciones y sugerencias**:
- 🐛 **Bug conocido — TypeScript**: [resources/js/pages/Customers/Index.tsx:56](../../resources/js/pages/Customers/Index.tsx#L56) llama `usePage()` sin argumento esperado.
- 💡 **Sugerencia UX (SCRUM-30)**: deshabilitar el submit con `processing` durante el post para evitar doble click. Patrón estándar:
  ```tsx
  <Button type="submit" disabled={processing}>{processing ? 'Guardando...' : 'Guardar'}</Button>
  ```
- 💡 **Sugerencia UX**: el formulario tiene muchos campos (business_name, fantasy_name, tax_id, dni, phone, email, address, tax_status). Agrupar visualmente en secciones ("Datos fiscales", "Contacto") con `<Separator />`.
- 💡 **Sugerencia UX**: la búsqueda en `/customers` ¿es server-side o client-side? Si server, debounce 300ms. Si client, agregar empty state cuando no hay matches.

---

## 7. Ventas POS

Módulo más complejo y más crítico del sistema.

### 7.1 Creación de venta

| Flujo | Estado | Spec | Notas |
|---|---|---|---|
| POS carga clientes y artículos | ✅ | [sales.spec.ts](specs/sales.spec.ts) | OK |
| Búsqueda en el dropdown de artículos | ⬜ | — | Client-side. Filtrar por SKU o nombre. Mismo patrón que Transferencias/Create. |
| Agregar mismo artículo dos veces → suma cantidad | ⬜ | — | Lógica existente en `addArticuloFromSearch` |
| Cambiar lista de precios recalcula precios de items existentes | ⬜ | — | `recalcularPrecios` |
| Cambiar warehouse_id por item (al estilo "marcar entregada") | ⬜ | — | Cada item puede tener su warehouse |
| Cantidad > stock disponible en el warehouse → toast error | ✅ (parcial) | — | Recién fixeado. **Agregar regresión**: mensaje contiene nombre del producto y almacén, no IDs. |
| Venta con `auto_delivery` (entrega inmediata) | ⬜ | — | Descuenta stock al instante |
| Venta sin `auto_delivery` (entrega pendiente) | ⬜ | — | Crea delivery en `pending`, no descuenta stock |
| Venta a consumidor final (sin cliente con CUIT) | ⬜ | — | Letra B, tax_id desde dni |
| Venta Responsable Inscripto → Letra A | ⬜ | — | SCRUM-22. Validar selección automática de letra. |
| Generación correcta del número de factura (sin duplicados concurrentes) | ⬜ | — | SCRUM-23. Difícil de testear en E2E — dejar nota y cubrir en Pest. |
| Vendedor solo puede vender desde su PV asignado | ⬜ | — | Validar que el `point_of_sale_id` viene de `user->point_of_sale_id` ignorando el request |
| Vendedor sin PV → 403 con mensaje | ⬜ | — | |

### 7.2 Edición y eliminación de venta

| Flujo | Estado | Spec | Notas |
|---|---|---|---|
| Editar venta sin CAE | ⬜ | — | Recargo, descuento adicional |
| Editar venta con CAE → bloqueado | ⬜ | — | Redirect con mensaje |
| Eliminar venta → reversa stock de entregas | ⬜ | — | SCRUM-25. **Crítico**: verificar que `revert` se llama para cada delivery delivered. |
| Eliminar venta con CAE → ¿permite? | ⬜ | — | Definir reglas de negocio y testear |

### 7.3 Presupuestos

| Flujo | Estado | Spec | Notas |
|---|---|---|---|
| Crear presupuesto | ⬜ | — | Similar a venta pero sin descuento de stock |
| Estado del presupuesto (aprobado/rechazado/pendiente) | ⬜ | — | SCRUM-27 |
| Convertir presupuesto a venta | ⬜ | — | `POST /presupuestos/{id}/convertir-venta` |

### 7.4 ARCA / AFIP

| Flujo | Estado | Spec | Notas |
|---|---|---|---|
| Autorizar factura en ARCA (mock) | ⬜ | — | `POST /afip/authorize/{factura}`. Mockear el servicio. |
| Manejo de error en ARCA | ⬜ | — | Toast con mensaje del error, factura sigue sin CAE |
| Renovación automática de tokens | ⬜ | — | SCRUM-61 — backend, no E2E |

**UX/UI — observaciones y sugerencias**:
- 🐛 **Bug conocido — TypeScript**: [resources/js/pages/Ventas/Show.tsx:202](../../resources/js/pages/Ventas/Show.tsx#L202) y :300 pasan `trigger` a `DeleteConfirmationDialog` que no lo acepta.
- 💡 **Sugerencia UX (POS)**: agregar atajos de teclado. F2 = buscar artículo, F3 = buscar cliente, F4 = pagar. Es estándar en sistemas de venta.
- 💡 **Sugerencia UX (POS)**: cuando hay stock cross-warehouse (otro almacén tiene stock), ofrecer un botón inline "Transferir desde X" en lugar de bloquear la venta. Ya hay `stockByWarehouse` cargado, falta el CTA.
- 💡 **Sugerencia perf**: `Product::with(['category', 'brand', 'priceLists', 'images'])->get()` en VentaController::create carga todo el catálogo en cada apertura del POS. Medir con 5000 artículos — si tarda > 1s, paginar/buscar por API.

---

## 8. Cobros y pagos

| Flujo | Estado | Spec | Notas |
|---|---|---|---|
| Cobrar factura (un pago) | ⬜ | — | `POST /facturas/{factura}/pagos` |
| Cobrar parcial → factura queda en `payment_status = NO` | ⬜ | — | |
| Cobrar total → factura queda en `payment_status = SI` | ⬜ | — | |
| Cobrar exceso (vuelto) | ⬜ | — | Definir reglas |
| Eliminar un pago | ⬜ | — | `DELETE /pagos/{pago}` — verificar que recalcula `payment_status` |
| Pago con distintos métodos (efectivo, transferencia, tarjeta) | ⬜ | — | |
| Estado de cuenta del cliente refleja el pago | ⬜ | — | Cross-módulo con Customers |

**UX/UI — observaciones y sugerencias**:
- 💡 **Sugerencia UX**: en el form de pago, mostrar saldo pendiente y dejar el campo "monto" precargado con el saldo. Hoy puede estar vacío y obliga a calcular.
- 💡 **Sugerencia UX**: tras un pago, la factura debería refrescar su estado en la página sin reload. Validar que `Inertia::reload({ only: ['factura'] })` se llama.

---

## 9. Entregas

| Flujo | Estado | Spec | Notas |
|---|---|---|---|
| Auto-generación de delivery al crear venta | ✅ | [deliveries.spec.ts](specs/deliveries.spec.ts) | OK |
| Marcar delivery como entregada | ✅ | deliveries.spec.ts | OK |
| Entrega parcial (varios deliveries por venta) | ⬜ | — | |
| Cancelar delivery → reversa stock | ⬜ | — | `POST /entregas/{id}/cancelar` |
| Cambiar warehouse de un delivery pendiente | ⬜ | — | `PATCH /entregas/{id}/warehouse` |
| Stock insuficiente al marcar entregada → toast con nombres | ⬜ | — | **Acabamos de fixear este mensaje**. Cubrir como regresión. |
| Listado de entregas pendientes con filtros | ⬜ | — | `/entregas` |
| Idempotencia: doble click en "marcar entregada" no descuenta dos veces | ⬜ | — | Importante, el service tiene `if ($delivery->isDelivered()) return;` |

**UX/UI — observaciones y sugerencias**:
- 💡 **Sugerencia UX**: el modal de "marcar entregada" debería mostrar el stock por almacén con un radio button visual (no solo dropdown). Ya hay endpoint `stock-by-warehouse`.
- 💡 **Sugerencia UX**: si una entrega va a un almacén sin stock pero otro tiene stock, sugerir cambiar warehouse en el mismo dialog en lugar de bloquear.

---

## 10. Ecommerce público

| Flujo | Estado | Spec | Notas |
|---|---|---|---|
| Listado público del shop | ✅ | [ecommerce.spec.ts](specs/ecommerce.spec.ts) | OK |
| Detalle de producto | ⬜ | — | `/shop/{articulo}` |
| Agregar al carrito (logueado y guest) | 🟡 | ecommerce.spec.ts | Verifica 200 — no navega a `/cart` por race condition con reload |
| Carrito de sesión → fusión con usuario al login (SCRUM-44) | ⬜ | — | **Crítico**. Test: crear carrito como guest → login → verificar que el item sigue |
| Actualizar cantidad en carrito | ⬜ | — | `PATCH /cart/{cartItem}` |
| Remover item del carrito | ⬜ | — | `DELETE /cart/{cartItem}` |
| Vaciar carrito completo | ⬜ | — | `DELETE /cart` |
| Checkout: redirect a MercadoPago (mock) | ⬜ | — | SCRUM-47, 64. Mockear `page.route('**/checkout/payment**', ...)` |
| Webhook de MercadoPago actualiza pago | ⬜ | — | Backend, mejor cubrir en Pest |
| Compra exitosa: ver en `/my-purchases` | ⬜ | — | `GET /my-purchases` |
| Venta solo si pago aprobado (SCRUM-24) | ⬜ | — | Crítico. Si MercadoPago responde fail, NO se crea factura |
| Buscador de productos en tienda (SCRUM-49) | ⬜ | — | Hoy no existe. Agregar tras implementar feature |
| Personalización de marca (logo, colores) (SCRUM-50) | ⬜ | — | Tras implementar |
| Precios usan `default_ecommerce` (SCRUM-46) | ⬜ | — | Verificar que un artículo con precio distinto en POS lista vs ecommerce list muestra el correcto en shop |

**UX/UI — observaciones y sugerencias**:
- 💡 **Sugerencia UX**: el `window.location.reload()` que rompe la verificación del test es un anti-pattern Inertia. Reemplazar por `router.reload({ only: ['cart'] })`.
- 💡 **Sugerencia UX**: shop sin productos en stock → ¿se muestran como "agotado" o se ocultan? Definir y testear.
- 💡 **Sugerencia perf**: el listado del shop probablemente trae imágenes full-size. Verificar que usa thumbnail (`primaryImage`). Si no, hay payload innecesario.

---

## 11. Portal del cliente

| Flujo | Estado | Spec | Notas |
|---|---|---|---|
| Cliente entra a `/client/dashboard` | ⬜ | — | Saldo, últimas compras |
| Cliente edita su perfil | ⬜ | — | `PUT /client/profile` |
| Cliente NO puede ver portal de otro cliente | ⬜ | — | Aislamiento por `auth()->id()` |

**UX/UI**:
- 💡 **Sugerencia UX**: validar que el cliente no ve el sidebar admin (filtrado por rol).

---

## 12. Asistentes IA

| Flujo | Estado | Spec | Notas |
|---|---|---|---|
| Asistente Compras: subir PDF, parsear, preview, commit a inventario | ⬜ | — | Mockear Groq response. Validar que el preview muestra items extraídos y permite ajustar antes de confirmar. |
| Asistente Lista Proveedor: subir PDF, match por EAN/SKU, actualizar precios | ⬜ | — | Idem |
| Chat: enviar mensaje y recibir respuesta | ⬜ | — | Mockear Groq |
| Function calling: "crear categoría X" desde chat | ⬜ | — | 🐛 **Hay un bug preexistente**: `FunctionCallingService.php:6` importa `CategoriaController` borrado. Crear/actualizar el chat romperá. |

**UX/UI**:
- 🐛 **Bug crítico backend**: arreglar [FunctionCallingService.php:6](../../app/Services/FunctionCallingService.php#L6) y :211 — usan `CategoriaController` que ya no existe (se reemplazó por `CategoryController` en el merge).
- 💡 **Sugerencia UX**: durante el procesamiento del PDF, mostrar estado intermedio ("Extrayendo texto..." → "Pidiéndole al modelo..." → "Matcheando productos...").

---

## 13. Reportes, dashboard y auditoría

| Flujo | Estado | Spec | Notas |
|---|---|---|---|
| Dashboard admin: widgets de totales | ⬜ | — | Total ventas, clientes activos, stock bajo |
| Dashboard vendedor | ⬜ | — | Vista limitada por rol |
| Export Excel del dashboard | ⬜ | — | `GET /dashboard/export` |
| Activity Log paginado y filtrable | ⬜ | — | `/activity-log` |
| Estado de cuenta paginado (un cliente) | ⬜ | — | |

**UX/UI**:
- 🐛 **Bug conocido — TypeScript**: [resources/js/pages/dashboard.tsx:229](../../resources/js/pages/dashboard.tsx#L229) usa `valueClass` que no existe en uno de los items del array.
- 🐛 **Bug conocido — TypeScript**: [resources/js/pages/EstadosCuenta/Index.tsx:26](../../resources/js/pages/EstadosCuenta/Index.tsx#L26) usa `usePage` sin importarlo.

---

## 14. Códigos QR / barras / escáner

| Flujo | Estado | Spec | Notas |
|---|---|---|---|
| Generar código de barras del artículo | ⬜ | — | `GET /articulos/{id}/codigo-barras` — devuelve imagen |
| Generar código QR del artículo | ⬜ | — | |
| Imprimir etiquetas en lote | ⬜ | — | `POST /codigos/imprimir-etiquetas` |
| Scanner: buscar por código y agregar a venta | ⬜ | — | `POST /scanner/buscar` |

**UX/UI**:
- 🐛 **Bug TypeScript** ya reportado en módulo 2 (ImprimirEtiquetas).
- 💡 **Sugerencia UX**: el scanner del POS debería dar feedback sonoro/visual al match (beep + flash verde). Si no lo da, agregar.

---

## Resumen ejecutivo

### Cobertura actual
- **Total flujos catalogados**: ~120 (estimado conservador)
- **Cubiertos completamente**: 7 (~6%)
- **Parcialmente cubiertos**: 4
- **Sin cobertura**: ~110 (~92%)

### Top 10 a priorizar (orden sugerido)
1. **Vendedor → 403 en rutas admin** (SCRUM-54, base de seguridad)
2. **Eliminar venta reversa stock correctamente** (SCRUM-25, datos críticos)
3. **CUIT duplicado bloqueado** (SCRUM-31, datos)
4. **Carrito guest → login fusiona** (SCRUM-44, UX clave)
5. **Venta no se crea si pago MP falla** (SCRUM-24, datos críticos)
6. **Transferencias: regresión del SelectItem y del buscador SKU** (recién fixeado)
7. **Stock insuficiente toast con nombres en ventas y entregas** (recién fixeado)
8. **Orden a inventario atómico** (SCRUM-40, datos críticos)
9. **Conciliación de stock** (rara vez, pero crítica)
10. **Función calling del chat reparada** (bug latente del merge)

### Bugs de TypeScript pendientes (no E2E pero bloquean tests)
Listados en cada módulo. En total **8 errores** en:
- `nav-main.tsx`, `Articulos/Index.tsx`, `Codigos/ImprimirEtiquetas.tsx`,
  `Customers/Index.tsx`, `dashboard.tsx`, `EstadosCuenta/Index.tsx`, `Ventas/Show.tsx`

Arreglarlos en un PR separado antes de seguir agregando features — `npm run types` debería ser verde.

### Patrones de UX/UI repetidos como sugerencias
1. **Buscadores client-side** al estilo Ventas/Create donde aplique (Artículos Index, Clientes Index).
2. **Confirmación con dialog** para acciones destructivas (eliminar venta, regenerar precios, convertir orden).
3. **Loading + disabled durante async** para evitar doble submit (SCRUM-30).
4. **Empty states con mensaje y CTA** en cada listado vacío.
5. **Mensajes de error con nombres**, no IDs. Patrón ya aplicado a Delivery — replicar a StockTransfer, Order, etc.
6. **Mobile viewport** — ningún flujo se prueba a 375px hoy. Agregar al menos un check por módulo.

---

## Próximos pasos

1. **Crear los Page Objects faltantes**: `BrandsPage`, `CategoriesPage`, `WarehousesPage`, `PointsOfSalePage`, `StockTransfersPage`, `SuppliersPage`, `OrdersPage`, `PriceListsPage`, `PaymentsPage`.
2. **Pasos batch sugeridos** (combinable en una sesión por área):
   - Sprint test 1: Catálogo (artículos + marcas + categorías + precios) — 1 día
   - Sprint test 2: Inventario y stock (almacenes + transferencias + ajustes) — 1.5 días
   - Sprint test 3: Ventas avanzadas (edit + delete + reversión + presupuestos) — 2 días
   - Sprint test 4: Pagos y entregas avanzadas — 1 día
   - Sprint test 5: Ecommerce + portal cliente — 1.5 días
   - Sprint test 6: Asistentes IA + Chat (mockear externals) — 1 día
3. **Antes de cualquier sprint**: arreglar los 8 errores TypeScript pendientes.
