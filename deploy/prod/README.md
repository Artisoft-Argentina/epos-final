# EPOS — Runbook de Despliegue en VPS de Producción

Guía **as-built** (probada en el deploy real) para levantar EPOS en un VPS de producción desde cero.
Documenta cada paso y configuración, incluyendo los ajustes que descubrimos en el camino.

> **Modelo**: la **app corre en Docker** (imagen de GHCR); **PostgreSQL es nativo** en el host (fuera de Docker);
> **nginx del host** hace de reverse proxy + termina SSL wildcard. Deploy automatizado por GitHub Actions con
> gate de aprobación manual.

```
Internet ──HTTPS──► nginx (host, cert wildcard) ──► App (Docker, imagen GHCR) :127.0.0.1:8000
                                                          │
                                                          └──► PostgreSQL 16 (host, nativo)
                                                               ├── epos_central
                                                               └── epos_<tenant> ...
```

**Valores de referencia de esta instalación** (cambialos para otro VPS/dominio):

| | Valor |
|---|---|
| Dominio central | `epos.velto.ar` |
| Dominio tenants | `*.epos.velto.ar` |
| Landing (aparte, diferido) | `velto.ar` |
| IP del VPS | `2.25.88.67` |
| SO | Ubuntu 24.04 LTS |
| Imagen | `ghcr.io/artisoft-argentina/epos-final:prod` |
| Directorio en el VPS | `/var/www/html/prod` |
| Usuario de deploy | `deploy` |

---

## 0. Prerrequisitos

- VPS Ubuntu 24.04 LTS **recién creado** (Docker y nginx se instalan en el paso 1).
- Dominio con DNS en **Cloudflare** (plan Free) — necesario para el SSL wildcard vía DNS-01.
- Un **Personal Access Token (classic)** de GitHub con scope `read:packages` (para bajar la imagen privada).
- Un **API token de Cloudflare** con permiso `Zone:DNS:Edit` sobre la zona (para emitir el cert wildcard).

---

## 1. Preparación del VPS (desde cero)

### 1.1 Acceso inicial y actualización

Entrá por SSH como `root` con las credenciales que te da el proveedor (Hostinger, etc.):
```bash
ssh root@IP_DEL_VPS
```
Actualizá el sistema e instalá utilidades básicas:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg
```

### 1.2 Instalar Docker (Engine + Compose)

```bash
curl -fsSL https://get.docker.com | sudo sh
docker --version && docker compose version    # verificar (Engine + plugin compose + buildx)
```

### 1.3 Instalar nginx

```bash
sudo apt install -y nginx
sudo systemctl enable --now nginx
nginx -v
curl -I http://localhost                       # debe responder la página default de nginx
```

### 1.4 Usuario de deploy + firewall

```bash
# Usuario de servicio para los deploys (sin password, entra por clave SSH)
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy        # correr docker sin sudo (el grupo existe tras instalar Docker)

# Firewall: solo SSH + HTTP + HTTPS. Postgres NUNCA se expone a internet.
sudo apt install -y ufw
sudo ufw allow OpenSSH        # ⚠️ SSH PRIMERO, antes de enable, o te quedás afuera
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status verbose
```

---

## 2. PostgreSQL 16 nativo

> ⚠️ **Clave (lo aprendimos en el camino)**: el contenedor llega a Postgres vía `host.docker.internal`, que
> resuelve al **gateway de `docker0`**. En este VPS `docker0` es **`172.16.0.1`** (verificalo con
> `ip -4 addr show docker0`). Postgres tiene que **escuchar ahí** y **aceptar la red docker** (`172.16.0.0/12`).
> **Si en tu VPS `docker0` tiene otra IP** (ej. `172.17.0.1`), reemplazá ese valor en el `listen_addresses` del
> paso 5. El `pg_hba` y UFW usan el rango amplio `172.16.0.0/12`, que cubre cualquier subred docker.

```bash
# 1. Instalar Postgres 16 (repo oficial PGDG)
sudo apt install -y postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
sudo apt install -y postgresql-16

# 2. Verificar el gateway de docker0 (debería ser 172.16.0.1)
ip -4 addr show docker0 | grep inet

