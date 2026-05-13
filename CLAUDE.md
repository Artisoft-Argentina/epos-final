# EPOS — Contexto del proyecto para IA

Este archivo es leído automáticamente por Claude Code y Amazon Q al iniciar una sesión. Contiene todo el contexto necesario para colaborar en el proyecto.

---

## ¿Qué es EPOS?

Sistema de gestión comercial **multi-tenant** para PyMEs argentinas. Cada empresa (tenant) tiene su propio subdominio, base de datos y configuración. El sistema incluye:

- **Punto de venta (POS)** con facturación electrónica ARCA (ex-AFIP)
- **Ecommerce** con carrito, checkout y pagos con MercadoPago
- **Panel central** para gestión de tenants (superadmin)
- **Módulos**: Clientes, Artículos, Inventario, Ventas, Compras, Proveedores, Listas de Precios
- **IA integrada**: asistente de compras (lectura de facturas/remitos PDF), asistente de precios de proveedor (listas de precios PDF)

---

## Stack tecnológico

### Backend
| Tecnología | Versión | Rol |
|---|---|---|
| PHP | 8.4 | Runtime |
| Laravel | 12 | Framework principal |
| stancl/tenancy | 3.9 | Multi-tenancy (subdominio + DB separada por tenant) |
| MySQL | 8.0 | Base de datos (una por tenant + central) |
| Redis | 7 | Cache y sesiones |
| Groq API | llama-3.3-70b | IA para procesamiento de PDFs |
| smalot/pdfparser | — | Extracción de texto de PDFs |
| Spatie Activity Log | — | Auditoría de acciones |
| Spatie Permissions | — | Roles y permisos granulares |

### Frontend
| Tecnología | Versión | Rol |
|---|---|---|
| React | 19 | UI |
| Inertia.js | 2.1 | SPA sin API REST (SSR-like) |
| TypeScript | — | Tipado |
| Vite | — | Build tool |
| Tailwind CSS | 4 | Estilos |
| shadcn/ui | — | Componentes |
| Lucide React | — | Iconos |

