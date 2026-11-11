# EPOS — Contexto del proyecto para IA

Este archivo es leído automáticamente por Claude Code y Amazon Q al iniciar una sesión. Contiene todo el contexto necesario para colaborar en el proyecto.

---

## ¿Qué es EPOS?

Sistema de gestión comercial para PyMEs argentinas. **Un deploy = una empresa** (su propia base de datos, dominio y configuración). El sistema incluye:

- **Punto de venta (POS)** con facturación electrónica ARCA (ex-AFIP)
- **Ecommerce** con carrito, checkout y pagos con MercadoPago
- **Módulos**: Clientes, Artículos, Inventario, Ventas, Compras, Proveedores, Listas de Precios
- **IA integrada**: asistente de compras (lectura de facturas/remitos PDF), asistente de precios de proveedor (listas de precios PDF)

---

## Stack tecnológico

### Backend
| Tecnología | Versión | Rol |
|---|---|---|
| PHP | 8.4 | Runtime |
| Laravel | 12 | Framework principal |
| PostgreSQL | 16 | Base de datos (una por deploy) |
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
| Nginx (host) + Certbot | Reverse proxy + SSL (Let's Encrypt) |
| lvh.me | DNS local para desarrollo (`*.lvh.me → 127.0.0.1`) |

---

## Arquitectura

- **Single-tenant**: no hay multi-tenancy (se quitó stancl/tenancy). Cada empresa es un deploy separado con su propia BD.
- Para una empresa nueva se levanta otro stack (compose + BD + dominio).

### Roles del sistema
| Rol | Acceso |
|---|---|
| `superadmin` | Todo, incluida la configuración de usuarios |
| `admin` | Todos los módulos de la empresa (excepto Configuración de usuarios) |
| `vendedor` | Solo módulo de Ventas |
| `cliente` | Portal de cliente: estado de cuenta, perfil |

---

## Estructura de directorios clave

```
app/
  Http/Controllers/       # Controladores
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
  web.php                 # Rutas (con middleware de rol)
database/
  migrations/             # Migraciones
  seeders/                # Seeders de datos iniciales
docker/
  nginx.conf, php.ini, supervisord.conf, entrypoint.dev.sh, entrypoint.prod.sh
deploy/
  dev-qa/, prod/               # Runbooks por ambiente en el VPS
```

---

## Comandos de desarrollo local

```bash
# Primer setup (clonar + levantar)
make up

# Día a día
make up              # Levantar servicios Docker
make down            # Bajar servicios
make logs            # Ver logs en tiempo real
make shell           # Shell en el contenedor
make migrate         # php artisan migrate
make demo-seed       # Datos demo (marcas, productos, stock, clientes)
make fresh           # Reset total + seeders
make tinker          # Laravel Tinker
make rebuild         # Reconstruir imagen desde cero
```

**URLs locales:**
- App: `http://epos.lvh.me:8080` (puerto definido por `APP_PORT` en `.env`)

**Credenciales por defecto (seeder):**
- Superadmin: `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` (default dev: `principal@mail.com` / `superadmin123`)
- Demo (no prod): `superadmin@mail.com`, `admin@mail.com`, `vendedor@mail.com` / `asdf1234`

---

## Variables de entorno importantes

```env
SUPERADMIN_EMAIL=                   # Superadmin inicial (requerido en prod)
SUPERADMIN_PASSWORD=
GROQ_API_KEY=                       # API key de Groq (IA)
AFIP_ENVIRONMENT=homologacion       # homologacion | produccion
MERCADOPAGO_ACCESS_TOKEN=           # Token de MercadoPago
TELEGRAM_BOT_ADMIN_TOKEN=           # Bot de Telegram para alertas
AI_PROVIDER=groq                    # groq | ollama
```

---

## Módulos y funcionalidades

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
- Tienda online en el mismo dominio del deploy
- Carrito de compras (sesión + usuario)
- Checkout con MercadoPago
- Webhook de MercadoPago para actualización asíncrona de pagos
- Precios desde lista de precios configurada como `default_ecommerce`
- Personalización: logo y colores de marca

### Módulo de IA
- **Asistente de Compras** (`/asistente-compras`): sube PDF de factura/remito → IA extrae ítems → crea movimiento de inventario
- **Asistente de Precios** (`/asistente-precios`): sube PDF de lista de precios de proveedor → IA extrae precios → actualiza precio en lista de precios default POS (match por EAN o SKU)

### Integraciones externas
- **ARCA (ex-AFIP)**: autorización de comprobantes electrónicos, certificados en `storage/app/private/afip/`, tokens con renovación automática (pendiente)
- **MercadoPago**: pagos en checkout, webhook de notificaciones
- **Telegram**: alertas de administración

---

## Convenciones de código

### PHP / Laravel
- Controladores delgados: lógica en Services
- Transacciones DB explícitas para operaciones críticas (`DB::transaction`)
- `lockForUpdate()` en operaciones concurrentes (ej: numeración de facturas)
- Migraciones en `database/migrations/`

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
- **Migración a inglés por módulo**: se va anglicando módulo por módulo, no de golpe. En los módulos ya migrados el inglés llega hasta la URL; en los que faltan siguen valiendo los nombres en español de URLs y archivos (`/articulos`, `ArticuloController`, `Articulos/Create.tsx`) hasta que les toque el turno.
  - **Ventas: migrado** (agosto 2026). URLs (`/sales`, `/quotes`, `/deliveries`, `/sales/{sale}/payments`), nombres de ruta (`sales.*`, `quotes.*`, `deliveries.*`, `payments.*`), parámetros (`{sale}`, `{quote}`, `{delivery}`, `{payment}`), controllers (`SaleController`, `QuoteController`, `DeliveryController`, `PaymentController`, `SalePdfController`), métodos y carpetas de páginas (`Sales/`, `Quotes/`, `Deliveries/`, `Payments/`).
  - **Pendiente en ventas**: los campos del payload de entregas (`entregas`, `articulo_id`, `cantidad`, `fecha_entrega`, `observaciones`), que obligan a tocar también los formularios del front.
- **Permisos: se quedan en español, a propósito** (`can:ventas.index`, `can:pagos.create`, `can:entregas.marcar-entregada`). Están desplegados en producción y renombrarlos exige coordinar una migración por tenant con el deploy; en la ventana entre ambos los usuarios reciben 403 sin registro de error, a cambio de un beneficio sólo estético. **Un permiso nuevo se nombra en español aunque su ruta esté en inglés**: mezclar los dos idiomas es peor que cualquiera de los dos, porque deja de haber regla. El nombre del permiso coincide con el string de `can:`, no con el `->name()` de la ruta.
- **Variables locales en español**: aceptable cuando aporta claridad de dominio (`$factura`, `$articulo`) pero los **atributos** que se acceden son siempre en inglés (`$factura->invoice_number`, `$articulo->name`). En los módulos ya migrados las variables acompañan al modelo (`$sale`, `$delivery`).
- **Si encontrás código viejo con nombres en español como `razonsocial`, `articulo.articulo`, `numfactura`**, etc.: arreglalo a la convención inglés. Es deuda técnica heredada del sistema original.

### Rutas
- Rutas en `routes/web.php` agrupadas por rol (`role:admin,superadmin`)
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
| `db` | Query directo a PostgreSQL local (Docker, puerto 5432) |
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
- **Lista de precios default**: `listas_precios.default_pos = true` es la lista que usa el POS. `default_ecommerce = true` es la que usa el ecommerce.
- **Facturación ARCA**: certificados almacenados en `storage/app/private/afip/`. En homologación no se requiere certificado real.

===

<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to enhance the user's satisfaction building Laravel applications.

## Foundational Context
This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.4.27
- inertiajs/inertia-laravel (INERTIA) - v2
- laravel/framework (LARAVEL) - v12
- laravel/prompts (PROMPTS) - v0
- tightenco/ziggy (ZIGGY) - v2
- laravel/mcp (MCP) - v0
- laravel/pint (PINT) - v1
- laravel/sail (SAIL) - v1
- pestphp/pest (PEST) - v4
- phpunit/phpunit (PHPUNIT) - v12
- @inertiajs/react (INERTIA) - v2
- react (REACT) - v19
- tailwindcss (TAILWINDCSS) - v4
- eslint (ESLINT) - v9
- prettier (PRETTIER) - v3


## Conventions
- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts
- Do not create verification scripts or tinker when tests cover that functionality and prove it works. Unit and feature tests are more important.

## Application Structure & Architecture
- Stick to existing directory structure - don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling
- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.

## Replies
- Be concise in your explanations - focus on what's important rather than explaining obvious details.

## Documentation Files
- You must only create documentation files if explicitly requested by the user.


=== boost rules ===

## Laravel Boost
- Laravel Boost is an MCP server that comes with powerful tools designed specifically for this application. Use them.

## Artisan
- Use the `list-artisan-commands` tool when you need to call an Artisan command to double check the available parameters.

## URLs
- Whenever you share a project URL with the user you should use the `get-absolute-url` tool to ensure you're using the correct scheme, domain / IP, and port.

## Tinker / Debugging
- You should use the `tinker` tool when you need to execute PHP to debug code or query Eloquent models directly.
- Use the `database-query` tool when you only need to read from the database.

## Reading Browser Logs With the `browser-logs` Tool
- You can read browser logs, errors, and exceptions using the `browser-logs` tool from Boost.
- Only recent browser logs will be useful - ignore old logs.

## Searching Documentation (Critically Important)
- Boost comes with a powerful `search-docs` tool you should use before any other approaches. This tool automatically passes a list of installed packages and their versions to the remote Boost API, so it returns only version-specific documentation specific for the user's circumstance. You should pass an array of packages to filter on if you know you need docs for particular packages.
- The 'search-docs' tool is perfect for all Laravel related packages, including Laravel, Inertia, Livewire, Filament, Tailwind, Pest, Nova, Nightwatch, etc.
- You must use this tool to search for Laravel-ecosystem documentation before falling back to other approaches.
- Search the documentation before making code changes to ensure we are taking the correct approach.
- Use multiple, broad, simple, topic based queries to start. For example: `['rate limiting', 'routing rate limiting', 'routing']`.
- Do not add package names to queries - package information is already shared. For example, use `test resource table`, not `filament 4 test resource table`.

### Available Search Syntax
- You can and should pass multiple queries at once. The most relevant results will be returned first.

1. Simple Word Searches with auto-stemming - query=authentication - finds 'authenticate' and 'auth'
2. Multiple Words (AND Logic) - query=rate limit - finds knowledge containing both "rate" AND "limit"
3. Quoted Phrases (Exact Position) - query="infinite scroll" - Words must be adjacent and in that order
4. Mixed Queries - query=middleware "rate limit" - "middleware" AND exact phrase "rate limit"
5. Multiple Queries - queries=["authentication", "middleware"] - ANY of these terms


=== php rules ===

## PHP

- Always use curly braces for control structures, even if it has one line.

### Constructors
- Use PHP 8 constructor property promotion in `__construct()`.
    - <code-snippet>public function __construct(public GitHub $github) { }</code-snippet>
- Do not allow empty `__construct()` methods with zero parameters.

### Type Declarations
- Always use explicit return type declarations for methods and functions.
- Use appropriate PHP type hints for method parameters.

<code-snippet name="Explicit Return Types and Method Params" lang="php">
protected function isAccessible(User $user, ?string $path = null): bool
{
    ...
}
</code-snippet>

## Comments
- Prefer PHPDoc blocks over comments. Never use comments within the code itself unless there is something _very_ complex going on.

## PHPDoc Blocks
- Add useful array shape type definitions for arrays when appropriate.

## Enums
- Typically, keys in an Enum should be TitleCase. For example: `FavoritePerson`, `BestLake`, `Monthly`.


=== inertia-laravel/core rules ===

## Inertia Core

- Inertia.js components should be placed in the `resources/js/Pages` directory unless specified differently in the JS bundler (vite.config.js).
- Use `Inertia::render()` for server-side routing instead of traditional Blade views.
- Use `search-docs` for accurate guidance on all things Inertia.

<code-snippet lang="php" name="Inertia::render Example">
// routes/web.php example
Route::get('/users', function () {
    return Inertia::render('Users/Index', [
        'users' => User::all()
    ]);
});
</code-snippet>


=== inertia-laravel/v2 rules ===

## Inertia v2

- Make use of all Inertia features from v1 & v2. Check the documentation before making any changes to ensure we are taking the correct approach.

### Inertia v2 New Features
- Polling
- Prefetching
- Deferred props
- Infinite scrolling using merging props and `WhenVisible`
- Lazy loading data on scroll

### Deferred Props & Empty States
- When using deferred props on the frontend, you should add a nice empty state with pulsing / animated skeleton.

### Inertia Form General Guidance
- The recommended way to build forms when using Inertia is with the `<Form>` component - a useful example is below. Use `search-docs` with a query of `form component` for guidance.
- Forms can also be built using the `useForm` helper for more programmatic control, or to follow existing conventions. Use `search-docs` with a query of `useForm helper` for guidance.
- `resetOnError`, `resetOnSuccess`, and `setDefaultsOnSuccess` are available on the `<Form>` component. Use `search-docs` with a query of 'form component resetting' for guidance.


=== laravel/core rules ===

## Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using the `list-artisan-commands` tool.
- If you're creating a generic PHP class, use `artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Database
- Always use proper Eloquent relationship methods with return type hints. Prefer relationship methods over raw queries or manual joins.
- Use Eloquent models and relationships before suggesting raw database queries
- Avoid `DB::`; prefer `Model::query()`. Generate code that leverages Laravel's ORM capabilities rather than bypassing them.
- Generate code that prevents N+1 query problems by using eager loading.
- Use Laravel's query builder for very complex database operations.

### Model Creation
- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `list-artisan-commands` to check the available options to `php artisan make:model`.

### APIs & Eloquent Resources
- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

### Controllers & Validation
- Always create Form Request classes for validation rather than inline validation in controllers. Include both validation rules and custom error messages.
- Check sibling Form Requests to see if the application uses array or string based validation rules.

### Queues
- Use queued jobs for time-consuming operations with the `ShouldQueue` interface.

### Authentication & Authorization
- Use Laravel's built-in authentication and authorization features (gates, policies, Sanctum, etc.).

### URL Generation
- When generating links to other pages, prefer named routes and the `route()` function.

### Configuration
- Use environment variables only in configuration files - never use the `env()` function directly outside of config files. Always use `config('app.name')`, not `env('APP_NAME')`.

### Testing
- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] <name>` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

### Vite Error
- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.


=== laravel/v12 rules ===

## Laravel 12

- Use the `search-docs` tool to get version specific documentation.
- Since Laravel 11, Laravel has a new streamlined file structure which this project uses.

### Laravel 12 Structure
- No middleware files in `app/Http/Middleware/`.
- `bootstrap/app.php` is the file to register middleware, exceptions, and routing files.
- `bootstrap/providers.php` contains application specific service providers.
- **No app\Console\Kernel.php** - use `bootstrap/app.php` or `routes/console.php` for console configuration.
- **Commands auto-register** - files in `app/Console/Commands/` are automatically available and do not require manual registration.

### Database
- When modifying a column, the migration must include all of the attributes that were previously defined on the column. Otherwise, they will be dropped and lost.
- Laravel 11 allows limiting eagerly loaded records natively, without external packages: `$query->latest()->limit(10);`.

### Models
- Casts can and likely should be set in a `casts()` method on a model rather than the `$casts` property. Follow existing conventions from other models.


=== pint/core rules ===

## Laravel Pint Code Formatter

- You must run `vendor/bin/pint --dirty` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test`, simply run `vendor/bin/pint` to fix any formatting issues.


