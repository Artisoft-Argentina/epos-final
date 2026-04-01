# EPOS — Despliegue en VPS Hostinger

> Guía completa para poner EPOS en producción en un VPS de Hostinger.
> Al final tendrás el sistema corriendo con HTTPS, multitenant funcional
> y despliegue automático vía GitHub Actions.

---

## Arquitectura de producción

```
Internet (HTTPS)
      ↓
┌─────────────────────────────────────────────┐
│  VPS Hostinger                              │
│                                             │
│  Nginx (host, puerto 80/443)                │
│  Certificado SSL wildcard Let's Encrypt     │
│  *.epos.TUDOMINIO.com                       │
│       ↓ proxy_pass                          │
│  Docker: epos-app (127.0.0.1:3000)          │
│  Docker: epos-mysql (red interna)           │
│  Docker: epos-redis (red interna)           │
└─────────────────────────────────────────────┘
      ↑
DNS Wildcard: *.epos.TUDOMINIO.com → IP VPS
DNS:           epos.TUDOMINIO.com  → IP VPS
```

**¿Por qué Nginx en el host y no en Docker?**
- El certificado wildcard SSL cubre todos los subdominios de tenants sin configuración extra.
- Nginx en el host es más simple de mantener y renovar SSL.
- El contenedor Docker está aislado de internet (solo accesible desde localhost).

---

## Prerequisitos

- VPS Hostinger con Ubuntu 22.04 (plan mínimo: 2 vCPU, 4 GB RAM, 80 GB SSD)
- Dominio propio configurado en Hostinger (ej: `tudominio.com`)
- Acceso SSH al VPS (root o usuario con sudo)
- Cuenta de GitHub con el repositorio del proyecto

---

## Paso 1 — Configurar DNS en Hostinger

En el panel de Hostinger → **Dominios → DNS Zone Editor**:

Agregar estos registros:

| Tipo | Nombre | Valor | TTL |
|---|---|---|---|
| A | `epos` | `IP_DE_TU_VPS` | 300 |
| A | `*.epos` | `IP_DE_TU_VPS` | 300 |

> El registro `*.epos` cubre automáticamente `empresa1.epos`, `empresa2.epos`, etc.
> Esperar 5-15 minutos para que los DNS propaguen antes de continuar.

Verificar propagación:
```bash
nslookup epos.tudominio.com
nslookup empresa1.epos.tudominio.com
# Ambos deben mostrar la IP de tu VPS
```

---

## Paso 2 — Preparar el VPS

Conectarse por SSH:

```bash
ssh root@IP_DE_TU_VPS
```

### 2.1 Actualizar el sistema

```bash
apt update && apt upgrade -y
apt install -y curl git unzip ufw
```

### 2.2 Configurar el firewall

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

### 2.3 Crear usuario de deploy (recomendado, no root)

```bash
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Copiar las claves SSH del root al nuevo usuario
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

---

## Paso 3 — Instalar Docker

```bash
# Instalar Docker CE
curl -fsSL https://get.docker.com | sh

# Agregar el usuario al grupo docker
usermod -aG docker $USER

# Verificar
docker --version
docker compose version
```

> Cerrar y reabrir la sesión SSH para que el grupo `docker` tenga efecto.

---

## Paso 4 — Instalar Nginx en el host

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

---

## Paso 5 — Instalar Certbot (SSL con Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
```

### 5.1 Obtener certificado wildcard

El certificado wildcard requiere validación por DNS (DNS-01 challenge).

En Hostinger puedes hacerlo manualmente:

```bash
certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d "epos.tudominio.com" \
  -d "*.epos.tudominio.com" \
  --email tu@email.com \
  --agree-tos
```

Certbot te pedirá que agregues un registro TXT en tu DNS. Sigue estas instrucciones:

1. Certbot muestra algo como:
   ```
   Please deploy a DNS TXT record under the name:
   _acme-challenge.epos.tudominio.com
   with the following value: AbCdEfGhIjKlMnOp...
   ```

