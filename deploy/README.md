# EPOS — Guía de Despliegue (GHCR + Multitenant)

Guía única para dejar el despliegue de EPOS con:

- **Imagen construida en CI** y publicada en **GitHub Container Registry (GHCR)** → el VPS solo hace `pull` (no compila).
- **Migraciones incrementales** en los tres ambientes (nunca más `migrate:fresh` en un ambiente con datos).
- **dev / qa**: Postgres corre en **Docker** (self-contained, sin cambios de infra).
- **prod**: Postgres corre **nativo en el host** (fuera de Docker); solo la app va en Docker.
- **SSL wildcard auto-renovable** para el central y todos los tenants.
- **Deploy a prod con aprobación manual** (GitHub Environments).

> **Convención de dominios (prod)**
> `velto.ar` → landing pública · `epos.velto.ar` → central (superadmin) · `*.epos.velto.ar` → tenants.

---

## 0. Estado objetivo por ambiente

| | dev | qa | prod |
|---|---|---|---|
| Imagen | GHCR `:dev` | GHCR `:qa` | GHCR `:prod` (+ `:sha-xxxx` para rollback) |
| Postgres | Docker | Docker | **Nativo en el host** |
| Redis | (no requerido — drivers de BD) | idem | idem |
| Migraciones | `migrate` + `tenants:migrate` | igual | igual |
| Seeders en deploy | **No** (`RUN_SEEDERS=false`) | No | No |
| Borra la BD | **No** | No | No |
| SSL | wildcard auto-renew | idem | idem |
| Gate de aprobación | No | No | **Sí** |

```
Internet ──HTTPS──► Nginx (host, TLS wildcard) ──► App (Docker, GHCR) :127.0.0.1:8000
   prod                                                  │
                                                         └──► PostgreSQL 16 (host, nativo)
                                                              ├── epos_central
                                                              └── epos_<tenant> ...
```

---

## 1. Cambios en el repositorio

Son cambios que se commitean en la rama `container-registry`. Corrigen 4 problemas de los workflows actuales y agregan el flujo de prod.

### Fixes que se aplican a los workflows

1. **Dockerfile equivocado** — hoy los workflows no ponen `file:`, así que buildean `./Dockerfile` (el de dev). Debe ser `Dockerfile.prod`.
2. **Nombre de imagen con mayúsculas** — `${{ github.repository }}` = `Artisoft-Argentina/...`; GHCR exige minúsculas. Se usa `${GITHUB_REPOSITORY,,}`.
3. **Permisos faltantes** — el push a GHCR necesita `permissions: packages: write`.
4. **Falta `tenants:migrate`** — el entrypoint solo migra la base central; las bases de tenant no se actualizan solas.

### 1.1 `docker-compose.prod.yml` (dev/qa) — cambio mínimo

Solo se apaga el re-seed en cada deploy. El resto queda igual (postgres y redis en Docker).

```diff
     environment:
       - RUN_MIGRATIONS=true
-      - RUN_SEEDERS=true
+      - RUN_SEEDERS=false
```

> dev/qa se siembran **una sola vez** en el setup inicial (o cuando corras `make fresh` a mano en dev). A partir de ahí, cambios de esquema = nuevas migraciones.

### 1.2 `deploy/prod/docker-compose.yml` (prod, app-only) — archivo nuevo

Referencia versionada del compose de prod. En el setup del VPS se copia a `/var/www/html/prod/docker-compose.yml`. **No** trae postgres ni redis: la app se conecta al Postgres nativo del host.

```yaml
services:
  app:
    image: ${APP_IMAGE:-ghcr.io/artisoft-argentina/epos-final:prod}
    container_name: prod-epos-app
    restart: unless-stopped
    ports:
      - '127.0.0.1:8000:80'          # solo lo alcanza el nginx del host
    environment:
      - RUN_MIGRATIONS=true          # migra la base CENTRAL en cada arranque
      - RUN_SEEDERS=false            # true SOLO en el primer boot (ver 2.8)
    extra_hosts:
      - "host.docker.internal:host-gateway"   # así el contenedor ve el Postgres del host
    volumes:
      - ./storage:/var/www/html/storage       # certs ARCA, uploads, PDFs → PERSISTE
      - ./.env:/var/www/html/.env
    networks:
      - epos-network

networks:
  epos-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16      # gateway fijo 172.20.0.1 (lo que autoriza pg_hba)
```