=== pest/core rules ===

## Pest

### Testing
- If you need to verify a feature is working, write or update a Unit / Feature test.

### Pest Tests
- All tests must be written using Pest. Use `php artisan make:test --pest <name>`.
- You must not remove any tests or test files from the tests directory without approval. These are not temporary or helper files - these are core to the application.
- Tests should test all of the happy paths, failure paths, and weird paths.
- Tests live in the `tests/Feature` and `tests/Unit` directories.
- Pest tests look and behave like this:
<code-snippet name="Basic Pest Test Example" lang="php">
it('is true', function () {
    expect(true)->toBeTrue();
});
</code-snippet>

### Running Tests
- Run the minimal number of tests using an appropriate filter before finalizing code edits.
- To run all tests: `php artisan test`.
- To run all tests in a file: `php artisan test tests/Feature/ExampleTest.php`.
- To filter on a particular test name: `php artisan test --filter=testName` (recommended after making a change to a related file).
- When the tests relating to your changes are passing, ask the user if they would like to run the entire test suite to ensure everything is still passing.

### Pest Assertions
- When asserting status codes on a response, use the specific method like `assertForbidden` and `assertNotFound` instead of using `assertStatus(403)` or similar, e.g.:
<code-snippet name="Pest Example Asserting postJson Response" lang="php">
it('returns all', function () {
    $response = $this->postJson('/api/docs', []);

    $response->assertSuccessful();
});
</code-snippet>