2. En Hostinger DNS Zone Editor, agregar:

   | Tipo | Nombre | Valor |
   |---|---|---|
   | TXT | `_acme-challenge.epos` | `AbCdEfGhIjKlMnOp...` |

3. Esperar 2-5 minutos y presionar Enter en certbot.

Los certificados quedan en:
```
/etc/letsencrypt/live/epos.tudominio.com/fullchain.pem
/etc/letsencrypt/live/epos.tudominio.com/privkey.pem
```

### 5.2 Renovación automática

Agregar a crontab para renovar automáticamente:

```bash
crontab -e
# Agregar:
0 3 * * * certbot renew --quiet && systemctl reload nginx
```

---

## Paso 6 — Configurar Nginx en el host

Crear el archivo de configuración:

```bash
nano /etc/nginx/sites-available/epos
```

Pegar esta configuración (reemplazar `tudominio.com`):

```nginx
# ─── Redirigir HTTP → HTTPS ──────────────────────────────
server {
    listen 80;
    server_name epos.tudominio.com *.epos.tudominio.com;
    return 301 https://$host$request_uri;
}

# ─── HTTPS con certificado wildcard ──────────────────────
server {
    listen 443 ssl http2;
    server_name epos.tudominio.com *.epos.tudominio.com;

    ssl_certificate     /etc/letsencrypt/live/epos.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/epos.tudominio.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Tamaño máximo de uploads (para imágenes de productos y facturas PDF)
    client_max_body_size 50M;

    # Proxy al contenedor Docker
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
    }
}
```

Activar la configuración:

```bash
ln -s /etc/nginx/sites-available/epos /etc/nginx/sites-enabled/
nginx -t  # Verificar que la config es válida
systemctl reload nginx
```

---

## Paso 7 — Clonar el proyecto en el VPS

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/TU_ORG/epos-final.git
cd epos-final

# Dar permisos al usuario deploy
chown -R deploy:deploy /var/www/epos-final
```

---

## Paso 8 — Configurar el entorno de producción

```bash
cd /var/www/epos-final
nano .env.production
```

Completar con los valores reales:

```env
APP_NAME=EPOS
APP_ENV=production
APP_KEY=                          # Se genera automáticamente al arrancar
APP_DEBUG=false
APP_URL=https://epos.tudominio.com
APP_LOCALE=es
APP_FALLBACK_LOCALE=es
APP_FAKER_LOCALE=es_AR

LOG_CHANNEL=stack
LOG_LEVEL=error

# ─── Base de datos ───────────────────────────
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=epos_central
DB_USERNAME=epos_user
DB_PASSWORD=UNA_PASSWORD_SEGURA_AQUI

# ─── MULTITENANT ─────────────────────────────
CENTRAL_DOMAIN=epos.tudominio.com
TENANCY_DB_PREFIX=epos_
SESSION_DOMAIN=.tudominio.com

# ─── Sesión y caché ──────────────────────────
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true
CACHE_STORE=database
QUEUE_CONNECTION=database

# ─── Redis ───────────────────────────────────
REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

# ─── AFIP ─────────────────────────────────────
AFIP_CUIT=TU_CUIT
AFIP_ENVIRONMENT=produccion     # ← CAMBIAR a produccion cuando tengas cert real
AFIP_CERTIFICATE_PATH=storage/app/private/afip/cert.pem
AFIP_KEY_PATH=storage/app/private/afip/key.pem

# ─── MercadoPago ─────────────────────────────
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxx   # Credenciales PRODUCCION
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxx

# ─── IA ──────────────────────────────────────
AI_PROVIDER=groq
GROQ_API_KEY=gsk_xxxx

