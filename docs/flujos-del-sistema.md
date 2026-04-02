# Flujos del Sistema — EPOS

**Última actualización:** 2026-04-01
**Stack:** Laravel 12 + React 19 + Inertia.js + Multitenancy (Stancl)

---

## Índice

1. [Panel Central (Landlord)](#1-panel-central-landlord)
2. [Autenticación](#2-autenticación)
3. [Dashboard](#3-dashboard)
4. [Clientes](#4-clientes)
5. [Artículos](#5-artículos)
6. [Inventario](#6-inventario)
7. [Ventas (POS)](#7-ventas-pos)
8. [Presupuestos](#8-presupuestos)
9. [Pagos](#9-pagos)
10. [Entregas](#10-entregas)
11. [Facturación Electrónica AFIP](#11-facturación-electrónica-afip)
12. [Compras a Proveedores](#12-compras-a-proveedores)
13. [Remitos de Proveedor](#13-remitos-de-proveedor)
14. [Listas de Precios](#14-listas-de-precios)
15. [E-commerce](#15-e-commerce)
16. [Checkout y Pago MercadoPago](#16-checkout-y-pago-mercadopago)
17. [Asistente IA (Chat)](#17-asistente-ia-chat)
18. [Asistente de Compras IA](#18-asistente-de-compras-ia)
19. [Configuración de Empresa](#19-configuración-de-empresa)
20. [Configuración AFIP](#20-configuración-afip)
21. [Configuración MercadoPago](#21-configuración-mercadopago)
22. [Usuarios y Roles](#22-usuarios-y-roles)
23. [Registro de Actividad](#23-registro-de-actividad)
24. [Perfil y Contraseña](#24-perfil-y-contraseña)
25. [Códigos QR y de Barras](#25-códigos-qr-y-de-barras)
26. [Telegram](#26-telegram)

---

## 1. Panel Central (Landlord)

> Área de administración global del SaaS. Opera sobre la base de datos central, separada de los tenants. Acceso exclusivo por `central.login`.

### 1.1 Alta de empresa (tenant)

**Ruta:** `POST /central/tenants`
**Rol requerido:** Superadmin central

**Flujo:**
1. El operador completa el formulario: razón social, CUIT, slug (subdominio), plan y credenciales del primer admin.
2. Se valida que el subdominio no esté en uso en la tabla `domains`.
3. Se crea el registro `Tenant` en la BD central.
4. El evento `TenantCreated` dispara automáticamente:
   - `CreateDatabase` — crea la base de datos `epos_{slug}`.
   - `MigrateDatabase` — ejecuta todas las migraciones de `database/migrations/tenant/`.
5. Se inicializa el contexto del tenant (`tenancy()->initialize()`).
6. Dentro del tenant se crean los 4 roles base (superadmin, admin, vendedor, cliente).
7. Se crea el primer usuario admin con la contraseña provista.
8. Se pre-popula `InitialSetting` con razón social, CUIT, punto de venta 1 y ambiente AFIP homologación.
9. Se cierra el contexto del tenant.

**Resultado:** La empresa queda operativa en `https://{slug}.{dominio_central}`.

### 1.2 Activar / Desactivar empresa

**Rutas:** `POST /central/tenants/{tenant}/activate` | `deactivate`

Cambia el campo `status` del tenant entre `active` e `inactive`. El middleware `BlockInactiveTenant` bloquea el acceso al tenant si está inactivo, devolviendo un error 403.

### 1.3 CRUD de tenants

Listar, ver detalle (con stats en vivo del tenant: usuarios, clientes, facturas, artículos), editar (razón social, CUIT, plan — sincroniza `InitialSetting` del tenant), eliminar (dispara `TenantDeleted` → `DeleteDatabase`).

---

## 2. Autenticación

### 2.1 Login de tenant

**Ruta:** `POST /login`

Autenticación estándar Laravel con guard `web`. Redirige según rol:
- `superadmin` / `admin` → `/admin/dashboard`
- `vendedor` → `/user/dashboard`
- `cliente` → `/client/dashboard`

### 2.2 Login central

**Ruta:** `POST /central/login`

Guard separado `central` que autentica contra la tabla `central_users`. No tiene acceso a datos de ningún tenant.

### 2.3 Registro, recuperación de contraseña, verificación de email

Flujos estándar del starter kit de Laravel. CRUD simple.

---

## 3. Dashboard

**Ruta:** `GET /admin/dashboard`
**Rol:** admin, superadmin

Muestra métricas del período seleccionado (fecha inicio / fin):
- Total ventas acumulado, clientes nuevos, ventas del mes, saldo impagas.
- Gráfico de torta: ventas por vendedor.
- Gráfico de línea: ventas por día.
- Tabla: productos más vendidos.

Permite exportar el reporte completo a Excel (múltiples hojas: resumen, ventas diarias, vendedores, productos).

---

## 4. Clientes

### 4.1 CRUD de clientes

Listar (con búsqueda), crear, editar, eliminar.

### 4.2 Consulta automática AFIP por CUIT

**Ruta:** `POST /afip/consultar-cuit`

Al ingresar un CUIT/DNI en el formulario de cliente, se consulta primero la API pública de AFIP (`soa.afip.gob.ar/sr-padron/v2/persona/{cuit}`). Si falla, hace fallback al WebService autenticado. Completa automáticamente: razón social, dirección, localidad, provincia, código postal y condición IVA.

### 4.3 Estado de cuenta del cliente

**Ruta:** `GET /clientes/{cliente}/estado-cuenta`

Muestra el historial completo de facturas del cliente con sus pagos, y un resumen de: total compras, total pagado, saldo pendiente. Exportable a Excel y PDF.

### 4.4 Estados de cuenta globales

**Ruta:** `GET /estados-cuenta`

Lista todos los clientes que tienen facturas impagas, con su saldo pendiente calculado.

---

## 5. Artículos

### 5.1 CRUD de artículos

Listar (con búsqueda y filtros), crear, editar, eliminar.

### 5.2 Gestión de imágenes

Al crear o editar un artículo se pueden subir múltiples imágenes. El servicio `ImageService` las redimensiona automáticamente y genera thumbnails. Se puede marcar una imagen como principal y reordenarlas por drag-and-drop.

### 5.3 CRUD de categorías

Listar, crear, editar, eliminar.

### 5.4 CRUD de marcas

Listar, crear, editar, eliminar.

---

## 6. Inventario

### 6.1 CRUD de inventario

Listar stock actual por artículo, crear entrada manual, editar cantidad, eliminar.

### 6.2 Movimientos de stock

El stock se modifica automáticamente en tres flujos:
- **Venta POS con entrega inmediata** → descuenta al crear la venta.
- **Entrega manual** → descuenta al registrar la entrega.
- **Conversión de remito a inventario** → suma al convertir.

---

## 7. Ventas (POS)

> Flujo más complejo del sistema. Crea una factura, gestiona stock, pagos y entregas en una sola transacción.

**Ruta:** `POST /ventas`

**Flujo completo:**

1. El vendedor selecciona el cliente. El frontend calcula y muestra en tiempo real la letra del comprobante que se va a generar (A, B o C) según la condición IVA de la empresa y del cliente.
2. Agrega artículos por búsqueda de texto, selector o escáner QR/código de barras.
3. El precio se toma de la lista de precios seleccionada (o precio base si no hay lista).
4. Puede aplicar recargo o descuento global.
5. Configura el pago: método, monto (puede ser parcial), y si se crea automáticamente.
6. Configura si la entrega es inmediata o diferida.

**En el backend (transacción atómica):**
1. Se determina la `letracomprobante` cruzando `InitialSetting.condicioniva` (empresa) con `Cliente.condicioniva`.
2. Se crea la `Factura` con `ptoventa` desde `InitialSetting`.
3. Se adjuntan los artículos a la factura con precio, cantidad, alícuota y subtotal.
4. Según `tipo_venta`:
   - **POS + entrega inmediata:** descuenta stock del `Inventario` y crea `Entrega` con estado `entregada`.
   - **POS + entrega diferida:** crea `Entrega` con estado `pendiente` (sin tocar stock).
   - **E-commerce:** crea `Entrega` pendiente con fecha estimada +3 días (sin tocar stock).
5. Se calculan subtotal, recargo, descuento y total.
6. Se actualiza la factura con los totales y el estado de pago (`SI` si `monto_pago >= total`).
7. Si hay monto de pago, se crea el registro `FacturaPago`.

### 7.1 Editar venta

Solo permite modificar recargo y descuento. Bloqueado si la factura ya tiene CAE de AFIP.

### 7.2 Eliminar venta

Restaura el inventario de todos los artículos de la factura antes de eliminar.

---

## 8. Presupuestos

**Flujo de creación:** igual a ventas pero sin afectar stock, sin pago y sin entrega. La letra siempre es `'P'`.

### 8.1 Convertir presupuesto a venta

**Ruta:** `POST /presupuestos/{presupuesto}/convertir-venta`

Copia todos los artículos del presupuesto a una nueva `Factura` con `condicionventa = 'CUENTA CORRIENTE'` y `pagada = 'NO'`. No descuenta stock ni crea pago automático — el vendedor debe registrarlos por separado.

> **Bug conocido:** la conversión hardcodea `letracomprobante = 'B'`. Pendiente aplicar la misma lógica de determinación que en ventas directas.

---

## 9. Pagos

**Ruta:** `POST /facturas/{factura}/pagos`

Registra un pago parcial o total sobre una factura existente. Actualiza automáticamente el estado `pagada` de la factura si `total_pagado >= total`.

Eliminar un pago revierte el estado de la factura a `NO` si el saldo vuelve a ser positivo.

---

## 10. Entregas

### 10.1 Registrar entrega manual

**Ruta:** `POST /facturas/{factura}/entregas`

Para facturas con entrega diferida. Selecciona artículos y cantidades a entregar. En transacción:
1. Verifica stock suficiente para cada artículo.
2. Descuenta del `Inventario`.
3. Crea `Entrega` con estado `entregada`.

### 10.2 Panel de entregas pendientes

**Ruta:** `GET /entregas`

Lista todas las entregas con estado `pendiente` ordenadas por fecha. Permite marcar como entregada (descuenta stock) o cancelar.

### 10.3 Marcar como entregada

Descuenta stock e invalida la entrega. No se puede revertir.

### 10.4 Cancelar entrega

Solo disponible si la entrega está en estado `pendiente`. No afecta stock.

---

## 11. Facturación Electrónica AFIP

**Ruta:** `POST /afip/authorize/{factura}`

> Flujo crítico. Requiere certificados AFIP configurados y conexión a los WebServices de AFIP.

**Flujo:**

1. Se obtiene la condición IVA de la empresa desde `InitialSetting`.
2. Se determina el tipo de comprobante AFIP (`cbteTipo`) y la condición del receptor (`CondicionIVAReceptor`) según la tabla:

   | Empresa | Cliente | cbteTipo | Descripción |
   |---|---|---|---|
   | Responsable Inscripto | Responsable Inscripto | 1 | Factura A |
   | Responsable Inscripto | Monotributista | 1 | Factura A |
   | Responsable Inscripto | Exento | 6 | Factura B |
   | Responsable Inscripto | Consumidor Final | 6 | Factura B |
   | Monotributista / Exento | Cualquiera | 11 | Factura C |

3. Se calcula el desglose de IVA por alícuota desde los artículos de la factura.
   - Para Factura C: `ImpNeto = total`, `ImpIVA = 0`, sin array de alícuotas (no discrimina IVA).
4. Se determina el tipo de documento del cliente: CUIT (11 dígitos, tipo 80), DNI (8 dígitos, tipo 96) o sin identificación (tipo 99).
5. Se llama a `AfipWebService::autorizarFactura()` con todos los datos.
6. Si AFIP responde con éxito, se actualiza la factura con `cae`, `vencimiento_cae`, `numfactura` (número oficial AFIP) y `autorizada_afip = true`.
7. Una factura autorizada no puede editarse ni eliminarse.

### 11.1 Generación de PDF de factura

**Ruta:** `GET /facturas/{factura}/pdf`

Genera el PDF con formato AFIP usando DomPDF. Incluye: datos de la empresa, datos del cliente, detalle de artículos, totales, CAE y código de barras.

---

## 12. Compras a Proveedores

### 12.1 CRUD de proveedores

Listar, crear, editar, eliminar.

### 12.2 CRUD de compras

Registra una orden de compra a un proveedor con detalle de artículos, cantidades y precios unitarios. No afecta el inventario directamente — el stock se actualiza al convertir el remito.

---

## 13. Remitos de Proveedor

### 13.1 CRUD de remitos

Listar, crear (con artículos filtrados por proveedor), ver detalle, eliminar.

### 13.2 Convertir remito a inventario

**Ruta:** `POST /remitos/{remito}/convertir-inventario`

Operación de un solo uso (idempotente por el flag `convertido_inventario`):
1. Por cada artículo del remito, busca el registro de `Inventario`.
2. Si existe, incrementa la cantidad. Si no existe, lo crea.
3. Marca el remito como `convertido_inventario = true`.

---

## 14. Listas de Precios

### 14.1 CRUD de listas de precios

Listar, crear, editar, eliminar. Cada lista tiene un porcentaje de ajuste sobre el precio base y flags `default_pos` y `default_ecommerce`.

### 14.2 Regenerar precios

**Ruta:** `POST /listas-precios/{lista}/regenerar`

Recalcula los precios de todos los artículos asociados a la lista aplicando el porcentaje configurado sobre el precio base actual de cada artículo.

---

## 15. E-commerce

### 15.1 Tienda pública

**Ruta:** `GET /shop`

Listado paginado de artículos con imágenes, precio formateado en pesos argentinos, categoría y marca. Acceso público sin autenticación.

### 15.2 Detalle de producto

**Ruta:** `GET /shop/{articulo}`

Vista de detalle con galería de imágenes, descripción y botón de agregar al carrito.

### 15.3 Carrito

El carrito se gestiona en la tabla `carts`. Si el usuario está autenticado se asocia por `user_id`; si no, por `session_id`. Esto permite que el carrito persista entre sesiones.

- `POST /cart/{articulo}` — agregar producto
- `PATCH /cart/{cartItem}` — actualizar cantidad
- `DELETE /cart/{cartItem}` — eliminar producto
- `DELETE /cart` — vaciar carrito (con confirmación)

---

## 16. Checkout y Pago MercadoPago

> Requiere credenciales de MercadoPago configuradas en `/settings/mercadopago`.

**Ruta:** `POST /checkout/payment`

**Flujo:**

1. El usuario autenticado llega al checkout con el carrito no vacío.
2. El frontend inicializa el SDK de MercadoPago con la `public_key` del tenant.
3. El usuario completa los datos de tarjeta. MercadoPago genera un `token` de pago en el cliente (nunca pasan datos de tarjeta al servidor).
4. Se envía al backend: `token`, `payment_method_id`, `installments`, `issuer_id`.
5. En el backend:
   a. Se busca o crea el `Cliente` asociado al email del usuario autenticado.
   b. Se crea la `Factura` con `tipo_venta = 'ecommerce'` y `pagada = 'NO'`.
   c. Se adjuntan los artículos y se crean `Entrega` pendientes para cada uno.
   d. Se llama a la API de MercadoPago con el `access_token` del tenant.
6. Según el resultado:
   - **approved** → se crea `FacturaPago`, se marca la factura como `pagada = 'SI'`, se vacía el carrito, redirige a `/checkout/success`.
   - **pending** → redirige a `/checkout/pending` (el pago está en proceso).
   - **rejected** → redirige a `/checkout/failure`.

---

## 17. Asistente IA (Chat)

**Ruta:** `POST /chat/send`

Chat conversacional con IA (Ollama/LLM local). Mantiene historial de la conversación en la sesión. Soporta function calling: el modelo puede consultar datos del sistema (ventas, stock, clientes) en tiempo real para responder preguntas de negocio.

---

## 18. Asistente de Compras IA

**Ruta:** `POST /asistente-compras/process`

**Flujo:**

1. El usuario sube un PDF o imagen (factura de proveedor, lista de precios, etc.).
2. `PdfProcessorService` extrae el texto del archivo y lo envía al LLM.
3. El modelo identifica artículos, cantidades y precios en el documento.
4. Se devuelve al frontend una lista estructurada de ítems reconocidos.
5. El usuario revisa y confirma qué ítems agregar al inventario.
6. `POST /asistente-compras/add-inventory` incrementa el stock de cada artículo confirmado.

---

## 19. Configuración de Empresa

**Ruta:** `POST /empresa`
**Rol:** superadmin

Guarda o actualiza el único registro de `InitialSetting` del tenant. Incluye: razón social, CUIT, condición IVA, dirección, teléfono, email, punto de venta, logo, datos AFIP y datos MercadoPago. El logo se sube como archivo y se almacena en `storage/app/public`.

---

## 20. Configuración AFIP

**Ruta:** `POST /settings/afip/upload`

Sube los archivos `cert.pem` y `key.pem` al directorio privado del tenant (`storage/app/private/tenants/{id}/afip/`). Invalida los tokens de autenticación existentes para forzar su regeneración.

### 20.1 Health check de servicios AFIP

**Ruta:** `GET /settings/afip/health`

Verifica en tiempo real el estado de:
- **Certificados:** validez, fecha de expiración, días restantes.
- **API pública:** conectividad con `soa.afip.gob.ar`.
- **WSFE:** autenticación con el WebService de facturación electrónica.
- **Padrón autenticado:** autenticación con el WebService de padrón.

---

## 21. Configuración MercadoPago

**Ruta:** `POST /settings/mercadopago`

Guarda `mp_access_token`, `mp_public_key` y `mp_ambiente` en `InitialSetting`. Estas credenciales son por tenant — cada empresa tiene las suyas.

---

## 22. Usuarios y Roles

### 22.1 CRUD de usuarios

Listar, crear (con asignación de rol), editar, eliminar. Solo superadmin.

### 22.2 CRUD de roles

Listar, crear, editar, eliminar. Los permisos se almacenan como string separado por comas (ej: `manage_users,manage_products`). Solo superadmin.

### 22.3 Sistema de roles

El middleware `role:{roles}` verifica `auth()->user()->role->role` contra los roles permitidos. Los roles disponibles son: `superadmin`, `admin`, `vendedor`, `cliente`.

---

## 23. Registro de Actividad

**Ruta:** `GET /activity-log`
**Rol:** superadmin

Muestra el log de actividad generado por `spatie/laravel-activitylog`. Registra automáticamente creaciones, actualizaciones y eliminaciones de los modelos que usan el trait `LogsActivity`. Las acciones se muestran traducidas al español.

---

## 24. Perfil y Contraseña

- `PATCH /settings/profile` — actualizar nombre y email del usuario autenticado.
- `PUT /settings/password` — cambiar contraseña (requiere contraseña actual, con throttle 6 intentos/minuto).
- `DELETE /settings/profile` — eliminar cuenta propia.
- `GET /settings/appearance` — cambiar tema (claro/oscuro/sistema).

---

## 25. Códigos QR y de Barras

**Rutas:** `GET /articulos/{articulo}/codigo-barras` | `codigo-qr` | `codigos`

Genera imágenes de código de barras (Code128) y QR para cada artículo usando el `codarticulo`. Permite imprimir etiquetas en lote seleccionando múltiples artículos.

El escáner en el POS de ventas (`POST /scanner/buscar`) recibe un código escaneado y devuelve el artículo correspondiente para agregarlo automáticamente a la venta.

---

## 26. Telegram

**Ruta:** `POST /settings/telegram/verify`

Vincula la cuenta de Telegram del usuario con su cuenta del sistema mediante un código de verificación. Una vez vinculado, el bot de Telegram puede responder consultas del usuario (stock, ventas, etc.) usando el mismo motor de IA del chat.

El webhook de Telegram (`POST /telegram/webhook`) recibe los mensajes entrantes y los procesa a través de `TelegramWebhookController`, que delega en los servicios de IA y function calling.

---

## Resumen de roles y accesos

| Módulo | superadmin | admin | vendedor | cliente |
|---|:---:|:---:|:---:|:---:|
| Panel central | ✗ | ✗ | ✗ | ✗ |
| Dashboard admin | ✓ | ✓ | ✗ | ✗ |
| Usuarios / Roles | ✓ | ✗ | ✗ | ✗ |
| Empresa / Actividad | ✓ | ✗ | ✗ | ✗ |
| Artículos / Categorías / Marcas | ✓ | ✓ | ✗ | ✗ |
| Inventario | ✓ | ✓ | ✗ | ✗ |
| Proveedores / Remitos / Compras | ✓ | ✓ | ✗ | ✗ |
| Listas de precios | ✓ | ✓ | ✗ | ✗ |
| Clientes | ✓ | ✓ | ✓ | ✗ |
| Ventas / Presupuestos | ✓ | ✓ | ✓ | ✗ |
| Entregas / Pagos | ✓ | ✓ | ✓ | ✗ |
| AFIP / MercadoPago settings | ✓ | ✓ | ✓ | ✗ |
| E-commerce (tienda) | ✓ | ✓ | ✓ | ✓ |
| Dashboard cliente | ✗ | ✗ | ✗ | ✓ |