### 1.3 `.github/workflows/deploy-dev.yml`

```yaml
name: Deploy to Hostinger VPS (Dev)

on:
  push:
    branches: [dev]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Set lowercase image name
        run: echo "IMAGE=ghcr.io/${GITHUB_REPOSITORY,,}" >> $GITHUB_ENV

      - name: Build and push image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile.prod          # FIX: antes buildeaba ./Dockerfile (dev)
          push: true
          tags: ${{ env.IMAGE }}:dev

      - name: 🚀 Deploy to VPS
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: 22
          command_timeout: 30m
          script: |
            set -e
            cd /var/www/html/dev
            IMG=ghcr.io/artisoft-argentina/epos-final:dev
            echo "🔄 Sincronizando compose/config..."
            git config --global --add safe.directory /var/www/html/dev
            git pull origin dev
            echo "📥 Pulling image from GHCR..."
            docker pull $IMG
            echo "🐳 Restarting containers..."
            APP_IMAGE=$IMG docker compose -f docker-compose.prod.yml up -d --force-recreate --wait
            echo "🗄️  Migrando bases de tenants..."
            docker compose -f docker-compose.prod.yml exec -T app php artisan tenants:migrate --force
            echo "✅ Deployment completed successfully!"

      - name: Notify
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          fields: repo,message,commit,author,action,eventName,ref,workflow
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        if: always()
```

> **Nota (dev):** se eliminó `make fresh-ci`. dev deja de borrarse en cada deploy y pasa a migrar incremental como qa/prod. La base central la migra el entrypoint (`RUN_MIGRATIONS=true`); los tenants, el paso explícito. Si alguna vez querés un dev limpio, corré `make fresh` a mano.

### 1.4 `.github/workflows/deploy-qa.yml`

Idéntico al de dev pero con `qa` en el tag, el branch y el path. **Sin** `fresh-ci` (qa ya no lo tenía):

```yaml
name: Deploy to Hostinger VPS (QA)

on:
  push:
    branches: [qa]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Set lowercase image name
        run: echo "IMAGE=ghcr.io/${GITHUB_REPOSITORY,,}" >> $GITHUB_ENV
      - name: Build and push image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile.prod
          push: true
          tags: ${{ env.IMAGE }}:qa
      - name: 🚀 Deploy to VPS
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: 22
          command_timeout: 30m
          script: |
            set -e
            cd /var/www/html/qa
            IMG=ghcr.io/artisoft-argentina/epos-final:qa
            git config --global --add safe.directory /var/www/html/qa
            git pull origin qa
            docker pull $IMG
            APP_IMAGE=$IMG docker compose -f docker-compose.prod.yml up -d --force-recreate --wait
            docker compose -f docker-compose.prod.yml exec -T app php artisan tenants:migrate --force
            echo "✅ Deployment completed successfully!"
      - name: Notify
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          fields: repo,message,commit,author,action,eventName,ref,workflow
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        if: always()
```

### 1.5 `.github/workflows/deploy-prod.yml`

Partido en dos jobs: `build` (siempre corre) y `deploy` (con `environment: production` → **gate de aprobación**). Prod usa el compose app-only y su propio Postgres nativo.