# ─── Mail ────────────────────────────────────
MAIL_MAILER=smtp
MAIL_HOST=smtp.tudominio.com
MAIL_PORT=587
MAIL_USERNAME=noreply@tudominio.com
MAIL_PASSWORD=password_del_mail
MAIL_FROM_ADDRESS="noreply@tudominio.com"
MAIL_FROM_NAME="EPOS"
```

Configurar las variables de MySQL para Docker Compose:

```bash
# Crear archivo con variables del host para docker-compose.prod.yml
cat > /var/www/epos-final/.env.deploy << 'EOF'
MYSQL_ROOT_PASSWORD=OTRA_PASSWORD_SEGURA_ROOT
DB_USERNAME=epos_user
DB_PASSWORD=UNA_PASSWORD_SEGURA_AQUI
DB_DATABASE=epos_central
EOF

chmod 600 /var/www/epos-final/.env.deploy
```

---

## Paso 9 — Levantar los contenedores de producción

```bash
cd /var/www/epos-final

# Construir la imagen (primera vez, ~10 minutos)
docker compose -f docker-compose.prod.yml build

# Levantar los servicios
docker compose -f docker-compose.prod.yml --env-file .env.deploy up -d

# Ver que los contenedores estén corriendo
docker ps
```

Deberías ver:
```
CONTAINER ID  IMAGE          STATUS
xxxx          epos-app       Up 2 minutes (healthy)
xxxx          mysql:8.0      Up 2 minutes (healthy)
xxxx          redis:7-alpine Up 2 minutes
```

---

## Paso 10 — Configuración inicial de la aplicación

```bash
cd /var/www/epos-final

# Ejecutar migraciones de la base central
docker compose -f docker-compose.prod.yml exec app php artisan migrate --force

# Verificar que la app responde
curl -I http://127.0.0.1:3000
# Esperar: HTTP/1.1 200 OK o 302
```

Abrir en el browser: **https://epos.tudominio.com/central**

> Si el navegador muestra un error de certificado, verificar que el certificado
> wildcard fue correctamente instalado con `certbot certificates`.

---

## Paso 11 — Crear la primera empresa (tenant)

1. Ir a **https://epos.tudominio.com/central/login**
2. Crear el usuario central administrador (si no existe seeder)
3. Crear la primera empresa desde **Empresas → Nueva empresa**

```
Slug:        miempresa        ← define el subdominio
Dominio:     miempresa.epos.tudominio.com
```

El sistema creará automáticamente:
- Base de datos `epos_{uuid}`
- Migraciones del tenant
- Roles y usuario administrador

Acceder en: **https://miempresa.epos.tudominio.com**

---

## Paso 12 — GitHub Actions (Deploy automático)

Cada push a `main` puede desplegar automáticamente al VPS.

### 12.1 Configurar secretos en GitHub

En tu repositorio → **Settings → Secrets and variables → Actions**:

| Secret | Valor |
|---|---|
| `VPS_HOST` | IP de tu VPS |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Contenido de tu clave privada SSH |
| `VPS_PORT` | `22` |

### 12.2 Crear clave SSH para GitHub Actions

En el VPS:

```bash
ssh-keygen -t ed25519 -C "github-actions-epos" -f ~/.ssh/github_actions -N ""
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_actions  # Copiar esta clave privada → Secret VPS_SSH_KEY en GitHub
```

### 12.3 Workflow de deploy

Crear `.github/workflows/deploy-prod.yml`:

```yaml
name: Deploy a Producción

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy VPS Hostinger
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}
          timeout: 15m
          script: |
            cd /var/www/epos-final

            echo "==> Actualizando código..."
            git pull origin main

            echo "==> Reconstruyendo imagen..."
            docker compose -f docker-compose.prod.yml build --no-cache

            echo "==> Reiniciando servicios..."
            docker compose -f docker-compose.prod.yml --env-file .env.deploy up -d --force-recreate

            echo "==> Ejecutando migraciones..."
            docker compose -f docker-compose.prod.yml exec -T app php artisan migrate --force

            echo "==> Optimizando..."
            docker compose -f docker-compose.prod.yml exec -T app php artisan config:cache
            docker compose -f docker-compose.prod.yml exec -T app php artisan route:cache
            docker compose -f docker-compose.prod.yml exec -T app php artisan view:cache

            echo "==> Deploy completado exitosamente."
