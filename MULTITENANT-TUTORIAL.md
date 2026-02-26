# EPOS — Sistema Multi-Tenant: Tutorial de uso

## Índice
1. [Arquitectura](#arquitectura)
2. [Requisitos de infraestructura](#requisitos-de-infraestructura)
3. [Configuración inicial](#configuración-inicial)
4. [Panel Central](#panel-central)
5. [Crear una nueva empresa](#crear-una-nueva-empresa)
6. [Acceder al sistema de una empresa](#acceder-al-sistema-de-una-empresa)
7. [Gestionar empresas](#gestionar-empresas)
8. [Migrar datos existentes](#migrar-datos-existentes)
9. [Agregar migraciones de negocio](#agregar-migraciones-de-negocio)
10. [Comandos útiles](#comandos-útiles)
11. [Resolución de problemas](#resolución-de-problemas)

---

## Arquitectura

El sistema usa **una base de datos por empresa**, completamente aislada. Hay dos capas:

```
┌─────────────────────────────────────────────────────────┐
│  BD CENTRAL (gepetto)                                   │
│  ├── tenants          (registro de empresas)            │
│  ├── domains          (subdominios)                     │
│  ├── central_users    (superadmins del panel central)   │
│  ├── sessions, cache, jobs                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  BD EMPRESA A (epos_uuid-empresa-a)                     │
│  ├── users, roles                                       │
│  ├── clientes, articulos, facturas                      │
│  ├── inicialsettings (config AFIP, datos empresa)       │
│  └── ... (60+ tablas de negocio)                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  BD EMPRESA B (epos_uuid-empresa-b)                     │
│  └── ... (misma estructura, datos completamente separados)│
└─────────────────────────────────────────────────────────┘
```

**Identificación por subdominio:**
- `tudominio.com/central/` → Panel del superadmin central
- `empresa1.tudominio.com` → Sistema de la Empresa 1
- `empresa2.tudominio.com` → Sistema de la Empresa 2

---

## Requisitos de infraestructura

### Producción
- **DNS wildcard**: registro `*.tudominio.com → IP del servidor`
- **SSL wildcard**: certificado para `*.tudominio.com` (Let's Encrypt con DNS challenge, o Cloudflare)
- **MySQL**: el usuario de BD necesita permiso `CREATE` global (para crear BDs de nuevos tenants)

Dar el permiso en MySQL:
```sql
GRANT CREATE ON *.* TO 'gepetto_user'@'%';
GRANT ALL PRIVILEGES ON `epos_%`.* TO 'gepetto_user'@'%';
FLUSH PRIVILEGES;
```

### Desarrollo local
Agregar en `/etc/hosts` por cada empresa que quieras probar:
```
127.0.0.1  empresa1.localhost
127.0.0.1  empresa2.localhost
```

---

## Configuración inicial

### Variables de entorno (`.env`)
```env
APP_URL=https://tudominio.com

# Dominio central (sin subdominio)
CENTRAL_DOMAIN=tudominio.com

# Prefijo para nombres de BD de tenants
TENANCY_DB_PREFIX=epos_
```

Para desarrollo local:
```env
APP_URL=http://localhost
CENTRAL_DOMAIN=localhost
TENANCY_DB_PREFIX=epos_
```

### Crear el superadmin central
```bash
php artisan db:seed --class=CentralAdminSeeder
```

Esto crea el usuario `superadmin@epos.local` con contraseña `superadmin123`. **Cambiar la contraseña en producción.**

### Ejecutar migraciones centrales
```bash
php artisan migrate
```

---

## Panel Central

Acceder en:
```
https://tudominio.com/central/login
```

**Credenciales iniciales:**
```
Email:    superadmin@epos.local
Password: superadmin123
```

El panel central permite:
- Ver estadísticas de todas las empresas registradas
- Crear nuevas empresas
- Activar / desactivar acceso de una empresa
- Ver estadísticas en tiempo real de cada empresa (usuarios, clientes, facturas, artículos)
- Editar datos de la empresa
- Eliminar una empresa y su base de datos completa

---

## Crear una nueva empresa

Desde el panel central → **Nueva empresa**:

| Campo | Ejemplo | Notas |
|-------|---------|-------|
| Razón Social | `Ferretería Norte SA` | Nombre completo de la empresa |
| CUIT | `30-12345678-9` | Se sanitiza automáticamente (puede ir con guiones) |
| Subdominio | `ferreteria-norte` | Solo letras minúsculas, números y guiones. Sin espacios. |
| Plan | `Pro` | Básico / Pro / Enterprise |
| Nombre admin | `Juan García` | Primer usuario administrador de esa empresa |
| Email admin | `admin@ferreteria.com` | Con este email va a iniciar sesión |
| Contraseña | `********` | Mínimo 8 caracteres |

Al confirmar, el sistema automáticamente:
1. Crea el registro del tenant
2. **Crea la base de datos** `epos_{uuid}`
3. **Ejecuta todas las migraciones** (60+ tablas de negocio)
4. Crea los 4 roles por defecto (`superadmin`, `admin`, `vendedor`, `cliente`)
5. Crea el primer usuario admin

El subdominio asignado será `ferreteria-norte.tudominio.com`.

---

## Acceder al sistema de una empresa

Cada empresa accede a su sistema por su subdominio:
```
https://ferreteria-norte.tudominio.com/login
```

El usuario admin creado al registrar la empresa puede ingresar de inmediato.

**Primer uso recomendado:**
1. Ingresar con las credenciales del admin
2. Ir a **Configuración → Empresa** y cargar: razón social, CUIT, dirección, datos AFIP
3. Subir el certificado AFIP (`cert.pem` y `key.pem`) en Configuración → AFIP
4. Crear artículos, clientes y empezar a operar

---

## Gestionar empresas

### Activar / Desactivar una empresa
Desde la lista de empresas, usar el botón de encendido/apagado. Los datos **no se eliminan**, solo se bloquea el acceso.

### Editar datos
Permite modificar razón social, CUIT y plan. El subdominio no se puede cambiar (afectaría los accesos existentes).

### Ver estadísticas en tiempo real
El botón "Ver" abre el detalle con datos consultados directamente de la BD de esa empresa: cantidad de usuarios, clientes, facturas y artículos.

### Eliminar una empresa
⚠️ **Acción irreversible.** Elimina el tenant y **borra completamente su base de datos**.

---

## Migrar datos existentes

Si ya tenías EPOS funcionando con una sola empresa y querés incorporarla como el primer tenant:

```bash
php artisan tenant:migrate-existing \
  --slug=principal \
  --razonsocial="Mi Empresa SA" \
  --cuit="20123456789" \
  --confirm
```

Opciones:

| Opción | Descripción |
|--------|-------------|
| `--slug` | Subdominio que se asignará (ej: `principal` → `principal.tudominio.com`) |
| `--razonsocial` | Nombre de la empresa (solo si la tabla `inicialsettings` no existe) |
| `--cuit` | CUIT (solo si la tabla `inicialsettings` no existe) |
| `--confirm` | Omite la confirmación interactiva |

El comando:
1. Lee datos de `inicialsettings` si existe, o usa los parámetros proporcionados
2. Crea el tenant y la nueva BD
3. Copia tabla por tabla los datos de la BD original a la nueva BD del tenant

---

## Agregar migraciones de negocio

Las migraciones de negocio (tablas que van en cada empresa) deben crearse en `database/migrations/tenant/`:

```bash
# Crear la migración en la carpeta correcta
php artisan make:migration add_notas_to_clientes_table \
  --path=database/migrations/tenant
```

Aplicarla a **todos los tenants existentes**:
```bash
php artisan tenants:migrate
```

Aplicarla solo a **un tenant específico**:
```bash
php artisan tenants:migrate --tenants=96a22593-47cf-4099-b403-538e6a8421ea
```

> **Regla:** Si la tabla va en la BD de la empresa → `database/migrations/tenant/`
> Si la tabla va en la BD central (gestión de empresas) → `database/migrations/`

---

## Resetear la base de datos de una empresa

Útil en desarrollo, onboarding de nuevos clientes o cuando se necesita dejar una empresa en estado inicial limpio.

> ⚠️ **Todas las operaciones de reset son irreversibles.** Hacé un backup antes si hay datos importantes.

### Obtener el UUID del tenant

```bash
php artisan tinker --execute="
App\Models\Tenant::with('domains')->get()
  ->each(fn(\$t) => print(\$t->razonsocial.' | '.\$t->id.' | '.\$t->domains->first()?->domain.PHP_EOL));
"
```

### Opción 1 — Solo limpiar los datos (mantener estructura)

Deja todas las tablas vacías pero conserva la estructura de la BD. Ideal para empezar desde cero sin recrear la BD.

```bash
php artisan tinker --execute="
\$tenant = App\Models\Tenant::whereHas('domains', fn(\$q) => \$q->where('domain', 'empresa1.epos.test'))->first();
tenancy()->initialize(\$tenant);

\$tables = [
    'roles','users','clientes','articulos','categorias','marcas','suppliers',
    'facturas','articulo_factura','factura_pagos','presupuestos','articulo_presupuesto',
    'remitos','articulo_remito','ventas','compras','compra_detalles',
    'inventarios','movimientos','cuentacorrientes','pagos','recibos','pago_recibo',
    'movimientocuentas','entregas','listas_precios','articulo_lista_precio',
    'inicialsettings','carts','activity_log','articulo_imagenes',
    'telegram_users','telegram_conversations','sessions','cache','cache_locks',
];

DB::statement('SET FOREIGN_KEY_CHECKS=0');
foreach (\$tables as \$table) {
    DB::table(\$table)->truncate();
    echo 'Limpiada: '.\$table.PHP_EOL;
}
DB::statement('SET FOREIGN_KEY_CHECKS=1');
tenancy()->end();
"
```

### Opción 2 — Recrear la BD completa desde cero

Elimina la BD del tenant y la vuelve a crear corriendo todas las migraciones. El tenant sigue registrado en el panel central.

```bash
php artisan tinker --execute="
\$tenant = App\Models\Tenant::whereHas('domains', fn(\$q) => \$q->where('domain', 'empresa1.epos.test'))->first();

// Eliminar la BD actual
\$dbName = config('tenancy.database.prefix') . \$tenant->id;
DB::statement('DROP DATABASE IF EXISTS \`' . \$dbName . '\`');
echo 'BD eliminada: ' . \$dbName . PHP_EOL;

// Recrear y migrar
tenancy()->initialize(\$tenant);
Artisan::call('migrate', ['--force' => true, '--path' => 'database/migrations/tenant']);
echo Artisan::output();
tenancy()->end();
"
```

### Opción 3 — Recrear y sembrar con datos iniciales

Igual que la opción 2 pero además crea los roles y un usuario superadmin inicial.

```bash
php artisan tinker --execute="
\$tenant = App\Models\Tenant::whereHas('domains', fn(\$q) => \$q->where('domain', 'empresa1.epos.test'))->first();

\$dbName = config('tenancy.database.prefix') . \$tenant->id;

// 1. Eliminar y recrear la BD vacía (hay que crearla antes de inicializar tenancy)
DB::statement('DROP DATABASE IF EXISTS \`' . \$dbName . '\`');
DB::statement('CREATE DATABASE \`' . \$dbName . '\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
echo 'BD recreada: ' . \$dbName . PHP_EOL;

// 2. Inicializar tenancy y correr migraciones
tenancy()->initialize(\$tenant);
Artisan::call('migrate', ['--force' => true, '--path' => 'database/migrations/tenant']);
echo Artisan::output();

// 3. Crear roles y superadmin
\$superadmin = App\Models\Role::create(['role' => 'superadmin', 'permission' => '*', 'description' => 'Super Administrador']);
App\Models\Role::create(['role' => 'admin',    'permission' => '*', 'description' => 'Administrador']);
App\Models\Role::create(['role' => 'vendedor', 'permission' => '',  'description' => 'Vendedor']);
App\Models\Role::create(['role' => 'cliente',  'permission' => '',  'description' => 'Cliente']);

App\Models\User::create([
    'name'     => 'Admin',
    'email'    => 'admin@empresa1.com',   // cambiar según empresa
    'password' => Illuminate\Support\Facades\Hash::make('password123'),
    'role_id'  => \$superadmin->id,
]);

echo 'Listo. BD recreada y sembrada correctamente.' . PHP_EOL;
tenancy()->end();
"
```

---

## Comandos útiles

```bash
# Listar todos los tenants registrados
php artisan tenants:list

# Correr migraciones en todos los tenants
php artisan tenants:migrate

# Rollback en todos los tenants
php artisan tenants:rollback

# Ejecutar un comando dentro del contexto de un tenant específico
php artisan tenants:run "db:seed --class=ProductosBaseSeeder" --tenants=uuid-del-tenant

# Recrear superadmin central
php artisan db:seed --class=CentralAdminSeeder

# Ver todas las rutas del panel central
php artisan route:list --name=central

# Migrar datos de instalación existente
php artisan tenant:migrate-existing --slug=principal --confirm
```

---

## Resolución de problemas

### Error: "Access denied to database epos_..."
El usuario de MySQL no tiene permiso para crear bases de datos.
```sql
GRANT CREATE ON *.* TO 'gepetto_user'@'%';
GRANT ALL PRIVILEGES ON `epos_%`.* TO 'gepetto_user'@'%';
FLUSH PRIVILEGES;
```

### Error: "Table sessions doesn't exist" en el panel central
Falta correr las migraciones centrales:
```bash
php artisan migrate
```

### Error: "Page not found" en Inertia después de agregar páginas nuevas
Reconstruir el frontend:
```bash
npm run build
```

### El tenant no reconoce el subdominio
1. Verificar que el dominio exista en la tabla `domains`
2. Verificar que `CENTRAL_DOMAIN` en `.env` coincida con el dominio base
3. En desarrollo: verificar `/etc/hosts`

### Tenancy no inicializa (usuario ve el panel central en vez del tenant)
El middleware `InitializeTenancyBySubdomain` no está reconociendo el host. Verificar:
```bash
php artisan tinker --execute="
\App\Models\Tenant::with('domains')->get()
  ->each(fn(\$t) => print(\$t->razonsocial.' → '.\$t->domains->first()?->domain.PHP_EOL));
"
```
