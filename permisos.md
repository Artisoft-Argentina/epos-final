# Implementación de Spatie Laravel Permission en EPOS

> Documento generado el 21 de mayo de 2026.
> Objetivo: Migrar el sistema de roles del modelo legacy (tabla `roles` custom con columnas `role`, `permission`, `description`) al paquete oficial `spatie/laravel-permission` v7.4, usando permisos granulares por **nombre de ruta** (`users.index`, `products.store`, etc.).

---

## 1. Estado inicial diagnosticado

El paquete `spatie/laravel-permission` ya estaba instalado (`composer.json`) y el trait `HasRoles` estaba en `User.php`. Sin embargo, el resto del código seguía operando como si existiera un modelo `Role` legacy:

### Problemas encontrados

| Problema | Ubicación | Causa |
|---|---|---|
| Modelo `Role` legacy eliminado pero código aún lo referenciaba | `app/Models/Role.php` (eliminado), controllers, seeders | Se borró `app/Models/Role.php` pero `TenantController`, `RoleController`, frontend esperaban campos `role`, `permission`, `description` |
| Migración legacy `create_roles_table` conflictiva | `database/migrations/tenant/0001_01_01_000004_create_roles_table.php` | Eliminada, pero tablas de Spatie aún no corrían en tenants |
| `role_id` en tabla `users` | `database/migrations/tenant/0001_01_01_000001_create_users_table.php` | Columna obsoleta del sistema anterior. Spatie usa tabla pivote `model_has_roles`. |
| `RoleController` rompe BD | `app/Http/Controllers/RoleController.php` | `Role::create($request->all())` intentaba insertar `role`, `permission`, `description` en el modelo Spatie que solo tiene `id`, `name`, `guard_name`, `timestamps` |
| Middlewares leen `->role?->role` | `RoleMiddleware.php`, `RedirectBasedOnRole.php` | El modelo Spatie tiene `->name`, no `->role` |
| Eager loading inválido | `UserController::index()`, `HandleInertiaRequests` | `with('role')` no es una relación Eloquent; Spatie define `roles()` (colección) |
| Seeder sin roles creados | `UserSeeder.php` | Llamaba `assignRole('superadmin')` sin asegurar que el rol existiera en la BD |
| `config/permissions.php` del paquete no tocable | `config/permissions.php` | Archivo pertenece a Spatie. Se creó `config/custom/permissions.php` para el mapa de permisos del negocio |

---

## 2. Arquitectura de permisos decidida

### Principios

1. **Cada ruta protegida tiene un permiso cuyo nombre es exactamente su `->name()`**.
2. **Rutas abiertas** (`ventas.*`, `customers.*`, `transferencias.*`, etc.) **no llevan `can:`**.
3. **Grupos `role:superadmin` y `role:admin,superadmin` comentados** en `routes/web.php` pero preservados como fallback.
4. **`superadmin` tiene acceso total** vía `Gate::before`.
5. **Guard explícito `web`** en todos los roles/permisos creados dentro del tenant para evitar mismatch con el guard `central` del panel superadmin.

### Roles del sistema

| Rol | Guard | Descripción |
|---|---|---|
| `superadmin` | `web` | Acceso total. Bypass de todos los permisos vía `Gate::before` |
| `admin` | `web` | Todas las rutas protegidas del panel de gestión |
| `vendedor` | `web` | Rutas abiertas (ventas, presupuestos, clientes, scanner) |
| `cliente` | `web` | Checkout, tienda, perfil cliente |

---

## 3. Cambios implementados

### 3.1 Configuración de permisos

**Archivo:** `config/custom/permissions.php`

Reemplazó los permisos descriptivos (`"manage users"`) por nombres de ruta reales:

```php
return [
    'superadmin' => [], // Acceso total vía Gate::before

    'admin' => [
        // Dashboard
        'dashboard', 'admin.dashboard', 'dashboard.export',

        // Usuarios y roles
        'users.index', 'users.create', 'users.store', ...,
        'roles.index', 'roles.create', 'roles.store', ...,

        // Catálogo
        'categories.*', 'brands.*', 'products.*', 'suppliers.*',

        // Inventario & órdenes
        'orders.*', 'inventarios.*', 'almacenes.*',

        // Puntos de venta, transferencias admin, listas de precios
        'puntos-venta.*', 'transferencias.dispatch', ...,
        'listas-precios.*',
    ],
    'vendedor' => [], // Rutas abiertas, referencia documental
    'cliente' => [],  // Rutas abiertas, referencia documental
];
```