```

---

## Mantenimiento

### Ver logs

```bash
cd /var/www/epos-final
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f mysql
```

### Backup de bases de datos

```bash
cd /var/www/epos-final
make backup   # Guarda en ./backups/backup_YYYYMMDD_HHMMSS.sql
```

Automatizar con cron:

```bash
crontab -e
# Agregar (backup diario a las 2am):
0 2 * * * cd /var/www/epos-final && make backup
# Limpiar backups de más de 30 días:
0 3 * * * find /var/www/epos-final/backups -name "*.sql" -mtime +30 -delete
```

### Migrar tenants después de un update

```bash
cd /var/www/epos-final
docker compose -f docker-compose.prod.yml exec app php artisan tenants:migrate --force
```

### Escalar la aplicación

Para más tráfico, modificar `docker-compose.prod.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '4'      # Aumentar CPUs
      memory: 2G     # Aumentar RAM
```

---

## Referencia de comandos de producción

```bash
# Alias útil (agregar al ~/.bashrc del VPS)
alias epos="cd /var/www/epos-final && docker compose -f docker-compose.prod.yml"

# Luego puedes usar:
epos logs -f app
epos exec app php artisan migrate
epos exec app php artisan tenants:migrate
epos exec app php artisan tinker
epos ps
```

---

## Diagrama de flujo completo

```
Developer
    ↓ git push main
GitHub Actions
    ↓ SSH al VPS
VPS (Hostinger)
    ├── git pull
    ├── docker build (nueva imagen con código actualizado)
    ├── docker up --force-recreate (contenedor reemplazado, 0 downtime mínimo)
    ├── php artisan migrate (base central)
    └── php artisan optimize (config/route/view cache)

Usuarios finales acceden a:
    https://epos.tudominio.com/central       → Panel gestión empresas
    https://empresa1.epos.tudominio.com      → Tenant empresa 1
    https://empresa2.epos.tudominio.com      → Tenant empresa 2
    https://nuevaempresa.epos.tudominio.com  → Creada desde el panel, sin config extra
```

---

## Troubleshooting en producción

### La app no responde (503 Bad Gateway)

```bash
# Ver si el contenedor está corriendo
docker ps

# Ver logs de error
docker compose -f docker-compose.prod.yml logs app | tail -50

# Verificar que nginx del host puede alcanzar el contenedor
curl -I http://127.0.0.1:3000
```

### Error de SSL / certificado no válido

```bash
# Verificar certificados
certbot certificates

# Renovar manualmente
certbot renew --force-renewal
systemctl reload nginx
```

### No se pueden crear tenants (error de base de datos)

Verificar que el usuario MySQL tiene permiso de CREATE DATABASE:

```bash
docker compose -f docker-compose.prod.yml exec mysql \
  mysql -uroot -p"$MYSQL_ROOT_PASSWORD" \
  -e "SHOW GRANTS FOR 'epos_user'@'%';"
```

Debe aparecer `GRANT ALL PRIVILEGES ON *.* TO 'epos_user'@'%'`.

Si no aparece:

```bash
docker compose -f docker-compose.prod.yml exec mysql \
  mysql -uroot -p"$MYSQL_ROOT_PASSWORD" \
  -e "GRANT ALL PRIVILEGES ON *.* TO 'epos_user'@'%' WITH GRANT OPTION; FLUSH PRIVILEGES;"
```

### Tenant domain no resuelve

Verificar que el DNS wildcard está correctamente configurado:

```bash
nslookup nuevaempresa.epos.tudominio.com
# Debe devolver la IP de tu VPS
```

Si no resuelve, el registro DNS `*.epos` puede no estar propagado todavía.
Verificar en [dnschecker.org](https://dnschecker.org).
