# Arquitectura Multi-Tenant — EPOS Final

## Contexto

El sistema actual es single-tenant: una sola empresa, una sola base de datos (`gepetto`). El objetivo es convertirlo en una plataforma SaaS donde múltiples empresas operen de forma completamente aislada, cada una con su propia base de datos.

**Decisiones de diseño:**
- **Aislamiento**: una base de datos por empresa (máximo aislamiento de datos)
- **Identificación**: por subdominio — `empresa1.app.com`, `empresa2.app.com`
- **Alta de empresas**: solo el superadmin central puede crear nuevas empresas
- **Datos actuales**: se migran como Tenant #1

---

## Paquete: stancl/tenancy

```bash
composer require stancl/tenancy
php artisan tenancy:install
```

stancl/tenancy v3.x (Laravel 10/11). Para Laravel 12, usar la rama `main` del repositorio si v3 no es compatible aún. Provee:
- Creación automática de base de datos por tenant al crear el registro
- Switching de conexión transparente (sin cambiar código de negocio)
- Identificación por dominio/subdominio
- Bootstrappers para storage, cache, queue y sesiones por tenant
- Comandos artisan: `tenants:migrate`, `tenants:seed`, `tenants:run`

---

## Arquitectura de dos capas

### Capa Central (Landlord)

**Base de datos**: `gepetto` (la actual, reutilizada como central)

Tablas que permanecen en la BD central:

| Tabla | Descripción |
|-------|-------------|
| `tenants` | Registro de empresas: id, razonsocial, cuit, plan, status, data (JSON) |
| `domains` | Subdominios: tenant_id, domain (ej: `empresa1.app.com`) |
| `central_users` | Únicamente el/los superadmin central — separados de los users de tenant |
| `cache`, `jobs` | Tablas del sistema Laravel |

### Capa Tenant (por empresa)

**Base de datos**: `gepetto_{slug}` — creada automáticamente al registrar el tenant

Todas las tablas de negocio existentes van al tenant:

| Grupo | Tablas |
|-------|--------|
| Acceso | `roles`, `users`, `sessions`, `password_reset_tokens` |
| Configuración | `inicialsettings` |
| Catálogo | `articulos`, `categorias`, `marcas`, `suppliers`, `articulo_imagenes` |
| Ventas | `facturas`, `articulo_factura`, `presupuestos`, `articulo_presupuesto`, `entregas` |
| Compras | `compras`, `compra_detalles`, `remitos`, `articulo_remito` |
| Inventario | `inventarios`, `movimientos` |
| Finanzas | `cuentacorrientes`, `pagos`, `recibos`, `pago_recibo`, `movimientocuentas`, `factura_pagos` |
| Clientes | `clientes`, `carts` |
| Precios | `listas_precios`, `articulo_lista_precio` |
| IA/Bot | `telegram_users`, `telegram_conversations` |
| Auditoría | `activity_log` |
| Referencia | `provincias`, `localidades` |

---

## Estructura de directorios

```
database/
├── migrations/                  ← SOLO migraciones centrales (landlord)
│   ├── xxxx_create_tenants_table.php
│   ├── xxxx_create_domains_table.php
│   ├── xxxx_create_central_users_table.php
│   ├── 0001_01_01_000001_create_cache_table.php
│   └── 0001_01_01_000002_create_jobs_table.php
└── migrations/tenant/           ← migraciones de negocio (corren en cada tenant DB)
    └── (las 60 migraciones actuales se mueven aquí)

app/
├── Models/
│   ├── Tenant.php               ← nuevo: modelo central
│   ├── Central/
│   │   └── CentralUser.php      ← nuevo: superadmin central
│   └── (todos los modelos actuales sin cambios)
├── Http/
│   ├── Controllers/
│   │   ├── Central/             ← nuevo namespace
│   │   │   ├── TenantController.php
│   │   │   ├── CentralDashboardController.php
│   │   │   └── CentralAuthController.php
│   │   └── (controllers actuales sin cambios)
│   └── Middleware/
│       └── (middleware de tenancy — instalado por el paquete)
└── Console/Commands/
    └── MigrateExistingTenant.php  ← nuevo: migrar datos actuales

routes/
├── web.php                      ← rutas tenant (sin cambios estructurales)
├── central.php                  ← nuevo: panel superadmin central
└── (settings.php, auth.php, api.php sin cambios)

resources/js/
├── layouts/
│   └── central-layout.tsx       ← nuevo: layout del panel central
└── pages/
    ├── Central/                 ← nuevo: panel superadmin
    │   ├── Dashboard.tsx
    │   └── Tenants/
    │       ├── Index.tsx
    │       ├── Create.tsx
    │       └── Show.tsx
    └── central/
        └── login.tsx            ← nuevo: login del superadmin central
```

