# EPOS — Despliegue (índice)

Documentación de despliegue de EPOS. Los detalles de cada ambiente están en su **runbook**; acá va lo
**común a todos**: flujo de ramas, estrategia GHCR y los workflows.

## Ambientes

| Ambiente | Rama | Dominio | Base de datos | Runbook |
|---|---|---|---|---|
| **dev** | `dev` | `dev.artisoft-demo.store` | Postgres en Docker | [dev-qa/README.md](dev-qa/README.md) |
| **qa** | `qa` | `qa.artisoft-demo.store` | Postgres en Docker | [dev-qa/README.md](dev-qa/README.md) |
| **prod** | `main` | `epos.velto.ar` | Postgres **nativo** | [prod/README.md](prod/README.md) |

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
| `deploy-dev.yml` | push a `dev` | build+push `:dev` → VPS: `git pull`, `docker pull`, `compose up --wait`, `tenants:migrate` |
| `deploy-qa.yml` | push a `qa` | ídem con `:qa` |
| `deploy-prod.yml` | push a `main` | build+push `:prod`+`:sha` → **aprobación** → VPS: `docker pull`, `compose up --wait`, `tenants:migrate` |

## Migraciones (multitenant)

Todos los deploys corren migraciones **incrementales** (nunca `migrate:fresh` en un ambiente con datos):
- **Central**: la migra el entrypoint (`RUN_MIGRATIONS=true`).
- **Tenants**: `php artisan tenants:migrate --force` (explícito en cada workflow — el entrypoint no lo hace).

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