```yaml
name: Deploy to Prod

on:
  push:
    branches: [main]
  workflow_dispatch: {}          # botón manual para redeploy / rollback

concurrency:
  group: prod-deploy
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Set lowercase image name
        run: echo "IMAGE=ghcr.io/${GITHUB_REPOSITORY,,}" >> $GITHUB_ENV
      - name: Build and push image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile.prod
          push: true
          # :prod = mutable (siempre el último); :sha-xxx = inmutable, para rollback
          tags: |
            ${{ env.IMAGE }}:prod
            ${{ env.IMAGE }}:sha-${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production        # ← acá se dispara el approval (required reviewers)
    steps:
      - name: 🚀 Deploy to VPS
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: 22
          command_timeout: 30m
          script: |
            set -e
            cd /var/www/html/prod
            IMG=ghcr.io/artisoft-argentina/epos-final:prod
            echo "📥 Pulling image from GHCR..."
            docker pull $IMG
            echo "🐳 Restarting containers..."
            APP_IMAGE=$IMG docker compose up -d --force-recreate --wait
            # el entrypoint ya migró la central; los TENANTS van aparte:
            echo "🗄️  Migrando bases de tenants..."
            docker compose exec -T app php artisan tenants:migrate --force
            echo "✅ Deployment completed successfully!"

      - name: Notify
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          fields: repo,message,commit,author,action,eventName,ref,workflow
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        if: always()
```

### 1.6 `.github/workflows/cleanup-ghcr.yml` — retención de imágenes (OPCIONAL / para más adelante)

> ⏸️ **Pospuesto — no forma parte de la primera tanda.** GHCR **no** tiene retención automática nativa: la limpieza es manual (repo → **Packages** → *Manage versions*) o vía este workflow. El registry tarda **muchos** deploys en crecer, así que no es urgente — activalo cuando el package empiece a ocupar cuota. Queda documentado y listo para copiar cuando lo necesites.

Cada deploy deja una imagen nueva en GHCR; las viejas quedan guardadas (untagged o con su `sha-`) y, al ser un package **privado**, consumen cuota. Este workflow corre semanal y **conserva las últimas 10 imágenes versionadas** + las etiquetas vivas, y borra el resto.

```yaml
name: Cleanup GHCR images

on:
  schedule:
    - cron: '0 3 * * 0'         # domingos 03:00 UTC
  workflow_dispatch: {}          # botón manual

jobs:
  cleanup:
    runs-on: ubuntu-latest
    permissions:
      packages: write            # necesario para borrar versiones del package
    steps:
      - uses: dataaxiom/ghcr-cleanup-action@v1
        with:
          # packages: por defecto = el package del repo (epos-final)
          keep-n-tagged: 10                 # conserva las 10 imágenes con tag más recientes (sha-xxx)
          exclude-tags: prod,qa,dev,latest  # nunca borra las etiquetas vivas
          delete-untagged: true             # borra las que quedaron sin tag (tags que se movieron)
          delete-partial-images: true       # maneja manifests multi-arch de forma segura
          # dry-run: true                   # descomentá para una corrida de prueba (no borra nada)
```

Qué hace, en concreto:
- **`keep-n-tagged: 10`** → mantiene las 10 imágenes `sha-xxx` más nuevas (tu historial de rollback).
- **`exclude-tags`** → `prod`/`qa`/`dev`/`latest` quedan **siempre protegidas** (son las que están corriendo).
- **`delete-untagged: true`** → limpia las que perdieron su nombre al mover un tag.

> **Primera vez:** corré el workflow a mano (`workflow_dispatch`) con `dry-run: true` descomentado para ver **qué borraría** antes de borrar en serio.
>
> Si el package es a nivel **organización** y el `GITHUB_TOKEN` no alcanza para borrar, generá un PAT con scope `delete:packages` y pasalo como `token: ${{ secrets.GHCR_CLEANUP_PAT }}`.

---

## 2. Despliegue del VPS de producción (paso a paso)

VPS: KVM 2 · 8 GB RAM · 2 vCPU · 100 GB. Ya tiene **Docker** y **Nginx** instalados.

### 2.1 Sistema base

```bash
# Usuario de deploy (si aún usás root)
sudo adduser deploy && sudo usermod -aG sudo,docker deploy
# reingresá como deploy@TU_IP

# Firewall: solo SSH + HTTP + HTTPS. Postgres NUNCA se expone a internet.
sudo apt update
sudo apt install -y ufw
sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
sudo ufw enable
```