---

## Modelo Tenant

```php
// app/Models/Tenant.php
namespace App\Models;

use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    public static function getCustomColumns(): array
    {
        return ['id', 'razonsocial', 'cuit', 'plan', 'status'];
    }
}
```

El campo `data` (JSON) almacena propiedades adicionales del tenant.

---

## Identificación por subdominio

**Flujo:**
1. Request llega a `empresa1.app.com`
2. Middleware `InitializeTenancyBySubdomain` extrae `empresa1`
3. Busca en tabla `domains` → encuentra el tenant
4. Cambia la conexión DB al schema del tenant (`gepetto_empresa1`)
5. El resto del código funciona sin modificaciones

**Dominio central** (`app.com` sin subdominio) → panel del superadmin central

**Configurar en `config/tenancy.php`:**
```php
'central_domains' => [
    'app.com',         // producción
    'localhost',       // desarrollo
],

'bootstrappers' => [
    Stancl\Tenancy\Bootstrappers\DatabaseTenancyBootstrapper::class,
    Stancl\Tenancy\Bootstrappers\FilesystemTenancyBootstrapper::class,
    Stancl\Tenancy\Bootstrappers\CacheTenancyBootstrapper::class,
    Stancl\Tenancy\Bootstrappers\QueueTenancyBootstrapper::class,
],
```

---

## Rutas

### `routes/central.php` — panel del superadmin

```php
<?php

use App\Http\Controllers\Central\CentralAuthController;
use App\Http\Controllers\Central\CentralDashboardController;
use App\Http\Controllers\Central\TenantController;
use Illuminate\Support\Facades\Route;

// Login central
Route::get('/login', [CentralAuthController::class, 'create'])->name('central.login');
Route::post('/login', [CentralAuthController::class, 'store'])->name('central.login.store');
Route::post('/logout', [CentralAuthController::class, 'destroy'])->name('central.logout');

// Panel protegido
Route::middleware(['auth:central'])->group(function () {
    Route::get('/dashboard', [CentralDashboardController::class, 'index'])->name('central.dashboard');
    Route::resource('/tenants', TenantController::class)->names('central.tenants');
    Route::post('/tenants/{tenant}/activate', [TenantController::class, 'activate'])->name('central.tenants.activate');
    Route::post('/tenants/{tenant}/deactivate', [TenantController::class, 'deactivate'])->name('central.tenants.deactivate');
});
```

### `routes/web.php` — sin cambios estructurales

Las rutas actuales funcionan igual. stancl agrega el middleware de tenancy en `bootstrap/app.php`:

```php
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [
        \Stancl\Tenancy\Middleware\InitializeTenancyBySubdomain::class,
        // ... otros middleware actuales
    ]);
})
```

### Registro de rutas centrales en `bootstrap/app.php`

```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    then: function () {
        Route::middleware('web')
            ->domain(config('app.central_domain'))
            ->group(base_path('routes/central.php'));
    },
)
```

---

## Guards de autenticación

En `config/auth.php`:

```php
'guards' => [
    'web' => [                         // guard actual → usuarios del tenant
        'driver'   => 'session',
        'provider' => 'users',
    ],
    'central' => [                     // nuevo → superadmin central
        'driver'   => 'session',
        'provider' => 'central_users',
    ],
],

'providers' => [
    'users' => [
        'driver' => 'eloquent',
        'model'  => App\Models\User::class,
    ],
    'central_users' => [               // nuevo
        'driver' => 'eloquent',
        'model'  => App\Models\Central\CentralUser::class,
    ],
],
```

---

## Creación de un nuevo tenant

`TenantController::store()` ejecuta los siguientes pasos:

```php
public function store(Request $request): RedirectResponse
{
    // 1. Crear el registro del tenant
    $tenant = Tenant::create([
        'razonsocial' => $request->razonsocial,
        'cuit'        => $request->cuit,
        'plan'        => $request->plan ?? 'basic',
        'status'      => 'active',
    ]);

    // 2. Asignar el subdominio
    $tenant->domains()->create([
        'domain' => $request->slug . '.' . config('app.central_domain'),
    ]);

    // 3. stancl crea la BD y corre database/migrations/tenant/ automáticamente
    //    vía TenantCreated → CreateDatabase → MigrateDatabase

    // 4. Crear el primer usuario admin dentro del tenant
    tenancy()->initialize($tenant);

    \App\Models\Role::create(['role' => 'superadmin', 'permission' => '*']);
    \App\Models\Role::create(['role' => 'admin', 'permission' => '*']);
    \App\Models\Role::create(['role' => 'vendedor', 'permission' => '']);
    \App\Models\Role::create(['role' => 'cliente', 'permission' => '']);

    $adminRole = \App\Models\Role::where('role', 'admin')->first();
    \App\Models\User::create([
        'name'     => $request->admin_name,
        'email'    => $request->admin_email,
        'password' => Hash::make($request->admin_password),
        'role_id'  => $adminRole->id,
    ]);

    tenancy()->end();

    return redirect()->route('central.tenants.index')
        ->with('success', "Empresa '{$tenant->razonsocial}' creada correctamente.");
}
```

