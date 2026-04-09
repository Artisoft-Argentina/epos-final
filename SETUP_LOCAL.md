# EPOS — Entorno Local con Docker

> Guía paso a paso para levantar EPOS en tu máquina de desarrollo con Docker.
> No requiere instalar PHP, MySQL ni Node.js de forma local.

---

## Requisitos previos

| Herramienta | Versión mínima | Instalación |
|---|---|---|
| Docker Desktop | 4.x | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |
| Git | cualquier | viene en el SO |
| Make | cualquier | viene en Mac/Linux |

> **Windows:** usar WSL2 con Ubuntu. Todos los comandos corren igual.

---

## Arquitectura local

```
Tu browser
    ↓
http://epos.lvh.me:81          ← Dominio central (panel de empresas)
http://empresa1.epos.lvh.me:81 ← Tenant 1
http://empresa2.epos.lvh.me:81 ← Tenant 2
    ↓
Docker (puerto 81:80)
    ↓
Nginx → PHP-FPM → Laravel 12
         ↓
    MySQL 8.0 (epos_central + epos_{uuid} por empresa)
    Redis 7
```

> **¿Por qué `lvh.me`?**
> Es un DNS público gratuito. Resuelve `*.lvh.me` → `127.0.0.1`.
> Funciona con cualquier nivel de subdominio (`empresa.epos.lvh.me` también).
> No necesitas tocar `/etc/hosts` ni instalar nada extra.

---

## Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/TU_ORG/epos-final.git
cd epos-final
```

---

## Paso 2 — Configurar el archivo de entorno

Copia el template y edítalo con tus credenciales:

```bash
cp .env.docker .env.docker.local
# Edita .env.docker con tus claves reales
```

Variables que debes configurar antes de levantar:

```env
# AFIP (obligatorio si vas a probar facturación)
AFIP_CUIT=TU_CUIT_AQUI

# MercadoPago (usar credenciales TEST)
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxx
MERCADOPAGO_PUBLIC_KEY=TEST-xxxx

# IA (opcional pero recomendado para el Asistente de Compras)
GROQ_API_KEY=gsk_xxxx
```

> Las variables de dominio ya vienen correctas para el entorno local:
> `CENTRAL_DOMAIN=epos.lvh.me` y `SESSION_DOMAIN=.lvh.me`

---

## Paso 3 — Construir y levantar los contenedores

```bash
make build
make up
```

> La primera vez tarda ~5-10 minutos (descarga imágenes y compila frontend).
> Las siguientes veces tarda ~30 segundos.

Deberías ver:

```
✓ EPOS corriendo en http://epos.lvh.me:81
  Central (admin empresas): http://epos.lvh.me:81/central
  MySQL disponible en:      localhost:3307
```

---

## Paso 4 — Primer acceso

### 4.1 Panel Central (gestión de empresas)

Abre: **http://epos.lvh.me:81/central**

Credenciales por defecto del seeder:
```
Email:    principal@mail.com
Password: superadmin123
```

> Si no ves la pantalla de login, esperá ~30 segundos y recargá.
> Los contenedores tardan un poco en estar completamente listos.

### 4.2 Crear la primera empresa (tenant)

1. En el panel central, ve a **Empresas → Nueva empresa**
2. Completá los datos:

```
Razón Social: Empresa Demo S.A.
CUIT:         30-12345678-9
Slug:         empresa1         ← define el subdominio
Plan:         pro
Admin:
  Nombre:   Admin Demo
  Email:    admin@empresa1.com
  Password: password123
```

3. Guardá. El sistema automáticamente:
   - Crea la base de datos `epos_{uuid}`
   - Ejecuta las migraciones de tenant
   - Crea los roles (superadmin, admin, vendedor, cliente)
   - Crea el usuario administrador

### 4.3 Acceder a la empresa creada

Abre: **http://empresa1.epos.lvh.me:81**

```
Email:    admin@empresa1.com
Password: password123
```

---

## Paso 5 — Flujo de trabajo diario

```bash
# Levantar (mañana)
make up

# Bajar (cuando terminas)
make down

# Ver logs en tiempo real
make logs

# Abrir shell en el contenedor
make shell

# Ejecutar un artisan command
make artisan cmd="migrate:status"

# Abrir tinker (REPL de Laravel)
make tinker
```

---

## Estructura de bases de datos

```
MySQL (localhost:3307)
├── epos_central           ← Base central: tenants, dominios, usuarios centrales
├── epos_550e8400-...      ← Base de empresa1 (UUID del tenant)
├── epos_6ba7b810-...      ← Base de empresa2
└── ...
```

Conectarte con TablePlus / DBeaver:
```
Host:     127.0.0.1
Port:     3307
User:     epos_user
Password: epos_password
```

---

## Agregar más empresas

Cada empresa nueva que crees desde el panel central:

1. Crea su base de datos automáticamente
2. Ejecuta las migraciones de tenant
3. Es accesible en `http://{slug}.epos.lvh.me:81`

No se requiere ninguna configuración extra de Docker o DNS.

---

## Migraciones

```bash
# Migrar solo la base central
make migrate

# Migrar TODAS las bases de tenants
make tenant-migrate

# Ejecutar migrations en un tenant específico
make shell
php artisan tenants:migrate --tenants=550e8400-...
```

---

## Resetear todo (empezar desde cero)

```bash
make fresh
# Pide confirmación: escribí "si"
```

Esto borra todos los volúmenes (bases de datos + storage) y arranca limpio.

---

## Troubleshooting

### El sitio no carga / Error 502

```bash
# Ver si los contenedores están corriendo
docker ps

# Ver los logs
make logs
```

### Error "Access denied" al crear empresa

El usuario MySQL necesita permiso CREATE. Verificar que el archivo `docker/mysql-init.sql` existe y que el volumen de MySQL fue recreado:

```bash
make down
docker volume rm epos-final_mysql_data
make up
```

### Subdominio no resuelve (lvh.me no funciona)

Alternativa manual en `/etc/hosts`:

```bash
sudo nano /etc/hosts
# Agregar:
127.0.0.1  epos.lvh.me
127.0.0.1  empresa1.epos.lvh.me
127.0.0.1  empresa2.epos.lvh.me
```

### APP_KEY vacío

```bash
make shell
php artisan key:generate
exit
docker restart epos-app
```

### Los cambios en código no se reflejan

El contenedor tiene el código copiado en la imagen. Para ver cambios en tiempo real sin reconstruir:

```bash
# Montar el código fuente (modo desarrollo)
# Agregar en docker-compose.yml > app > volumes:
#   - .:/var/www/html
# Luego:
make rebuild
```

### Limpiar caché de Laravel

```bash
make shell
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

---

## Comandos de referencia rápida

| Comando | Descripción |
|---|---|
| `make up` | Levantar contenedores |
| `make down` | Bajar contenedores |
| `make build` | Reconstruir imagen |
| `make logs` | Ver logs en tiempo real |
| `make shell` | Shell en el contenedor |
| `make migrate` | Migrar base central |
| `make tenant-migrate` | Migrar todas las bases de tenants |
| `make fresh` | Reset completo (pide confirmación) |
| `make tinker` | Abrir Laravel Tinker |
| `make mysql-shell` | Abrir MySQL CLI |
