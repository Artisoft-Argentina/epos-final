# EPOS — Guía de instalación y arranque (desarrollo local)

## Requisitos previos

| Herramienta | Versión | Uso |
|---|---|---|
| [Laravel Herd](https://herd.laravel.com) | ≥ 1.9 | Servidor PHP + dominios `.test` |
| Docker Desktop | ≥ 4.x | Contenedor MySQL |
| Node.js | ≥ 20 | Compilación del frontend |
| PHP | ≥ 8.3 | Incluido en Herd |
| Composer | ≥ 2 | Incluido en Herd |

---

## 1. Primera vez — Instalación completa

### 1.1 Clonar el repositorio

```bash
cd ~/proyectos   # o la carpeta que uses
git clone <repo-url> epos-final
cd epos-final
```

### 1.2 Instalar dependencias PHP y Node

```bash
composer install
npm install
```

### 1.3 Configurar el entorno

```bash
cp .env.example .env
php artisan key:generate
```

Editar `.env` con los siguientes valores clave:

```env
APP_URL=https://epos.test

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3308
DB_DATABASE=gepetto
DB_USERNAME=gepetto_user
DB_PASSWORD=gepetto_password

CENTRAL_DOMAIN=epos.test
TENANCY_DB_PREFIX=epos_

SESSION_DRIVER=database
```

### 1.4 Iniciar el contenedor MySQL

```bash
docker run -d \
  --name epos_mysql \
  -p 3308:3306 \
  -e MYSQL_ROOT_PASSWORD=root_password \
  -e MYSQL_DATABASE=epos \
  -e MYSQL_USER=gepetto_user \
  -e MYSQL_PASSWORD=gepetto_password \
  --restart unless-stopped \
  mysql:8.0
```

Esperar ~10 segundos a que MySQL arranque por primera vez, luego crear la BD central:

```bash
docker exec epos_mysql mysql -u root -proot_password -e "
  CREATE DATABASE IF NOT EXISTS gepetto CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  GRANT ALL PRIVILEGES ON gepetto.* TO 'gepetto_user'@'%';
  GRANT CREATE ON *.* TO 'gepetto_user'@'%';
  GRANT ALL PRIVILEGES ON \`epos_%\`.* TO 'gepetto_user'@'%';
  FLUSH PRIVILEGES;
"
```

### 1.5 Correr migraciones y seeders

```bash
php artisan migrate:fresh --seed
```

Esto crea automáticamente:
- **BD central `gepetto`**: tablas del sistema + superadmin del panel central
- **BD tenant `epos_principal`**: roles, usuarios, artículos, clientes, ventas de ejemplo

> El seeder elimina y recrea `epos_principal` en cada ejecución, por lo que
> `migrate:fresh --seed` se puede repetir sin errores.

### 1.6 Registrar el sitio en Herd

```bash
herd link epos           # registra el proyecto como epos.test
herd secure epos         # habilita HTTPS con certificado local
```

Verificar en la UI de Herd que el proyecto aparece como `epos.test`.

### 1.7 Agregar el subdominio de desarrollo en Herd

Herd soporta subdominios wildcard automáticamente. Verificar que `principal.epos.test` resuelva:

```bash
ping -c 1 principal.epos.test
# debe resolver a 127.0.0.1
```

Si no resuelve, en la UI de Herd → **Settings → DNS** activar wildcard para `.test`.

### 1.8 Compilar assets del frontend

```bash
npm run dev   # modo desarrollo con hot reload
```

---

## 2. Arranque diario

Una vez instalado, para levantar el proyecto cada día:

```bash
# 1. Iniciar Docker (si no está corriendo)
docker start epos_mysql

# 2. Herd arranca automáticamente con macOS
#    Si no, abrirlo desde Applications o:
open -a Herd

# 3. Frontend con hot reload
cd ~/proyectos/epos-final
npm run dev
```

Listo. El proyecto está disponible en:

| URL | Descripción |
|---|---|
| `https://epos.test` | E-commerce / redirect a shop |
| `https://epos.test/login` | Login de usuarios tenant |
| `https://epos.test/central/login` | Panel central (superadmin) |
| `https://principal.epos.test/login` | Login del tenant "principal" |

---

## 3. Credenciales de acceso

### Panel central (superadmin)
| Campo | Valor |
|---|---|
| URL | `https://epos.test/central/login` |
| Email | `superadmin@epos.local` |
| Contraseña | `superadmin123` |

### Tenant "principal"
| Campo | Valor |
|---|---|
| URL | `https://principal.epos.test/login` |
| Email (superadmin) | `superadmin@mail.com` |
| Contraseña | `asdf1234` |
| Email (admin) | `admin@mail.com` |
| Contraseña | `asdf1234` |
| Email (vendedor) | `vendedor@mail.com` |
| Contraseña | `asdf1234` |

---

## 4. Comandos frecuentes

### Base de datos

```bash
# Reset completo — borra TODAS las tablas centrales, elimina epos_principal,
# recrea todo y re-seedea (se puede repetir sin errores)
php artisan migrate:fresh --seed

# Solo correr migraciones nuevas en la BD central
php artisan migrate

# Correr migraciones pendientes en todos los tenants existentes
php artisan tenants:migrate

# Ver estado de migraciones
php artisan migrate:status
```

### Crear un nuevo tenant desde artisan

```bash
php artisan tinker
```

```php
$tenant = \App\Models\Tenant::create([
    'razonsocial' => 'Mi Empresa SRL',
    'cuit'        => '30123456789',
    'plan'        => 'basic',
    'status'      => 'active',
]);
$tenant->domains()->create(['domain' => 'miempresa.epos.test']);
```

### Cache y configuración

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Todo junto
php artisan optimize:clear
```

### Frontend

```bash
npm run dev       # desarrollo con hot reload
npm run build     # compilar para producción
npm run lint      # linter ESLint
```

### Logs

```bash
tail -f storage/logs/laravel.log
```

---

## 5. Estructura de bases de datos

```
MySQL (puerto 3308)
├── gepetto              ← BD central
│   ├── tenants          ← registro de empresas
│   ├── domains          ← subdominios de cada empresa
│   ├── central_users    ← superadmins del panel central
│   ├── sessions
│   ├── cache
│   └── jobs
│
├── epos_principal       ← BD del tenant "principal" (creada por el seeder)
│   ├── roles
│   ├── users
│   ├── articulos
│   ├── clientes
│   ├── facturas
│   └── ... (60+ tablas de negocio)
│
└── epos_<uuid>          ← BD de cada empresa creada desde el panel central
```

---

## 6. Solución de problemas frecuentes

### "Connection refused" al correr artisan

El contenedor MySQL no está corriendo.

```bash
# Verificar estado
docker ps | grep epos_mysql

# Iniciarlo
docker start epos_mysql
```

### "TenantDatabaseAlreadyExistsException"

Ocurre si se corre `php artisan migrate:fresh --seed` después de un seed anterior.
Está resuelto: el `DatabaseSeeder` elimina `epos_principal` antes de recrearla.
Si aparece en otro tenant, eliminarlo manualmente:

```bash
docker exec epos_mysql mysql -u root -proot_password \
  -e "DROP DATABASE IF EXISTS \`epos_principal\`;"
```

### "Tenant could not be identified on domain"

El dominio no está registrado en la tabla `domains`.

```bash
docker exec epos_mysql mysql -u gepetto_user -pgepetto_password gepetto \
  -e "SELECT * FROM domains;"
```

Si está vacía, volver a correr `php artisan migrate:fresh --seed`.

### Assets cargando desde `/tenancy/assets/`

`FilesystemTenancyBootstrapper` debe estar **desactivado** en `config/tenancy.php`.
Verificar que no aparezca en el array `bootstrappers`.

### El subdominio no resuelve en el navegador

```bash
# Abrir Herd → Settings → DNS → activar wildcard para .test

# Alternativa manual:
sudo sh -c 'echo "127.0.0.1 principal.epos.test" >> /etc/hosts'
```

### Error "Table 'gepetto.roles' doesn't exist" al seedear

Los seeders de negocio se ejecutan fuera del contexto tenant.
Asegurarse de que `DatabaseSeeder` llame a esos seeders dentro de `tenancy()->initialize($tenant)`.

### Error "Table sessions doesn't exist"

```bash
php artisan migrate
```

### Regenerar clave de aplicación

```bash
php artisan key:generate
php artisan config:clear
```

---

## 7. Variables de entorno importantes

| Variable | Valor dev | Descripción |
|---|---|---|
| `APP_URL` | `https://epos.test` | URL del dominio central |
| `CENTRAL_DOMAIN` | `epos.test` | Dominio raíz sin subdominio |
| `TENANCY_DB_PREFIX` | `epos_` | Prefijo para BDs de tenants |
| `DB_PORT` | `3308` | Puerto del MySQL en Docker |
| `SESSION_DRIVER` | `database` | Sesiones en BD (no archivo) |
| `SESSION_SECURE_COOKIE` | `false` | En dev; `true` en producción |