---

## Panel central del Superadmin (Frontend)

### `Central/Tenants/Index.tsx`
Lista de empresas con tabla:
- Razón social, CUIT, subdominio, plan, estado (badge activo/inactivo)
- Acciones: Ver detalle | Activar/Desactivar | Eliminar
- Botón "Nueva empresa"

### `Central/Tenants/Create.tsx`
Formulario:
- Razón social *
- CUIT *
- Subdominio (slug) * — preview del URL: `{slug}.app.com`
- Plan: Básico / Pro / Enterprise
- Email del primer admin *
- Nombre del primer admin *
- Contraseña inicial *

### `Central/Tenants/Show.tsx`
Detalle del tenant:
- Datos de la empresa
- URL de acceso (link clickeable al subdominio)
- Lista de usuarios del tenant (consultada via `tenancy()->initialize($tenant)`)
- Estadísticas: total facturas, total clientes, última actividad
- Botones: Activar/Desactivar, Eliminar empresa

### Layout central (`central-layout.tsx`)
Navbar simple: logo de la plataforma + nombre del superadmin + logout. Sin sidebar complejo.

---

## Migración de datos actuales como Tenant #1

Comando artisan: `php artisan tenant:migrate-existing`

```
Pasos:
1. Leer datos de InitialSetting::first() de la BD actual
2. Crear tenant con esos datos (razonsocial, cuit)
3. Asignar subdominio configurado (ej: --slug=principal)
4. stancl crea la BD gepetto_principal y corre las migrations de tenant
5. Exportar tablas de negocio de gepetto → gepetto_principal:
   mysqldump gepetto [tablas_de_negocio] | mysql gepetto_principal
6. Verificar integridad de foreign keys
7. Confirmar migración exitosa
```

El comando acepta parámetros:
```bash
php artisan tenant:migrate-existing --slug=principal --confirm
```

---

## Aislamiento de Storage (Archivos)

Con `FilesystemTenancyBootstrapper`, stancl redirige automáticamente:

| Antes | Después (por tenant) |
|-------|---------------------|
| `storage/app/logos/logo.png` | `storage/app/tenant_abc123/logos/logo.png` |
| `storage/app/private/afip/cert.pem` | `storage/app/tenant_abc123/private/afip/cert.pem` |

**`AfipWebService` no requiere cambios**: el `storage_path()` ya es tenant-aware.

**Para archivos públicos** (logos accesibles via URL), se necesita configurar el disco `public` con prefijo por tenant o usar un symlink tenant-aware.

---

## Variables de entorno nuevas

```env
# Dominio raíz de la plataforma (sin subdominio)
CENTRAL_DOMAIN=app.com

# Prefijo de bases de datos de tenants
TENANCY_DB_PREFIX=gepetto_

# Usuario y contraseña MySQL para crear nuevas BDs
# (debe tener permisos CREATE DATABASE)
TENANCY_DB_USERNAME=gepetto_user
TENANCY_DB_PASSWORD=gepetto_password
```

---

## Consideraciones de infraestructura

### DNS
Se requiere registro wildcard apuntando al servidor:
```
*.app.com  →  A  →  IP_DEL_SERVIDOR
```

### SSL/TLS
Opciones:
1. **Certificado wildcard** `*.app.com` — cubre todos los subdominios con un solo cert
2. **Let's Encrypt + DNS challenge** — genera certificado wildcard automáticamente
3. **Certbot con `--expand`** — agrega cada nuevo subdominio al certificado (no recomendado a escala)

### Nginx
```nginx
server {
    listen 443 ssl;
    server_name *.app.com;
    # ...
}
```

---

## Telegram Bot

**Opción A: Bot compartido** (un bot para toda la plataforma)
- Las credenciales permanecen en `.env` central
- El bot identifica el tenant por contexto de conversación → `telegram_users.tenant_id` en BD central

**Opción B: Bot por empresa** (cada empresa configura el suyo)
- Las credenciales van en `inicialsettings` del tenant
- Más flexible, más complejo de administrar