> Nota: `config/permissions.php` (del paquete Spatie) **no se modificó**.

---

### 3.2 Gate wildcard para superadmin

**Archivo:** `app/Providers/AppServiceProvider.php`

```php
public function boot(): void
{
    if (config('app.env') !== 'local') {
        URL::forceScheme('https');
    }

    \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
        if ($user->hasRole('superadmin')) {
            return true;
        }
    });
}
```

Esto permite que cualquier usuario con rol `superadmin` pase **todos** los checks `can:` sin necesidad de tener los permisos explícitos en la BD.

---

### 3.3 Rutas — desarmar `Route::resource()`

**Archivo:** `routes/web.php`

Se eliminaron **15 `Route::resource()`** y se reemplazaron por **~93 rutas individuales**.

#### Patrón aplicado

**Antes:**
```php
Route::middleware(['role:superadmin'])->group(function () {
    Route::resource('users', UserController::class);
});
```

**Después:**
```php
// Route::middleware(['role:superadmin'])->group(function () {
    Route::get('users', [UserController::class, 'index'])
        ->name('users.index')
        ->middleware('can:users.index');
    Route::get('users/create', [UserController::class, 'create'])
        ->name('users.create')
        ->middleware('can:users.create');
    // ... store, show, edit, update, destroy idem
// });
```

#### Recuento de resources desarmados

| Resource | `can:` aplicado | Grupo origen |
|---|---|---|
| `users` | ✅ 7 rutas | superadmin |
| `roles` | ✅ 7 rutas | superadmin |
| `categories` | ✅ 5 rutas (+ toggle) | admin/superadmin |
| `brands` | ✅ 5 rutas (+ toggle) | admin/superadmin |
| `products` | ✅ 7 rutas (+ images/barcode/qr/codes/print/movements/toggle) | admin/superadmin |
| `suppliers` | ✅ 7 rutas | admin/superadmin |
| `orders` | ✅ 7 rutas (+ products/convert) | admin/superadmin |
| `inventarios` | ✅ 5 rutas (+ reconcile/adjust) | admin/superadmin |
| `almacenes` | ✅ 7 rutas | admin/superadmin |
| `puntos-venta` | ✅ 7 rutas (+ set-active) | admin/superadmin |
| `listas-precios` | ✅ 7 rutas (+ regenerar) | admin/superadmin |
| `transferencias` | ❌ 5 rutas abiertas + 3 admin (dispatch/receive/cancel) con `can:` | mixto |
| `customers` | ❌ 6 rutas abiertas + exports/toggle | abierto |
| `ventas` | ❌ 7 rutas abiertas | abierto |
| `presupuestos` | ❌ 7 rutas abiertas | abierto |

#### Dashboard closure actualizada

```php
Route::get('dashboard', function () {
    $user = auth()->user();

    if ($user->hasRole('cliente')) {
        return redirect()->route('client.dashboard');
    }

    if ($user->hasAnyRole(['admin', 'superadmin'])) {
        return redirect()->route('admin.dashboard');
    }

    return redirect()->route('user.dashboard');
})->name('dashboard');
```

---

### 3.4 Backend — adaptaciones a Spatie

#### `app/Http/Controllers/RoleController.php`

```php
public function store(Request $request)
{
    $request->validate([
        'name' => 'required|string|max:255|unique:roles',
    ]);

    Role::create(['name' => $request->name]);

    return redirect()->route('roles.index');
}
```

- Quitados campos `role`, `permission`, `description` (no existen en Spatie).
- Validación `unique:roles` sobre `name`.

#### `app/Http/Controllers/UserController.php`