# 3. Generar una password segura SIN caracteres especiales (hex → sin líos de escape en SQL/.env/URIs)
openssl rand -hex 24          # copiala, va en el CREATE ROLE y en DB_PASSWORD

# 4. Crear usuario + base central (CREATEDB es CRÍTICO: stancl/tenancy crea una base por tenant)
sudo -u postgres psql <<'SQL'
CREATE ROLE epos_user WITH LOGIN PASSWORD 'PEGAR_HEX_ACA' CREATEDB;
CREATE DATABASE epos_central OWNER epos_user;
SQL

# 5. Red: escuchar en localhost + gateway docker, y aceptar la red docker
PGCONF=/etc/postgresql/16/main
sudo sed -i "s/^#*listen_addresses.*/listen_addresses = 'localhost,172.16.0.1'/" $PGCONF/postgresql.conf
echo "host  all  epos_user  172.16.0.0/12  scram-sha-256" | sudo tee -a $PGCONF/pg_hba.conf
sudo systemctl restart postgresql

# 6. Firewall: permitir SOLO a la red docker llegar al 5432 (nunca al público)
sudo ufw allow from 172.16.0.0/12 to any port 5432 proto tcp
```

### Pre-flight test (imprescindible — valida docker → Postgres nativo antes de desplegar)

```bash
docker run --rm --add-host host.docker.internal:host-gateway postgres:16-alpine \
  psql "postgresql://epos_user:PEGAR_HEX_ACA@host.docker.internal:5432/epos_central" -c "SELECT 1;"
```
Debe devolver una tabla con `1`. Si falla, revisá `listen_addresses`, `pg_hba` y la regla de UFW.

---

## 3. Directorio de la app + compose + `.env`

```bash
sudo mkdir -p /var/www/html/prod/storage
sudo chown -R deploy:deploy /var/www/html/prod
cd /var/www/html/prod
```

### `/var/www/html/prod/docker-compose.yml` (app-only)

> ⚠️ **`DB_HOST` va en `environment`** (no solo en el `.env`): el `entrypoint.prod.sh` espera la BD con
> `pg_isready -h $DB_HOST` leyendo el **shell**, no el `.env`. Sin esto, en prod caería a `postgres` (que no
> existe) y el arranque colgaría.

```bash
sudo tee /var/www/html/prod/docker-compose.yml > /dev/null <<'EOF'
services:
  app:
    image: ${APP_IMAGE:-ghcr.io/artisoft-argentina/epos-final:prod}
    container_name: prod-epos-app
    restart: unless-stopped
    ports:
      - '127.0.0.1:8000:80'          # solo lo alcanza el nginx del host
    environment:
      - RUN_MIGRATIONS=true          # migra la base CENTRAL en cada arranque (incremental)
      - RUN_SEEDERS=false            # true SOLO en el primer boot (ver paso 6)
      - DB_HOST=host.docker.internal # el entrypoint lo necesita para esperar la BD
      - DB_PORT=5432
      - DB_USERNAME=epos_user
    extra_hosts:
      - "host.docker.internal:host-gateway"
    volumes:
      - ./storage:/var/www/html/storage       # certs, uploads, PDFs → PERSISTE
      - ./.env:/var/www/html/.env
    networks:
      - epos-network

networks:
  epos-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
EOF
```

### `/var/www/html/prod/.env`

```bash
sudo tee /var/www/html/prod/.env > /dev/null <<'EOF'
APP_NAME=EPOS
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://epos.velto.ar
APP_LOCALE=es
APP_FALLBACK_LOCALE=es

LOG_CHANNEL=stack
LOG_LEVEL=warning
BCRYPT_ROUNDS=12

DB_CONNECTION=pgsql
DB_HOST=host.docker.internal
DB_PORT=5432
DB_DATABASE=epos_central
DB_USERNAME=epos_user
DB_PASSWORD=REEMPLAZAR_HEX

CENTRAL_DOMAIN=epos.velto.ar
TENANCY_DB_PREFIX=epos_

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_DOMAIN=.epos.velto.ar
SESSION_SECURE_COOKIE=true
QUEUE_CONNECTION=database
CACHE_STORE=database