### 2.2 PostgreSQL 16 nativo (multitenant)

```bash
sudo apt install -y postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
sudo apt install -y postgresql-16
```

Crear el usuario y la base central. **`CREATEDB` es crítico**: stancl/tenancy crea una base nueva (`epos_<id>`) por cada empresa.

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE epos_user WITH LOGIN PASSWORD 'PONÉ_UNA_PASS_FUERTE' CREATEDB;
CREATE DATABASE epos_central OWNER epos_user;
SQL
```

Permitir que **solo el contenedor** de la app se conecte (subred fija del compose, `172.20.0.0/16`):

```bash
sudo sed -i "s/^#*listen_addresses.*/listen_addresses = 'localhost,172.20.0.1'/" \
  /etc/postgresql/16/main/postgresql.conf
echo "host  all  epos_user  172.20.0.0/16  scram-sha-256" | \
  sudo tee -a /etc/postgresql/16/main/pg_hba.conf
sudo systemctl restart postgresql
```

### 2.3 Directorio de la app + `.env`

```bash
sudo mkdir -p /var/www/html/prod/storage
sudo chown -R deploy:deploy /var/www/html/prod
cd /var/www/html/prod
```

Copiar el compose app-only (de `deploy/prod/docker-compose.yml` del repo) a `/var/www/html/prod/docker-compose.yml`.

Crear `/var/www/html/prod/.env`:

```env
APP_NAME=EPOS
APP_ENV=production
APP_KEY=                              # se genera una vez (2.8) y NUNCA se cambia
APP_DEBUG=false
APP_URL=https://epos.velto.ar
APP_LOCALE=es

CENTRAL_DOMAIN=epos.velto.ar
TENANCY_DB_PREFIX=epos_

DB_CONNECTION=pgsql
DB_HOST=host.docker.internal          # el Postgres nativo del host
DB_PORT=5432
DB_DATABASE=epos_central
DB_USERNAME=epos_user
DB_PASSWORD=LA_MISMA_PASS_DE_2.2

SESSION_DRIVER=database
SESSION_DOMAIN=.epos.velto.ar      # comparte cookie entre central y tenants, no con la landing
SESSION_SECURE_COOKIE=true
QUEUE_CONNECTION=database
CACHE_STORE=database

AI_PROVIDER=groq
GROQ_API_KEY=...
AFIP_ENVIRONMENT=produccion
MERCADOPAGO_ACCESS_TOKEN=...
TELEGRAM_BOT_ADMIN_TOKEN=...
```

### 2.4 Login a GHCR (para bajar la imagen privada)

Generá un **Personal Access Token (classic)** en GitHub con scope `read:packages`, y en el VPS:

```bash
echo "TU_PAT" | docker login ghcr.io -u TU_USUARIO_GITHUB --password-stdin
```

Queda persistido en `~/.docker/config.json`; el workflow no necesita re-loguear.

### 2.5 DNS — Cloudflare como DNS autoritativo (plan Free)

Hostinger **no hostea zonas `.ar`**, así que el DNS de `velto.ar` va en **Cloudflare** (gratis). El dominio sigue **registrado en NIC.AR**; solo se delegan los nameservers a Cloudflare. El VPS sigue en Hostinger — únicamente se mueve el DNS.

1. En **Cloudflare (Free)**: *Add a site* → `velto.ar`. Te da 2 nameservers (`xxx.ns.cloudflare.com`, `yyy.ns.cloudflare.com`).
2. En el panel de **NIC.AR** → dominio `velto.ar` → sección de **servidores de nombres / delegación** → cargá esos 2 nameservers.
3. Esperá la propagación (unas horas; hasta 24-48 h). Verificá con `dig NS velto.ar`.
4. En Cloudflare, cargá los registros en **"DNS only" (nube gris)**:

| Tipo | Nombre | Valor | Para |
|------|--------|-------|------|
| A | `@` (velto.ar) | `IP_VPS` | Landing |
| A | `www` | `IP_VPS` | Landing |
| A | `epos` | `IP_VPS` | Central |
| A | `*.epos` | `IP_VPS` | Tenants |

> Todo apunta a la **misma IP**; nginx separa por `server_name` (ver 2.6). Dejá los registros de EPOS en **nube gris** por el tema del wildcard anidado.

### 2.6 Nginx (reverse proxy) + SSL

Dos certificados independientes: el **wildcard de EPOS** (DNS-01, obligatorio para cubrir `*.epos.velto.ar`) y el de la **landing** (`velto.ar` + `www`, HTTP-01 simple).

**Wildcard de EPOS — Cloudflare DNS-01 (renovación automática):**

```bash
sudo apt install -y certbot python3-certbot-dns-cloudflare
# /root/.secrets/cloudflare.ini  →  dns_cloudflare_api_token = <TOKEN con Zone:DNS:Edit>
sudo chmod 600 /root/.secrets/cloudflare.ini