### Mocking
- Mocking can be very helpful when appropriate.
- When mocking, you can use the `Pest\Laravel\mock` Pest function, but always import it via `use function Pest\Laravel\mock;` before using it. Alternatively, you can use `$this->mock()` if existing tests do.
- You can also create partial mocks using the same import or self method.

### Datasets
- Use datasets in Pest to simplify tests which have a lot of duplicated data. This is often the case when testing validation rules, so consider going with this solution when writing tests for validation rules.

<code-snippet name="Pest Dataset Example" lang="php">
it('has emails', function (string $email) {
    expect($email)->not->toBeEmpty();
})->with([
    'james' => 'james@laravel.com',
    'taylor' => 'taylor@laravel.com',
]);
</code-snippet>


=== pest/v4 rules ===

## Pest 4

- Pest v4 is a huge upgrade to Pest and offers: browser testing, smoke testing, visual regression testing, test sharding, and faster type coverage.
- Browser testing is incredibly powerful and useful for this project.
- Browser tests should live in `tests/Browser/`.
- Use the `search-docs` tool for detailed guidance on utilizing these features.

### Browser Testing
- You can use Laravel features like `Event::fake()`, `assertAuthenticated()`, and model factories within Pest v4 browser tests, as well as `RefreshDatabase` (when needed) to ensure a clean state for each test.
- Interact with the page (click, type, scroll, select, submit, drag-and-drop, touch gestures, etc.) when appropriate to complete the test.
- If requested, test on multiple browsers (Chrome, Firefox, Safari).
- If requested, test on different devices and viewports (like iPhone 14 Pro, tablets, or custom breakpoints).
- Switch color schemes (light/dark mode) when appropriate.
- Take screenshots or pause tests for debugging when appropriate.