→ **Recomendado**: Opción A inicialmente, Opción B como feature premium.

---

## MercadoPago

Las credenciales actuales están en `.env`. En el modelo multi-tenant:
- Mover `MP_ACCESS_TOKEN` a la tabla `inicialsettings` del tenant
- Cada empresa configura su propia cuenta de MercadoPago
- El `CheckoutController` lee las credenciales del tenant activo vía `InitialSetting::first()`
- No se requieren cambios en la lógica, solo en el origen de las credenciales

---

## Fases de implementación

### Fase 1 — Setup del paquete (1-2 días)
1. `composer require stancl/tenancy`
2. `php artisan tenancy:install`
3. Configurar `config/tenancy.php`
4. Crear modelo `app/Models/Tenant.php`
5. Crear modelo `app/Models/Central/CentralUser.php`

### Fase 2 — Reorganizar migraciones (1 día)
6. Mover las 60 migraciones de negocio a `database/migrations/tenant/`
7. Crear migraciones centrales (tenants, domains, central_users)
8. `php artisan migrate` (solo corre las migraciones centrales)

### Fase 3 — Rutas y middleware (1 día)
9. Crear `routes/central.php`
10. Actualizar `bootstrap/app.php` (registrar rutas centrales + middleware tenancy)
11. Actualizar `config/auth.php` (guard central)

### Fase 4 — Controllers centrales (1-2 días)
12. `TenantController` (CRUD + activate/deactivate)
13. `CentralAuthController` (login/logout del superadmin)
14. `CentralDashboardController` (stats globales)

### Fase 5 — Frontend del panel central (2-3 días)
15. `central-layout.tsx`
16. `central/login.tsx`
17. `Central/Tenants/Index.tsx`
18. `Central/Tenants/Create.tsx`
19. `Central/Tenants/Show.tsx`

### Fase 6 — Migración de datos existentes (1 día)
20. Crear comando `MigrateExistingTenant`
21. Testear en staging
22. Ejecutar en producción

### Fase 7 — Ajustes y QA (2-3 días)
23. Verificar AFIP por tenant
24. Verificar storage de logos y certificados
25. Ajustar MercadoPago a credenciales por tenant
26. Tests de aislamiento (datos empresa A no visibles en empresa B)
27. Configuración DNS + SSL en producción

---

## Verificación de aislamiento

```bash
# Crear tenant de prueba
php artisan tinker
>>> $t = Tenant::create(['razonsocial' => 'Empresa Test SA', 'cuit' => '20123456789', 'status' => 'active'])
>>> $t->domains()->create(['domain' => 'test.localhost'])

# Correr migrations del tenant
php artisan tenants:migrate --tenants=test

# En /etc/hosts (desarrollo local):
# 127.0.0.1 test.localhost

# Test de aislamiento:
# 1. Crear artículo en empresa1.localhost → verificar que NO aparece en empresa2.localhost
# 2. Crear factura en empresa1 → verificar BD gepetto_empresa1, no en gepetto_empresa2
# 3. Login con usuario de empresa1 en empresa2.localhost → debe rechazar
```

---

## Archivos a crear

### Backend
- `app/Models/Tenant.php`
- `app/Models/Central/CentralUser.php`
- `app/Http/Controllers/Central/TenantController.php`
- `app/Http/Controllers/Central/CentralDashboardController.php`
- `app/Http/Controllers/Central/CentralAuthController.php`
- `app/Console/Commands/MigrateExistingTenant.php`
- `routes/central.php`
- `database/migrations/xxxx_create_tenants_table.php`
- `database/migrations/xxxx_create_domains_table.php`
- `database/migrations/xxxx_create_central_users_table.php`
- `database/migrations/tenant/` ← mover las 60 migraciones actuales

### Frontend
- `resources/js/layouts/central-layout.tsx`
- `resources/js/pages/central/login.tsx`
- `resources/js/pages/Central/Dashboard.tsx`
- `resources/js/pages/Central/Tenants/Index.tsx`
- `resources/js/pages/Central/Tenants/Create.tsx`
- `resources/js/pages/Central/Tenants/Show.tsx`

### Archivos a modificar
- `bootstrap/app.php` — registrar rutas centrales + middleware tenancy
- `config/auth.php` — agregar guard y provider central
- `config/tenancy.php` — configurar bootstrappers, tenant model, dominios centrales
- `app/Providers/AppServiceProvider.php` — configuración adicional si es necesario
- `.env` — agregar `CENTRAL_DOMAIN`, `TENANCY_DB_PREFIX`