```php
public function index()
{
    return Inertia::render('Users/Index', [
        'users' => User::with(['roles', 'pointOfSale'])->paginate(10),
    ]);
}

public function store(Request $request)
{
    $request->validate([
        'role_id' => 'required|exists:roles,id',
        // ...
    ]);

    $role = Role::find($request->role_id);

    $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'password' => bcrypt($request->password),
        'point_of_sale_id' => $this->resolvePosId($request, $role),
    ]);

    $user->assignRole($role->name);
    // ...
}

public function update(Request $request, User $user)
{
    $role = $request->role_id ? Role::find($request->role_id) : null;
    // ...
    if ($role) {
        $user->syncRoles($role->name);
    }
}
```

- `with('roles')` en vez de `with('role')`.
- `role_id` reintroducido en formulario para poder hacer `assignRole()` / `syncRoles()`.
- `resolvePosId()` recibe el objeto `Role` para validar si es `vendedor`.

#### `app/Http/Controllers/Central/TenantController.php`

```php
$superadminRole = Role::firstOrCreate([
    'name' => 'superadmin',
    'guard_name' => 'web',
]);
Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
// ...

$user = \App\Models\User::create([...]);
$user->assignRole($superadminRole);
```

**Crítico:** `guard_name => 'web'` explícito para evitar mismatch con el guard `central` del superadmin logueado en el panel central.

#### `app/Models/User.php`

```php
class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles;

    protected $appends = ['role_id'];

    public function getRoleIdAttribute(): ?int
    {
        return $this->roles->first()?->id;
    }

    public function primaryRole()
    {
        return $this->roles->first();
    }

    public function isVendedor(): bool
    {
        return $this->primaryRole()?->name === 'vendedor';
    }

    public function isAdmin(): bool
    {
        return in_array($this->primaryRole()?->name, ['admin', 'superadmin'], true);
    }
}
```

- `role()` renombrado a `primaryRole()` para **no colisionar** con el scope Eloquent `role()` que añade automáticamente el trait `HasRoles` de Spatie.
- Accessor `role_id` agregado a `$appends` para que el frontend reciba el ID del primer rol serializado.

#### `app/Http/Middleware/HandleInertiaRequests.php`

```php
'user' => tenancy()->initialized
    ? $request->user()?->load('roles')
    : $request->user('central'),
```

- `load('roles')` en vez de `load('role')`.

#### `app/Http/Middleware/RoleMiddleware.php` y `RedirectBasedOnRole.php`

```php
$userRole = auth()->user()->primaryRole()?->name;
```

- Ambos middlewares siguen funcionando como fallback, leyendo del método `primaryRole()`.

---

### 3.5 Seeders

#### `database/seeders/UserSeeder.php`

```php
Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
Role::firstOrCreate(['name' => 'vendedor', 'guard_name' => 'web']);
Role::firstOrCreate(['name' => 'cliente', 'guard_name' => 'web']);

$user = User::create([...]);
$user->assignRole('superadmin');
```

#### `database/seeders/TenantSeeder.php`

Eliminada referencia a `RoleSeeder::class` (eliminado del proyecto).

---

### 3.6 Comando artisan para permisos

**Archivo:** `app/Console/Commands/CreateRolesAndPermissions.php`

```php
$permissions = config('custom.permissions');

foreach ($permissions as $role_name => $values) {
    $role = Role::findOrCreate($role_name, 'web');

    foreach ($values as $permissionName) {
        Permission::findOrCreate($permissionName, 'web');
    }

    $role->syncPermissions($validPermissions->toArray());
}
```

- Lee de `config/custom/permissions.php`.
- Crea permisos con `guard_name => 'web'`.

---

### 3.7 Frontend adaptado

#### `resources/js/pages/Roles/`

| Archivo | Cambio |
|---|---|
| `Index.tsx` | Interface: `{ id, name, guard_name }` en vez de `{ id, role, permission, description }` |
| `Create.tsx` | Formulario solo con campo `name` |
| `Edit.tsx` | Idem |

#### `resources/js/pages/Users/`

| Archivo | Cambio |
|---|---|
| `Index.tsx` | `row.roles?.[0]?.name` en vez de `row.role?.role` |
| `Create.tsx` | `r.name` en vez de `r.role`; `isVendedor` detecta por `name` |
| `Edit.tsx` | Idem; `role_id` sigue funcionando porque el backend lo provee vía accessor |

---

### 3.8 Fix de migración bloqueante en tenants

