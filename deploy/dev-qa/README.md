# EPOS — Runbook de dev / qa

dev y qa **comparten un VPS** y se diferencian de prod en dos cosas clave: **Postgres corre en Docker**
(no nativo) y **no** hay gate de aprobación. Para el flujo de ramas y el modelo CI/CD general, ver
[../README.md](../README.md). Para prod, ver [../prod/README.md](../prod/README.md).

## Diferencias con prod

| | dev / qa | prod |
|---|---|---|
| Base de datos | **Postgres en Docker** | Postgres nativo en el host |
| Compose | `docker-compose.prod.yml` (raíz del repo: app + postgres + redis) | `deploy/prod/docker-compose.yml` (solo app) |
| VPS | **compartido** (`/var/www/html/{dev,qa}`) | dedicado (`/var/www/html/prod`) |
| `APP_ENV` | `dev` / `staging` | `production` |
| Datos demo | **Sí** (seeders al init crean el tenant `principal`) | No (nace limpio) |
| Gate de aprobación | No | Sí (Environment `production`) |
| Deploy hace `git pull` | **Sí** (sincroniza compose/config) | No (compose manual) |

## El compose (Postgres en Docker)

dev/qa usan el **`docker-compose.prod.yml` de la raíz del repo**, que levanta 3 servicios: `app`,
`postgres` (`postgres:16-alpine`) y `redis`. Cada ambiente es un **proyecto compose separado**, así que sus
datos viven en volúmenes distintos (`dev_postgres_data`, `qa_postgres_data`) y no se pisan entre sí.

- `RUN_MIGRATIONS=true` → el entrypoint migra la central en cada arranque.
- `RUN_SEEDERS=false` → los seeders corren solo en el init (no en cada deploy). Como `APP_ENV` **no** es
  `production`, el `DatabaseSeeder` crea el **tenant demo `principal`** + datos demo.

## El workflow (`deploy-dev.yml` / `deploy-qa.yml`)

Se dispara con el push a `dev` / `qa`:
1. Build de `Dockerfile.prod` → push `:dev` / `:qa` a GHCR.
2. SSH al VPS → **`git pull`** (trae el compose/config actualizados) → `docker pull` →
   `docker compose -f docker-compose.prod.yml up -d --force-recreate --wait` → `tenants:migrate`.

El `git pull` en el workflow mantiene el compose y el `.env` sincronizados **automáticamente** — por eso, a
diferencia de prod, no hay que actualizar el compose a mano.

## Prep de una vez (por VPS)

Tras adoptar el flujo GHCR, lo único one-time es el login al registry (para bajar la imagen privada):
```bash
# en el VPS, una vez
echo "TU_PAT" | docker login ghcr.io -u TU_USUARIO_GITHUB --password-stdin   # PAT con read:packages
```
(La primera vez, si el checkout del VPS tenía el compose viejo, un `git pull origin dev` / `qa` lo pone al día;
después el workflow lo hace solo.)

## Operación

### Reset limpio de un ambiente (⚠️ borra todos sus datos)
Útil cuando la data demo quedó inconsistente:
```bash
cd /var/www/html/dev     # o /var/www/html/qa
docker compose -f docker-compose.prod.yml down -v            # borra SOLO el volumen de ese proyecto
docker compose -f docker-compose.prod.yml up -d --force-recreate --wait
docker compose -f docker-compose.prod.yml exec -T app php artisan migrate:fresh --seed --force
docker compose -f docker-compose.prod.yml exec -T app php artisan tenants:migrate --force
```
> `down -v` elimina solo el volumen de ESE proyecto (ej. `dev_postgres_data`); el otro ambiente queda intacto.
> Verificá antes con `docker volume ls | grep postgres`.

### Migración de datos vieja (gotcha conocido)
Si un `tenants:migrate` falla con *"relation ... already exists"*, es una base de tenant con estado de
migración desfasado (deuda técnica de reestructuras de migración). En dev/qa lo más simple es el **reset
limpio** de arriba. (No aplica a prod, que nace limpio.)

### DBeaver (túnel SSH)
Postgres corre en el contenedor pero está publicado en el host (`DB_EXTERNAL_PORT` del compose). Conectar por
**túnel SSH** al VPS (como en prod): Main → Host `localhost`, Port = `DB_EXTERNAL_PORT`, DB `epos_central` (o
`epos_<id>`), User `epos_user`; SSH → el VPS de dev/qa. Si aparece el error de `TimeZone`, aplicar el fix de
`dbeaver.ini` (ver runbook de prod §8).

## Nginx / SSL

dev/qa usan `dev.artisoft-demo.store` / `qa.artisoft-demo.store` (con wildcard para tenants), con el SSL
**pre-existente del equipo** (acme.sh + nginx). El nginx del host proxya a la app igual que en prod, e incluye
los **buffers grandes** para evitar el 502 de Inertia al recargar (mismo fix que el runbook de prod §5.3:
`proxy_buffer_size 128k` + `proxy_buffers 4 256k`).

## Setup de un VPS de dev/qa desde cero

Sigue el mismo patrón que el [runbook de prod](../prod/README.md) (sistema base, Docker, nginx, usuario,
firewall, GHCR login, DNS/SSL), **con una diferencia**: **no** se instala Postgres nativo — la base viene en
el `docker-compose.prod.yml` (servicio `postgres`). Es decir, saltear el paso 2 (PostgreSQL nativo) del
runbook de prod y usar el compose compartido de la raíz del repo en lugar del app-only.