### Example Tests

<code-snippet name="Pest Browser Test Example" lang="php">
it('may reset the password', function () {
    Notification::fake();

    $this->actingAs(User::factory()->create());

    $page = visit('/sign-in'); // Visit on a real browser...

    $page->assertSee('Sign In')
        ->assertNoJavascriptErrors() // or ->assertNoConsoleLogs()
        ->click('Forgot Password?')
        ->fill('email', 'nuno@laravel.com')
        ->click('Send Reset Link')
        ->assertSee('We have emailed your password reset link!')

    Notification::assertSent(ResetPassword::class);
});
</code-snippet>

<code-snippet name="Pest Smoke Testing Example" lang="php">
$pages = visit(['/', '/about', '/contact']);

$pages->assertNoJavascriptErrors()->assertNoConsoleLogs();
</code-snippet>


=== inertia-react/core rules ===

## Inertia + React

- Use `router.visit()` or `<Link>` for navigation instead of traditional links.

<code-snippet name="Inertia Client Navigation" lang="react">

import { Link } from '@inertiajs/react'
<Link href="/">Home</Link>

</code-snippet>


=== inertia-react/v2/forms rules ===

## Inertia + React Forms

<code-snippet name="`<Form>` Component Example" lang="react">

import { Form } from '@inertiajs/react'