SUPERADMIN_EMAIL=REEMPLAZAR
SUPERADMIN_PASSWORD=REEMPLAZAR
SUPERADMIN_NAME=REEMPLAZAR

MAIL_MAILER=log
AFIP_ENVIRONMENT=homologacion
AI_PROVIDER=groq
GROQ_API_KEY=
EOF

# Permisos: solo el dueño puede leerlo
sudo chown deploy:deploy /var/www/html/prod/.env
sudo chmod 600 /var/www/html/prod/.env

# Completar placeholders (DB_PASSWORD, SUPERADMIN_*). APP_KEY se deja vacío:
# el entrypoint lo genera en el primer boot y lo persiste en este .env.
sudo nano /var/www/html/prod/.env
```

> **Reglas de `.env`**: valores con espacios → comillas dobles; passwords con símbolos (`#`, `$`, etc.) →
> comillas simples. La `DB_PASSWORD` hex no necesita comillas.

---

## 4. Login a GHCR (como usuario `deploy`)

El login tiene que ser del usuario `deploy` (es quien corre los deploys de Actions y lee su
`~/.docker/config.json`).

```bash
su - deploy
docker login ghcr.io -u TU_USUARIO_GITHUB     # password: el PAT con read:packages
exit
```
Debe responder **`Login Succeeded`**. (La imagen `:prod` todavía **no existe** en este punto — se construye en el primer deploy, §6.3 — así que el `Login Succeeded` es la confirmación acá; el `docker pull :prod` del primer deploy es el test de acceso end-to-end.)

---

## 5. DNS + nginx + SSL wildcard

### 5.1 DNS en Cloudflare (modo "DNS only" / nube gris)

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | `@` (velto.ar) | IP del VPS |
| A | `www` | IP del VPS |
| A | `epos` | IP del VPS |
| A | `*.epos` | IP del VPS |

> **Nube gris** en los registros de EPOS: el navegador llega directo al VPS y ve el cert de Let's Encrypt.
> (Con nube naranja fallaría el wildcard anidado `*.epos.velto.ar` en el free tier.)

### 5.2 Certificado wildcard (Let's Encrypt vía DNS-01 de Cloudflare)

```bash
sudo apt install -y certbot python3-certbot-dns-cloudflare
# /root/.secrets/cloudflare.ini  →  dns_cloudflare_api_token = <TOKEN Zone:DNS:Edit>
sudo mkdir -p /root/.secrets && sudo nano /root/.secrets/cloudflare.ini
sudo chmod 600 /root/.secrets/cloudflare.ini

sudo certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials /root/.secrets/cloudflare.ini \
  -d 'epos.velto.ar' -d '*.epos.velto.ar' \
  --agree-tos -m tu-email@dominio.com --non-interactive \
  --deploy-hook "systemctl reload nginx"
```
certbot deja un timer de renovación automática. Verificá: `sudo certbot renew --dry-run`.

### 5.3 nginx (reverse proxy)

> ⚠️ **Buffers grandes** (`proxy_buffer_size 128k`, etc.): sin esto, al **recargar (F5)** una página de un
> tenant, nginx corta con *"upstream sent too big header"* → **502**. Los headers de Laravel/Inertia superan
> el buffer default (4–8k). Este bloque lo resuelve.

```bash
sudo tee /etc/nginx/sites-available/epos > /dev/null <<'EOF'
# HTTP -> HTTPS
server {
    listen 80;
    server_name epos.velto.ar *.epos.velto.ar;
    return 301 https://$host$request_uri;
}
# HTTPS
server {
    listen 443 ssl;
    server_name epos.velto.ar *.epos.velto.ar;

    ssl_certificate     /etc/letsencrypt/live/epos.velto.ar/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/epos.velto.ar/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    # Security headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy no-referrer-when-downgrade;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;

    # Limits / timeouts
    client_max_body_size 100M;
    proxy_connect_timeout 10s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Buffers grandes para headers de Laravel/Inertia (FIX del 502 al recargar)
        proxy_buffer_size       128k;
        proxy_buffers           4 256k;
        proxy_busy_buffers_size 256k;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/epos /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Verificar el cert wildcard:
```bash
echo | openssl s_client -connect epos.velto.ar:443 -servername epos.velto.ar 2>/dev/null \
  | openssl x509 -noout -ext subjectAltName