**Archivo:** `database/migrations/tenant/2026_05_08_120100_add_point_of_sale_id_to_users.php`

**Problema:** Contenía un backfill usando `User::role('vendedor')->...`.

- `HasRoles` de Spatie registra un **scope Eloquent** `role($roleName)`.
- Nosotros teníamos un método de instancia `role()` que devolvía `$this->roles->first()`.
- Esto causaba: `Non-static method App\Models\User::role() cannot be called statically`.
- La migración fallaba, bloqueando que se ejecutara la migración de Spatie (`2026_05_14_182855_create_permission_tables.php`).

**Fix:**
- Renombrado `role()` → `primaryRole()` en `User.php`.
- Eliminado el backfill de la migración (era para datos existentes, no para `migrate:fresh`).

---

## 4. Verificación de rutas

Desde el contenedor Docker:

```bash
php artisan route:list -v
```

**Rutas protegidas con `can:`:**
```
GET|HEAD  users ........................ users.index
              ⇂ Illuminate\Auth\Middleware\Authorize:users.index

GET|HEAD  categories .................. categories.index
              ⇂ Illuminate\Auth\Middleware\Authorize:categories.index
```

**Rutas abiertas (sin `can:`):**
```
GET|HEAD  ventas ..................... ventas.index
              ⇂ web
              ⇂ Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains
```

---

## 5. Comandos para regenerar desde cero

```bash
# Entrar al contenedor
make shell

# Crear/migrar tenant existente
php artisan tenants:migrate --tenants=principal --force

# Generar permisos en BD
php artisan app:create-roles-and-permissions

# Reset completo (destruye todo)
make fresh
```

---

## 6. Referencia de archivos modificados

### Backend

- `config/custom/permissions.php`
- `app/Providers/AppServiceProvider.php`
- `app/Http/Controllers/RoleController.php`
- `app/Http/Controllers/UserController.php`
- `app/Http/Controllers/Central/TenantController.php`
- `app/Models/User.php`
- `app/Http/Middleware/HandleInertiaRequests.php`
- `app/Http/Middleware/RoleMiddleware.php`
- `app/Http/Middleware/RedirectBasedOnRole.php`
- `app/Console/Commands/CreateRolesAndPermissions.php`
- `database/seeders/UserSeeder.php`
- `database/seeders/TenantSeeder.php`
- `database/migrations/tenant/2026_05_08_120100_add_point_of_sale_id_to_users.php`
- `routes/web.php`

### Frontend

- `resources/js/pages/Roles/Index.tsx`
- `resources/js/pages/Roles/Create.tsx`
- `resources/js/pages/Roles/Edit.tsx`
- `resources/js/pages/Users/Index.tsx`
- `resources/js/pages/Users/Create.tsx`
- `resources/js/pages/Users/Edit.tsx`

### Archivos NO modificados (por instrucción explícita)

- `routes/central.php`
- `routes/settings.php`
- `config/permissions.php` (del paquete Spatie)
- `app/Http/Middleware/RoleMiddleware.php` (código interno intacto, solo se comentó su invocación en rutas)
- `app/Http/Middleware/RedirectBasedOnRole.php` (idem)

---

## 7. Notas para mantenedores

1. **Si agregás una ruta nueva protegida:**
   - Desarmala individualmente (no uses `Route::resource()`).
   - Agregale `->middleware('can:nombre.de.ruta')`.
   - Agregala a `config/custom/permissions.php` bajo el rol correspondiente.
   - Corré `php artisan app:create-roles-and-permissions`.

2. **Si creás un tenant nuevo:**
   - `TenantCreated` dispara `CreateDatabase → MigrateDatabase → SeedDatabase`.
   - Las migraciones de tenant ahora incluyen la tabla de Spatie sin errores.
   - `UserSeeder` crea los 4 roles con `guard_name => 'web'` antes de asignarlos.

3. **Guard `central` vs `web`:**
   - El panel central (`central.php`) usa `auth:central` y no interactúa con Spatie.
   - Todos los roles/permisos dentro del tenant usan `guard_name => 'web'`.
   - Si algún día el panel central necesita roles, crear un set separado con `guard_name => 'central'`.