sudo certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials /root/.secrets/cloudflare.ini \
  -d 'epos.velto.ar' -d '*.epos.velto.ar' \
  --agree-tos -m tu-email@velto.ar --non-interactive \
  --deploy-hook "systemctl reload nginx"
```

certbot deja un `systemd timer` que renueva a los ~60 días y recarga nginx solo. Verificar: `sudo certbot renew --dry-run`.

`/etc/nginx/sites-available/epos`:

```nginx
server {
    listen 80;
    server_name epos.velto.ar *.epos.velto.ar;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name epos.velto.ar *.epos.velto.ar;

    ssl_certificate     /etc/letsencrypt/live/epos.velto.ar/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/epos.velto.ar/privkey.pem;

    client_max_body_size 50M;         # uploads de PDFs (IA) e imágenes de productos

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;   # para que Laravel genere URLs https
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/epos /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**Landing (`velto.ar` + `www`)** — bloque nginx aparte; el cert es HTTP-01 (no es wildcard) y `certbot --nginx` lo inyecta solo. En `/etc/nginx/sites-available/landing`:

```nginx
server {
    listen 80;
    server_name velto.ar www.velto.ar;
    root /var/www/landing;        # sitio estático; o proxy_pass http://127.0.0.1:PUERTO si es otra app
    index index.html;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/landing /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d velto.ar -d www.velto.ar    # obtiene el cert y agrega el bloque 443 + redirect
```

> **Checkpoint Laravel:** verificá que confíe en el proxy (`trustProxies(at: '*')` en `bootstrap/app.php`)
> para respetar `X-Forwarded-Proto`; si no, vas a ver redirect loops o mixed-content.

### 2.7 Verificar el certificado wildcard

```bash
echo | openssl s_client -connect epos.velto.ar:443 -servername epos.velto.ar 2>/dev/null \
  | openssl x509 -noout -ext subjectAltName
# debe listar: DNS:epos.velto.ar, DNS:*.epos.velto.ar
```

### 2.8 Primer arranque, superadmin y primer tenant

```bash
cd /var/www/html/prod
docker compose run --rm app php artisan key:generate --force   # genera APP_KEY (fijo)

# Primer boot CON seeders para crear el superadmin
sed -i 's/RUN_SEEDERS=false/RUN_SEEDERS=true/' docker-compose.yml
docker compose pull && docker compose up -d --wait
docker compose logs -f app        # espera Postgres → migra central → seedea superadmin

# Apagar los seeders para los próximos deploys
sed -i 's/RUN_SEEDERS=true/RUN_SEEDERS=false/' docker-compose.yml
docker compose up -d
```

Entrás a `https://epos.velto.ar` con `admin@epos.com` / `password`, **cambiás la contraseña**, y creás la primera empresa desde el panel central → provisiona su base `epos_<id>` sincrónicamente.

### 2.9 Gate de aprobación en GitHub

**Settings → Environments → New environment → `production`:**

1. **Required reviewers**: agregate a vos (y a quien corresponda). El deploy queda **pausado hasta aprobación**.
2. **Deployment branches**: limitá a `main`.
3. **Environment secrets** (apuntando a **este** VPS de prod, separados de dev/qa):
   - `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`
   - `SLACK_WEBHOOK_URL` (si mantenés la notificación)

Flujo resultante: merge a `main` → build + push de la imagen → el deploy queda **pendiente** → te llega la notificación → **aprobás en GitHub** → recién ahí toca el VPS.

---

## 3. Operación

### 3.1 Deploy normal
Merge a la rama del ambiente (`dev`/`qa`/`main`). dev/qa despliegan solos; **prod espera tu aprobación**.

### 3.2 Rollback (prod)
Cada build deja un tag inmutable `:sha-xxxxxxx`. Para volver atrás:

```bash
cd /var/www/html/prod
IMG=ghcr.io/artisoft-argentina/epos-final:sha-ABC1234
docker pull $IMG
APP_IMAGE=$IMG docker compose up -d --force-recreate --wait
```

### 3.3 Backups (prod) — cron diario

```bash
# /var/www/html/prod/backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p /var/www/html/prod/backups
sudo -u postgres pg_dumpall | gzip > /var/www/html/prod/backups/epos_all_$DATE.sql.gz   # central + todos los tenants
tar czf /var/www/html/prod/backups/storage_$DATE.tar.gz -C /var/www/html/prod storage    # certs ARCA, uploads
find /var/www/html/prod/backups -mtime +14 -delete
```

```bash
chmod +x /var/www/html/prod/backup.sh
(crontab -l 2>/dev/null; echo "0 3 * * * /var/www/html/prod/backup.sh") | crontab -
```

Guardá los backups **fuera del VPS** (R2/S3). `pg_dumpall` captura las bases de tenant aunque se creen dinámicamente.

### 3.4 Conexión a la BD con DBeaver (sin exponer Postgres)
Postgres queda cerrado a internet. Conectá con el **túnel SSH** que trae DBeaver:
- **Main**: Host `localhost`, Port `5432`, DB `epos_central` (o `epos_<id>`), User `epos_user`.
- **SSH**: ✅ *Use SSH Tunnel* → Host `IP_VPS`, Port `22`, User `deploy`, tu clave privada.

---

## 4. Gotchas críticos

| # | Qué | Por qué importa |
|---|---|---|
| 🔴 | **`tenants:migrate` en cada deploy** | El entrypoint solo migra la base central. Sin esto, los cambios de esquema de tenant no llegan a ninguna empresa. Ya está en los 3 workflows. |
| 🔴 | **`APP_KEY` es sagrado** | Encripta certificados ARCA y tokens. Si cambia o se pierde, esos datos quedan irrecuperables. Generalo una vez; backupeá el `.env`. |
| 🔴 | **Nunca `migrate:fresh` en qa/prod** | Borra todo. Los cambios de esquema son **migraciones forward-only** (central en `database/migrations/`, tenant en `database/migrations/tenant/`). |
| 🟡 | **SSL wildcard con renovación automática** | Un cert vencido tira abajo el central **y todos los tenants** a la vez. Verificá `certbot renew --dry-run`. |
| 🟡 | **`RUN_SEEDERS=false` en régimen** | Re-seedear sobre una base con datos duplica/rompe. Los seeders corren solo en el init. |

---

## Apéndice A — Adaptar dev/qa (una sola vez)

Los VPS de dev/qa ya tienen el repo en `/var/www/html/{dev,qa}`. Los workflows hacen `git pull` en cada deploy, así que el compose y la config se sincronizan **solos** — no hay que actualizarlos a mano. Lo único one-time es el login a GHCR, para poder bajar la imagen privada:

```bash
# en el VPS de dev/qa, una sola vez
echo "TU_PAT" | docker login ghcr.io -u TU_USUARIO_GITHUB --password-stdin   # PAT con read:packages
```

A partir de ahí, cada push a `dev`/`qa` despliega vía GHCR con migraciones incrementales, sincronizando el compose por `git pull`.