export default () => (
    <Form action="/users" method="post">
        {({
            errors,
            hasErrors,
            processing,
            wasSuccessful,
            recentlySuccessful,
            clearErrors,
            resetAndClearErrors,
            defaults
        }) => (
        <>
        <input type="text" name="name" />

        {errors.name && <div>{errors.name}</div>}

        <button type="submit" disabled={processing}>
            {processing ? 'Creating...' : 'Create User'}
        </button>

        {wasSuccessful && <div>User created successfully!</div>}
        </>
    )}
    </Form>
)

</code-snippet>


=== tailwindcss/core rules ===

## Tailwind Core

- Use Tailwind CSS classes to style HTML, check and use existing tailwind conventions within the project before writing your own.
- Offer to extract repeated patterns into components that match the project's conventions (i.e. Blade, JSX, Vue, etc..)
- Think through class placement, order, priority, and defaults - remove redundant classes, add classes to parent or child carefully to limit repetition, group elements logically
- You can use the `search-docs` tool to get exact examples from the official documentation when needed.

### Spacing
- When listing items, use gap utilities for spacing, don't use margins.

    <code-snippet name="Valid Flex Gap Spacing Example" lang="html">
        <div class="flex gap-8">
            <div>Superior</div>
            <div>Michigan</div>
            <div>Erie</div>
        </div>
    </code-snippet>