# → DNS:*.epos.velto.ar, DNS:epos.velto.ar
```
Antes del primer deploy, `curl -sI https://epos.velto.ar` da **502** (nginx OK, app aún no desplegada) — es lo esperado.

---

## 6. CI/CD en GitHub + primer deploy

### 6.1 Clave SSH dedicada para el deploy

```bash
# LOCAL (tu máquina):
ssh-keygen -t ed25519 -C "gh-actions-epos-prod" -f $HOME/.ssh/epos_prod_deploy   # Enter x2 (sin passphrase)
cat $HOME/.ssh/epos_prod_deploy.pub                                              # copiar la pública
```
```bash
# VPS (como root): instalar la pública para el usuario deploy
sudo mkdir -p /home/deploy/.ssh
echo "PEGAR_LA_CLAVE_PUBLICA" | sudo tee -a /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh && sudo chmod 600 /home/deploy/.ssh/authorized_keys
```
Probar desde LOCAL: `ssh -i $HOME/.ssh/epos_prod_deploy deploy@IP_DEL_VPS` (debe entrar sin password).

### 6.2 Environment `production` (con gate de aprobación)

GitHub → repo → **Settings → Environments → New environment → `production`**:
- **Required reviewers**: agregar a un revisor (el que dispara el deploy **no** puede auto-aprobar).
- **Deployment branches**: restringir a `main`.
- **Environment secrets**:
  - `VPS_HOST` = IP del VPS
  - `VPS_USER` = `deploy`
  - `VPS_SSH_KEY` = contenido **completo** de la clave **privada** `epos_prod_deploy`
  - (`SLACK_WEBHOOK_URL` se hereda del nivel repo — no re-agregar.)

### 6.3 Primer deploy (crea el superadmin)

```bash
# VPS: activar seeders SOLO para el primer boot
cd /var/www/html/prod
sudo sed -i 's/RUN_SEEDERS=false/RUN_SEEDERS=true/' docker-compose.yml
```
Luego, en GitHub: **promover a `main`** (por el flujo `dev → qa → main`, vía PR). El push a `main` dispara
`deploy-prod.yml`:
1. Job `build` → construye `:prod` + `:sha-xxx` y los sube a GHCR.
2. Job `deploy` → queda **pendiente de aprobación** (el revisor aprueba en Actions → Review deployments).
3. Al aprobar: `docker pull :prod` → `docker compose up --wait` (el entrypoint genera `APP_KEY`, migra la
   central y **crea el superadmin** desde `SUPERADMIN_*`) → `tenants:migrate`.

Después del deploy, **volver a apagar los seeders**:
```bash
sudo sed -i 's/RUN_SEEDERS=true/RUN_SEEDERS=false/' /var/www/html/prod/docker-compose.yml
docker compose up -d      # recrea el contenedor con seed apagado
```

---

## 7. Verificación

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}'   # prod-epos-app → healthy
docker logs prod-epos-app --tail 30                  # sin errores
```
- `https://epos.velto.ar` → candado válido, login con el superadmin, panel **limpio** (sin tenants demo).
- Crear una empresa desde el panel → se provisiona `epos_<slug>` (roles, warehouse, POS, admin).
- Entrar a `https://<slug>.epos.velto.ar` con el admin → probar producto, cliente, lista de precios,
  inventario y una venta.

---

## 8. Operación

### Deploys normales
Flujo: `feature/xxx → PR → dev → PR → qa → PR → main`. El push a `main` dispara el deploy de prod (con
aprobación). Las ramas `dev`, `qa`, `main` están protegidas (PR obligatorio, sin push directo).

### Rollback
Cada build deja un tag inmutable `:sha-xxxxxxx`:
```bash
cd /var/www/html/prod
IMG=ghcr.io/artisoft-argentina/epos-final:sha-XXXXXXX
docker pull $IMG
APP_IMAGE=$IMG docker compose up -d --force-recreate --wait
```

### Backups (imprescindible antes de datos reales)