### Infraestructura
| Tecnología | Rol |
|---|---|
| Docker (Alpine multi-stage) | Contenedores de desarrollo y producción |
| Nginx + PHP-FPM + Supervisor | Servidor web dentro del contenedor |
| GitHub Actions | CI/CD |
| GitHub Container Registry (GHCR) | Registry de imágenes Docker |
| Traefik | Reverse proxy + SSL wildcard automático (Let's Encrypt) |
| lvh.me | DNS local para desarrollo (`*.lvh.me → 127.0.0.1`) |

---

## Arquitectura multi-tenant

- **Identificación**: por subdominio (`empresa1.epos.lvh.me:3000`)
- **Aislamiento**: cada tenant tiene su propia base de datos MySQL (`epos_<id>`)
- **Dominio central**: `epos.lvh.me` (panel de superadmin)
- **Bootstrappers activos**: DatabaseTenancyBootstrapper, CacheTenancyBootstrapper, QueueTenancyBootstrapper
- **FilesystemTenancyBootstrapper**: deshabilitado (assets Vite compartidos)

### Roles del sistema
| Rol | Acceso |
|---|---|
| `superadmin` | Panel central: crear/ver/suspender empresas |
| `admin` | Todos los módulos de la empresa (excepto Configuración de usuarios) |
| `vendedor` | Solo módulo de Ventas |
| `cliente` | Portal de cliente: estado de cuenta, perfil |

---

## Estructura de directorios clave

```
app/
  Http/Controllers/       # Controladores (central y tenant)
  Models/                 # Eloquent models
  Services/               # Lógica de negocio
    PrecioProveedorService.php   # IA: procesamiento de listas de precios PDF
    AsistenteComprasService.php  # IA: procesamiento de facturas/remitos PDF
resources/
  js/
    pages/                # Páginas React (una por ruta)
    components/           # Componentes reutilizables
    layouts/              # Layouts (AppLayout, AuthLayout)
routes/
  web.php                 # Rutas tenant (con middleware de rol)
  central.php             # Rutas panel central
database/
  migrations/tenant/      # Migraciones que se ejecutan por tenant
  migrations/             # Migraciones de la BD central
  seeders/                # Seeders de datos iniciales
docker/
  nginx.conf, php.ini, supervisord.conf, entrypoint.sh
deploy/
  traefik/, dev/, qa/, prod/   # Config por ambiente en el VPS
```

---

## Comandos de desarrollo local

```bash
# Primer setup (clonar + levantar)
make setup

# Día a día
make up              # Levantar servicios Docker
make down            # Bajar servicios
make logs            # Ver logs en tiempo real
make shell           # Shell en el contenedor
make migrate         # php artisan migrate (BD central)
make tenant-migrate  # php artisan tenants:migrate (todas las BDs de tenant)
make fresh           # Reset total + seeders
make tinker          # Laravel Tinker
make rebuild         # Reconstruir imagen desde cero
```

**URLs locales:**
- Panel central: `http://epos.lvh.me:3000` (superadmin)
- Tenant: `http://<nombre>.epos.lvh.me:3000`

**Credenciales por defecto (seeder):**
- Superadmin central: `admin@epos.com` / `password`
- Tenant demo: `gepetto@mail.com` / `asdf1234`

---

## Variables de entorno importantes

```env
CENTRAL_DOMAIN=epos.lvh.me          # Dominio del panel central
TENANCY_DB_PREFIX=epos_             # Prefijo de BDs de tenants
SESSION_DOMAIN=.lvh.me              # Cookies para subdominios
GROQ_API_KEY=                       # API key de Groq (IA)
AFIP_ENVIRONMENT=homologacion       # homologacion | produccion
MERCADOPAGO_ACCESS_TOKEN=           # Token de MercadoPago
TELEGRAM_BOT_ADMIN_TOKEN=           # Bot de Telegram para alertas
AI_PROVIDER=groq                    # groq | ollama
```

---

## Módulos y funcionalidades

### Panel Central (superadmin)
- Crear, ver, editar y suspender empresas (tenants)
- Cada empresa tiene: razón social, CUIT, plan, estado
- Al crear una empresa se provisiona automáticamente su BD y se ejecutan las migraciones tenant

### Módulo de Ventas (POS)
- Facturas y presupuestos
- Facturación electrónica ARCA (CAE, letra A/B según condición IVA)
- Estados de factura: pendiente, pagada, cancelada
- Entregas pendientes con trazabilidad
- Restauración de stock al eliminar facturas

### Módulo de Clientes
- Alta, edición, consulta de datos
- Un cliente puede o no tener usuario en el sistema
- Portal del cliente: estado de cuenta, perfil
- Estado de cuenta con saldo acumulado
- Validación de CUIT único

### Módulo de Artículos e Inventario
- Catálogo de artículos con código de barras (EAN) y código de proveedor (codprov)
- Control de stock
- Listas de precios: precio base (`articulo.precio`) + porcentaje por lista (`articulo_lista_precio.precio`)
- Impresión de etiquetas con código QR/barras
- Movimientos de stock (trazabilidad) — en desarrollo

### Módulo de Compras y Proveedores
- Gestión de proveedores
- Remitos de compra (recepción de mercadería)
- Conversión de remito a inventario (debe ser atómica)
- Módulo Compras vs Remitos: flujo a unificar

### Ecommerce
- Tienda online por tenant con subdominio propio
- Carrito de compras (sesión + usuario)
- Checkout con MercadoPago
- Webhook de MercadoPago para actualización asíncrona de pagos
- Precios desde lista de precios configurada como `default_ecommerce`
- Personalización: logo y colores de marca

### Módulo de IA
- **Asistente de Compras** (`/asistente-compras`): sube PDF de factura/remito → IA extrae ítems → crea movimiento de inventario
- **Asistente de Precios** (`/asistente-precios`): sube PDF de lista de precios de proveedor → IA extrae precios → actualiza precio en lista de precios default POS (match por EAN o SKU)

### Integraciones externas
- **ARCA (ex-AFIP)**: autorización de comprobantes electrónicos, certificados por tenant, tokens con renovación automática (pendiente)
- **MercadoPago**: pagos en checkout, webhook de notificaciones
- **Telegram**: alertas de administración

---

## Convenciones de código

### PHP / Laravel
- Controladores delgados: lógica en Services
- Transacciones DB explícitas para operaciones críticas (`DB::transaction`)
- `lockForUpdate()` en operaciones concurrentes (ej: numeración de facturas)
- Migraciones tenant en `database/migrations/tenant/`
- Modelos tenant extienden de modelos base sin tenancy bootstrapping

### React / TypeScript
- Páginas en `resources/js/pages/<Módulo>/Index.tsx` (o Create, Edit, Show)
- Componentes en `resources/js/components/`
- Fetch a endpoints propios con `X-CSRF-TOKEN` desde `<meta name="csrf-token">`
- No usar axios (fue removido) — usar `fetch` nativo
- shadcn/ui para componentes base (Button, Card, Badge, Input, etc.)

### Naming convention (BD, modelos y props)
- **Toda la capa de datos en inglés**: columnas de BD, atributos de modelos Eloquent, claves de pivot, props que envía el backend a Inertia. No mezclar idiomas en el mismo recorrido.
- **Mapeo canónico** (referencias rápidas para el frontend):
  - `Customer`: `business_name`, `fantasy_name`, `tax_id`, `dni`, `phone`, `email`, `address`, `tax_status` (NO `razonsocial`, `nombre`, `apellido`, `cuit`).
  - `Product`: `name`, `sku`, `price`, `description`, `unit`, `tax_rate`, `barcode`, `min_stock`, `images`, `category`, `brand`, `priceLists` (NO `articulo`, `codarticulo`, `precio`, `medida`, `alicuota`, `codigo_barras`, `imagenes`, `categoria`, `marca`, `listas_precios`).
  - `Sale`: `invoice_number`, `pos_number`, `voucher_letter`, `total`, `subtotal`, `customer`, `products`, `deliveries`, `sale_type` (NO `numfactura`, `tipo_venta`, `cliente`, `articulos`, `factura`).
  - `Delivery`: `quantity`, `delivery_date`, `actual_delivery_date`, `status`, `warehouse`, `product`, `sale` (NO `cantidad`, `fecha_entrega`, `estado`, `articulo`, `factura`).
  - `Order`: `order_number`, `pos_number`, `date`, `total`, `supplier`, `products`, `warehouse` (NO `numero`, `fecha`, `proveedor`, `articulos`).
  - Categorías: `name` (NO `categoria`). Marcas: `name` (NO `marca`).
- **Nombres en español permitidos**: solo en URLs/rutas (`/ventas`, `/articulos`, `/almacenes`) y nombres de archivos de páginas/controllers (`VentaController`, `Ventas/Create.tsx`). Esos son alias de UX. Adentro de los archivos se usan los nombres reales del modelo.
- **Variables locales en español**: aceptable cuando aporta claridad de dominio (`$factura`, `$articulo`) pero los **atributos** que se acceden son siempre en inglés (`$factura->invoice_number`, `$articulo->name`).
- **Si encontrás código viejo con nombres en español como `razonsocial`, `articulo.articulo`, `numfactura`**, etc.: arreglalo a la convención inglés. Es deuda técnica heredada del sistema original.

### Rutas
- Rutas tenant en `routes/web.php` agrupadas por rol (`role:admin,superadmin`)
- Rutas centrales en `routes/central.php`
- Inertia renderiza con `Inertia::render('Módulo/Index', [...props])`

---

## Historial de Jira — Proyecto SCRUM

### Epics
| Epic | Descripción |
|---|---|
| SCRUM-11 Ventas | Presupuestos, facturas, pagos, entregas y flujo POS |
| SCRUM-12 Clientes | Alta, edición, AFIP/ARCA, estado de cuenta, portal |
| SCRUM-13 Artículos e Inventario | Catálogo, stock, listas de precios, movimientos |
| SCRUM-14 Compras y Proveedores | Proveedores, órdenes de compra, remitos |
| SCRUM-15 Ecommerce | Tienda online, carrito, checkout, MercadoPago, marca |
| SCRUM-16 Administración y Seguridad | Usuarios, roles, permisos, panel central, auditoría |
| SCRUM-17 Integraciones Externas | ARCA, MercadoPago, Telegram |
| SCRUM-18 Correcciones Funcionales | Bugs y comportamientos incorrectos |
| SCRUM-19 Mejoras Técnicas | Refactoring, tests, deuda técnica |
| SCRUM-20 Infraestructura | Docker, CI/CD, servidores, variables de entorno |
| SCRUM-21 Monitoreo | Logging estructurado, alertas, observabilidad |

### Historias — Ventas
| Key | Historia | Estado |
|---|---|---|
| SCRUM-22 | Corregir determinación automática de letra de comprobante (A/B) según condición IVA | Por hacer |
| SCRUM-23 | Corregir generación de número de factura para evitar duplicados en concurrencia | Por hacer |
| SCRUM-24 | Crear factura solo si el pago fue aprobado en checkout | Por hacer |
| SCRUM-25 | Corregir restauración de stock al eliminar una factura según estado de entrega | Por hacer |
| SCRUM-26 | Mejorar estados de factura para mayor trazabilidad del ciclo de vida | Por hacer |
| SCRUM-27 | Agregar estado al presupuesto (aprobado/rechazado/pendiente) | Por hacer |
| SCRUM-28 | Revisión de UI/UX del módulo de ventas en web y mobile | Por hacer |
| SCRUM-29 | Agregar cobertura de tests para flujos críticos del módulo de ventas | Por hacer |
| SCRUM-69 | Corregir generación de número de factura en checkout ecommerce | Por hacer |

### Historias — Clientes
| Key | Historia | Estado |
|---|---|---|
| SCRUM-30 | Corregir bug de doble clic en formulario de alta de clientes | Por hacer |
| SCRUM-31 | Agregar validación de unicidad de CUIT al crear y editar clientes | Por hacer |
| SCRUM-32 | Unificar flujo de creación de cliente y usuario-cliente en un único proceso | Por hacer |
| SCRUM-33 | Revisar y definir campos obligatorios y opcionales en el formulario de cliente | Por hacer |
| SCRUM-34 | Revisión de UI/UX del módulo de clientes en web y mobile | Por hacer |
| SCRUM-35 | Agregar cobertura de tests para el módulo de clientes | Por hacer |

### Historias — Artículos e Inventario
| Key | Historia | Estado |
|---|---|---|
| SCRUM-36 | Corregir mass assignment en creación de registros de inventario | Por hacer |
| SCRUM-37 | Implementar trazabilidad de movimientos de stock por artículo | Por hacer |
| SCRUM-38 | Revisión de UI/UX del módulo de artículos e inventario en web y mobile | Por hacer |
| SCRUM-39 | Agregar cobertura de tests para el módulo de artículos e inventario | Por hacer |

### Historias — Compras y Proveedores
| Key | Historia | Estado |
|---|---|---|
| SCRUM-40 | Corregir conversión de remito a inventario para garantizar atomicidad | Por hacer |
| SCRUM-41 | Definir y unificar el flujo de compras entre módulo Remito y módulo Compra | Por hacer |
| SCRUM-42 | Revisión de UI/UX del módulo de compras y proveedores en web y mobile | Por hacer |
| SCRUM-43 | Agregar cobertura de tests para el módulo de compras y proveedores | Por hacer |

### Historias — Ecommerce
| Key | Historia | Estado |
|---|---|---|
| SCRUM-44 | Corregir fusión del carrito de sesión al iniciar sesión | Por hacer |
| SCRUM-45 | Corregir venta de artículos sin stock en el ecommerce | Por hacer |
| SCRUM-46 | Corregir precios en ecommerce para usar la lista de precios configurada | Por hacer |
| SCRUM-47 | Implementar webhook de MercadoPago para actualización asíncrona de pagos | Por hacer |
| SCRUM-48 | Revisar y validar el flujo completo de compra online | Por hacer |
| SCRUM-49 | Agregar buscador de productos en la tienda online | Por hacer |
| SCRUM-50 | Personalización de marca: colores y logo | Por hacer |
| SCRUM-51 | Revisión de UI/UX de la tienda online en web y mobile | Por hacer |
| SCRUM-52 | Agregar cobertura de tests para el módulo de ecommerce | Por hacer |
| SCRUM-64 | Validar integración completa de MercadoPago end-to-end | Por hacer |

### Historias — Administración y Seguridad
| Key | Historia | Estado |
|---|---|---|
| SCRUM-53 | Corregir bug de doble clic en creación de empresa en panel central | Por hacer |
| SCRUM-54 | Aplicar middleware de autorización por rol en todas las rutas | Por hacer |
| SCRUM-55 | Definir e implementar permisos granulares por rol con Spatie Permissions | Por hacer |
| SCRUM-56 | Centralizar y revisar configuración de empresa para ARCA | Por hacer |
| SCRUM-57 | Agregar funcionalidad de editar y suspender empresa en panel central | Por hacer |
| SCRUM-58 | Extender ActivityLog a todos los modelos críticos | Por hacer |
| SCRUM-59 | Revisión de UI/UX del panel de administración y panel central | Por hacer |
| SCRUM-60 | Agregar cobertura de tests para administración, roles y seguridad | Por hacer |

### Historias — Integraciones ARCA / MercadoPago
| Key | Historia | Estado |
|---|---|---|
| SCRUM-61 | Implementar renovación automática de tokens ARCA | Por hacer |
| SCRUM-62 | Refactorizar health check de ARCA para eliminar uso de ReflectionClass | Por hacer |
| SCRUM-63 | Robustecer almacenamiento y validación de certificados ARCA por tenant | Por hacer |
| SCRUM-65 | Agregar cobertura de tests para integraciones con ARCA y MercadoPago | Por hacer |

### Historias — Infraestructura y DevOps
| Key | Historia | Estado |
|---|---|---|
| SCRUM-66 | Resolver tablas y migraciones huérfanas del sistema original | **En curso** |
| SCRUM-67 | Establecer estructura base de tests funcionales con Pest | Por hacer |
| SCRUM-68 | Actualizar .env.example con todas las variables de entorno requeridas | Por hacer |
| SCRUM-70 | Configurar pipeline de CI/CD para automatizar validación y despliegue | Por hacer |
| SCRUM-71 | Implementar logging estructurado y monitoreo de errores en producción | Por hacer |

---

## MCPs disponibles en Claude Code

El equipo tiene configurados los siguientes MCP servers (scope user):

| MCP | Capacidad |
|---|---|
| `jira` | Leer, buscar y actualizar historias del proyecto SCRUM |
| `playwright` | Testing E2E, screenshots, interacción con el browser |
| `testsprite` | Testing autónomo con IA |
| `fetch` | Hacer requests HTTP a APIs externas |
| `db` | Query directo a MySQL local (Docker, puerto 3307) |
| `logs` | Leer archivos en `storage/logs/` |
| `sentry` | Ver y analizar errores de producción |

Para leer una historia antes de empezar: pedile a Claude "leé la historia SCRUM-XX".

---

## Jira
- **Proyecto**: SCRUM
- **Board**: https://artisoft-sys.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog
- **Instancia**: artisoft-sys.atlassian.net

---

## Notas importantes

- **No usar axios**: fue removido del proyecto. Usar `fetch` nativo con header `X-CSRF-TOKEN`.
- **Build de assets**: los assets Vite NO están en la imagen Docker (volumen separado). Después de cambios en `.tsx`/`.ts`, buildear con `npm run build` en el host y copiar al contenedor con `docker cp public/build/. epos-app:/var/www/html/public/build/`.
- **OPcache**: cambios en PHP pueden requerir `docker exec epos-app kill -USR2 $(pgrep -o php-fpm)` o `docker restart epos-app`.
- **Multi-tenant**: las migraciones en `database/migrations/tenant/` se ejecutan con `php artisan tenants:migrate`, no con `php artisan migrate`.
- **Lista de precios default**: `listas_precios.default_pos = true` es la lista que usa el POS. `default_ecommerce = true` es la que usa el ecommerce.
- **Facturación ARCA**: certificados almacenados en `storage/app/private/afip/<tenant_id>/`. En homologación no se requiere certificado real.