### Dark Mode
- If existing pages and components support dark mode, new pages and components must support dark mode in a similar way, typically using `dark:`.


=== tailwindcss/v4 rules ===

## Tailwind 4

- Always use Tailwind CSS v4 - do not use the deprecated utilities.
- `corePlugins` is not supported in Tailwind v4.
- In Tailwind v4, you import Tailwind using a regular CSS `@import` statement, not using the `@tailwind` directives used in v3:

<code-snippet name="Tailwind v4 Import Tailwind Diff" lang="diff">
   - @tailwind base;
   - @tailwind components;
   - @tailwind utilities;
   + @import "tailwindcss";
</code-snippet>


### Replaced Utilities
- Tailwind v4 removed deprecated utilities. Do not use the deprecated option - use the replacement.
- Opacity values are still numeric.

| Deprecated |	Replacement |
|------------+--------------|
| bg-opacity-* | bg-black/* |
| text-opacity-* | text-black/* |
| border-opacity-* | border-black/* |
| divide-opacity-* | divide-black/* |
| ring-opacity-* | ring-black/* |
| placeholder-opacity-* | placeholder-black/* |
| flex-shrink-* | shrink-* |
| flex-grow-* | grow-* |
| overflow-ellipsis | text-ellipsis |
| decoration-slice | box-decoration-slice |
| decoration-clone | box-decoration-clone |


=== tests rules ===

## Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run the minimum number of tests needed to ensure code quality and speed. Use `php artisan test` with a specific filename or filter.
</laravel-boost-guidelines>