**Qué se respalda y por qué**: la imagen de Docker es solo el **código** (se reconstruye desde GHCR/git). Los **datos NO están en la imagen** y son **irrecuperables** si se pierden:
- **Base de datos** (`epos_central` + todas las `epos_<tenant>`) → tenants, usuarios, productos, clientes, ventas, stock. **Lo más crítico.** Vive en el Postgres nativo del host.
- **`storage/`** → archivos subidos (imágenes de productos, PDFs, certificados).
- **`.env`** → tiene el `APP_KEY` y los secretos (necesario para recuperar).

Script (base + storage + .env), por cron diario:
```bash
# /var/www/html/prod/backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
DEST=/var/www/html/prod/backups
mkdir -p $DEST
sudo -u postgres pg_dumpall | gzip > $DEST/epos_all_$DATE.sql.gz   # central + todos los tenants
tar czf $DEST/storage_$DATE.tar.gz -C /var/www/html/prod storage
cp /var/www/html/prod/.env $DEST/env_$DATE.bak
find $DEST -mtime +14 -delete
```
```bash
chmod +x /var/www/html/prod/backup.sh
(crontab -l 2>/dev/null; echo "0 3 * * * /var/www/html/prod/backup.sh") | crontab -
```

**Dónde guardarlos**: el script los deja **en el VPS** (`/var/www/html/prod/backups`) — protege contra un borrado accidental, pero **NO** contra la pérdida del VPS. Hay que copiarlos **fuera del VPS** (offsite). Recomendado: **Cloudflare R2** (ya usás Cloudflare, S3-compatible, tier gratis). Ejemplo con `rclone` (tras configurar un remote):
```bash
# agregar al final de backup.sh:
rclone copy $DEST r2:epos-backups --max-age 25h
```
Alternativas: AWS S3, Backblaze B2, o descargar los dumps a otra máquina.

### Conexión a la BD con DBeaver (túnel SSH)
Postgres está cerrado a internet → se accede por túnel SSH:
- **Main**: Host `localhost`, Port `5432`, DB `epos_central` (o `epos_<id>`), User `epos_user`, Password (DB_PASSWORD).
  - Activar **"Show all databases"** (pestaña PostgreSQL) para ver todos los tenants.
- **SSH**: Host = IP del VPS, Port `22`, User `deploy`, Auth **Public Key**, Private Key `epos_prod_deploy`.
- Si da `invalid value for parameter "TimeZone": "America/Buenos_Aires"`: editar `dbeaver.ini` (como admin)
  y agregar bajo `-vmargs`: `-Duser.timezone=America/Argentina/Buenos_Aires`.

### Renovación SSL
Automática (timer de certbot). Verificar: `sudo certbot renew --dry-run`.

---

## 9. Gotchas / troubleshooting (lo que nos pasó)

| Síntoma | Causa | Fix |
|---|---|---|
| **502 al recargar (F5)** una página de tenant | Headers de Inertia > buffer default de nginx | `proxy_buffer_size 128k` + `proxy_buffers 4 256k` (§5.3) |
| El arranque del contenedor **cuelga** esperando la BD | El entrypoint lee `DB_HOST` del shell, no del `.env` | `DB_HOST=host.docker.internal` en `environment` del compose (§3) |
| `docker pull` da `denied` | El package GHCR no da acceso al repo, o falta login | Package settings → Manage Actions access → repo con **Write**; y `docker login` como `deploy` |
| Build de prod: `invalid reference format` en el tag | Comentario inline dentro del bloque `tags: |` de YAML | Sacar el `#` del block scalar (poner el comentario arriba de `tags:`) |
| `CREATE ROLE ... syntax error at "L"` | Password sin comillas en el SQL / con símbolos | Password **hex** entre comillas simples en el SQL |
| No puedo agregarme como reviewer del deploy | El que dispara no puede auto-aprobar | Aprueba otro; o desactivar "Prevent self-review" (equipo chico) |
| Reboot del VPS | Kernel pendiente (`System restart required`) | `sudo reboot` en horario tranquilo; todo levanta solo (Postgres/systemd, contenedor/`unless-stopped`, nginx) |

