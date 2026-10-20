# EPOS — Despliegue (índice)

Documentación de despliegue de EPOS. Los detalles de cada ambiente están en su **runbook**; acá va lo
**común a todos**: flujo de ramas, estrategia GHCR y los workflows.

## Ambientes

| Ambiente | Rama | Dominio | Base de datos | Runbook |
|---|---|---|---|---|
| **dev** | `dev` | `dev.artisoft-demo.store` | Postgres en Docker | [dev-qa/README.md](dev-qa/README.md) |
| **qa** | `qa` | `qa.artisoft-demo.store` | Postgres en Docker | [dev-qa/README.md](dev-qa/README.md) |
| **prod** | `main` | `epos.velto.ar` | Postgres **nativo** | [prod/README.md](prod/README.md) |
| **demo** | `main` (réplica de prod, misma imagen `:prod`) | — | Postgres **nativo** | [prod/README.md](prod/README.md) en `/var/www/html/demo` |

> dev y qa comparten un VPS; prod tiene el suyo dedicado.

## Flujo de release

```
feature/xxx ──PR──► dev ──PR──► qa ──PR──► main
```
- Ramas `dev`, `qa`, `main` **protegidas** (PR obligatorio, sin push directo).
- El push a cada rama **dispara su deploy** automáticamente.
- **prod** además exige **aprobación manual** (GitHub Environment `production` con *required reviewers*;
  quien dispara el deploy **no** puede auto-aprobarlo).

## Modelo de despliegue (GHCR)

- La **imagen se construye una vez en CI** (`Dockerfile.prod`) y se publica en **GitHub Container Registry**.
- El VPS hace `docker pull` — **no compila**.
- Tags: `:dev` / `:qa` / `:prod` (mutables, apuntan al último) + **`:sha-<commit>`** en prod (inmutable, para rollback).
- El **código** va en la imagen; los **datos** (Postgres) y la **config** (`.env`) viven en el VPS y no se
  reconstruyen — por eso los **backups** son imprescindibles (ver runbook de prod §8).

## Workflows (`.github/workflows/`)

| Workflow | Dispara con | Qué hace |
|---|---|---|
| `deploy-dev.yml` | push a `dev` | build+push `:dev` → un job por servidor de `deployment-config.dev.json` |
| `deploy-qa.yml` | push a `qa` | ídem con `:qa` y `deployment-config.qa.json` |
| `deploy-prod.yml` | push a `main` | build+push `:prod`+`:sha` → **aprobación** → un job por servidor de `deployment-config.prod.json` |

En cada servidor: `cd path` → `beforeHooks` → `docker pull` → `compose up --wait` → `afterHooks`.
`git pull` y el compose de dev/qa (`COMPOSE_FILE=docker-compose.prod.yml`) van en sus `beforeHooks`.

### Matriz de servidores (`deploy/deployment-config.<env>.json`)

Un archivo por ambiente (`dev`, `qa`, `prod`), cada uno una lista de servidores (una empresa = una entrada).
La imagen se construye **una vez** y se despliega en paralelo a todos (`fail-fast: false`: si uno falla, los
demás siguen).

```json
[
  {
    "name": "velto",
    "ip": "",
    "username": "",
    "port": "22",
    "beforeHooks": "",
    "afterHooks": "",
    "path": "/var/www/html/prod"
  }
]
```
- `name`: nombre del job en Actions.
- `ip` / `username`: vacíos → usan los secrets `VPS_HOST` / `VPS_USER` del ambiente.
- `path`: directorio del stack en el VPS (con su `docker-compose.yml` y `.env`, preparado según el runbook).
- `beforeHooks` / `afterHooks`: comandos shell antes del `docker pull` / después del `compose up`. Corren en
  el mismo shell, así que un `export` en `beforeHooks` afecta al compose.
- La clave es siempre `VPS_SSH_KEY` del ambiente → la pública de deploy tiene que estar en todos sus VPS.

## Migraciones

Todos los deploys corren migraciones **incrementales** (nunca `migrate:fresh` en un ambiente con datos):
las corre el entrypoint (`RUN_MIGRATIONS=true`). Un deploy = una empresa = una base.

Regla de equipo: migraciones **forward-only**; nunca renombrar/reestructurar una migración ya corrida en un
ambiente con datos; probar en qa antes de prod.

## Mantenimiento: retención de imágenes GHCR (pendiente)

Cada deploy deja una imagen en GHCR; las viejas se acumulan y (al ser privado) consumen cuota. Cuando el
registry crezca, agregar un workflow de limpieza que conserve las últimas N versiones:

```yaml
# .github/workflows/cleanup-ghcr.yml
name: Cleanup GHCR images
on:
  schedule: [{ cron: '0 3 * * 0' }]   # domingos 03:00 UTC
  workflow_dispatch: {}
jobs:
  cleanup:
    runs-on: ubuntu-latest
    permissions: { packages: write }
    steps:
      - uses: dataaxiom/ghcr-cleanup-action@v1
        with:
          keep-n-tagged: 10                 # conserva las 10 imágenes con tag más recientes (sha-xxx)
          exclude-tags: prod,qa,dev,latest  # nunca borra las etiquetas vivas
          delete-untagged: true
          delete-partial-images: true
          # dry-run: true                   # descomentar para probar sin borrar
```
