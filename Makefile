# ============================================================
# EPOS — Makefile de comandos de conveniencia
# ============================================================
# Uso: make <comando>
#
# LOCAL:
#   make up           Levantar entorno local
#   make down         Bajar entorno local
#   make build        Reconstruir imagen Docker
#   make logs         Ver logs del contenedor app
#   make shell        Abrir shell en el contenedor app
#   make migrate      Ejecutar migraciones (base central)
#   make tenant-migrate  Migrar todas las bases de tenants
#   make fresh        Borrar todo y empezar desde cero (¡CUIDADO!)
#
# PRODUCCIÓN (ejecutar en el VPS):
#   make prod-up      Levantar entorno de producción
#   make prod-down    Bajar entorno de producción
#   make prod-deploy  Pull + build + restart (deploy completo)
#   make migrate-prod Ejecutar migraciones en producción
#   make backup       Hacer backup de MySQL
# ============================================================

dev-up:
	$(COMPOSE) up -d
	@echo ""
	@echo "✓ EPOS dev corriendo en http://epos.lvh.me:$(APP_PORT)"
	@echo "  Vite dev server:         http://epos.lvh.me:5173"
	@echo "  PostgreSQL disponible en: localhost:$(DB_EXTERNAL_PORT)"
	@echo "  Redis disponible en:      localhost:$(REDIS_EXTERNAL_PORT)"

dev-down:
	$(COMPOSE) down

dev-logs:
	$(COMPOSE) logs -f app

dev-shell:
	$(COMPOSE) exec app sh

dev-rebuild: dev-down build-fresh dev-up

.PHONY: up down build build-fresh logs shell migrate tenant-migrate seed demo-seed tenants-list fresh \
        rebuild rebuild-fresh prod-up prod-down prod-deploy migrate-prod backup \
        artisan tinker queue-work dev-up dev-down dev-logs dev-shell dev-rebuild postgres-shell

-include .env
export

COMPOSE      = docker compose
COMPOSE_PROD = docker compose -f docker-compose.prod.yml
APP          = $(APP_ENV)-epos-app

# ─── LOCAL ────────────────────────────────────────────────

up:
	$(COMPOSE) up -d
	@echo ""
	@echo "✓ EPOS corriendo en http://epos.lvh.me:$(APP_PORT)"
	@echo "  Central (admin empresas): http://epos.lvh.me:$(APP_PORT)/central"
	@echo "  MySQL disponible en:      localhost:$(DB_EXTERNAL_PORT)"
	@echo "  Redis disponible en:      localhost:$(REDIS_EXTERNAL_PORT)"

down:
	$(COMPOSE) down

build:
	$(COMPOSE) build

build-fresh:
	$(COMPOSE) build --no-cache

rebuild: down build up

rebuild-fresh: down build-fresh up

logs:
	$(COMPOSE) logs -f app

shell:
	$(COMPOSE) exec app sh

postgres-shell:
	$(COMPOSE) exec postgres psql -U epos_user -d epos_central

migrate:
	$(COMPOSE) exec app php artisan migrate --force

tenant-migrate:
	$(COMPOSE) exec app php artisan tenants:migrate --force
	@echo "✓ Migraciones ejecutadas en todas las bases de tenants"

seed:
	$(COMPOSE) exec app php artisan db:seed --force

# Siembra datos demo en un tenant específico (marcas, categorías, productos, stock, clientes).
# Uso: make demo-seed tenant=<tenant_id>
demo-seed:
	@if [ -z "$(tenant)" ]; then \
		echo "✗ Falta el parámetro 'tenant'."; \
		echo "  Uso: make demo-seed tenant=<tenant_id>"; \
		echo ""; \
		echo "  Tenants disponibles:"; \
		$(COMPOSE) exec -T app php artisan tinker --execute="App\Models\Tenant::pluck('id')->each(fn(\$$id) => print('   - '.\$$id.PHP_EOL));" 2>/dev/null; \
		exit 1; \
	fi
	$(COMPOSE) exec app php artisan tenants:run epos:seed-demo --tenants=$(tenant)
	@echo "✓ Datos demo sembrados en tenant '$(tenant)'."

# Lista los tenants existentes
tenants-list:
	@$(COMPOSE) exec -T app php artisan tinker --execute="App\Models\Tenant::pluck('id')->each(fn(\$$id) => print(' - '.\$$id.PHP_EOL));"

fresh:
	@echo "⚠️  Esto borrará TODOS los datos. Escribe 'si' para confirmar:"
	@read CONFIRM; [ "$$CONFIRM" = "si" ] || (echo "Cancelado." && exit 1)
	$(COMPOSE) down -v
	$(COMPOSE) up -d
	@echo "Esperando que PostgreSQL esté listo..."
	@sleep 5
	$(COMPOSE) exec app composer install --no-interaction
	$(COMPOSE) exec app php artisan migrate:fresh --force
	$(COMPOSE) exec app php artisan db:seed --force

fresh-ci:
	$(COMPOSE_PROD) exec -T app php artisan migrate:fresh --seed --force
	@echo "✓ BD recreada y seedeada (CI/CD dev)"

prod-fresh:
	@echo "⚠️  Esto borrará TODOS los datos. Escribe 'si' para confirmar:"
	@read CONFIRM; [ "$$CONFIRM" = "si" ] || (echo "Cancelado." && exit 1)
	$(COMPOSE_PROD) down -v
	$(COMPOSE_PROD) up -d --force-recreate
	$(COMPOSE_PROD) exec app php artisan migrate:fresh --seed --force

artisan:
	$(COMPOSE) exec app php artisan $(cmd)

tinker:
	$(COMPOSE) exec app php artisan tinker

queue-work:
	$(COMPOSE) exec app php artisan queue:work --tries=3

# ─── PRODUCCIÓN ───────────────────────────────────────────

prod-build:
	$(COMPOSE_PROD) build --no-cache

prod-up:
	$(COMPOSE_PROD) up -d --force-recreate

prod-down:
	$(COMPOSE_PROD) down

prod-logs:
	$(COMPOSE_PROD) logs -f app

prod-shell:
	$(COMPOSE_PROD) exec app sh

prod-deploy:
	@echo "==> Actualizando código..."
	git pull origin main
	@echo "==> Reconstruyendo imagen..."
	$(COMPOSE_PROD) build --no-cache
	@echo "==> Reiniciando servicios..."
	$(COMPOSE_PROD) up -d --force-recreate
	@echo "==> Optimizando..."
	$(COMPOSE_PROD) exec app php artisan config:cache
	$(COMPOSE_PROD) exec app php artisan route:cache
	$(COMPOSE_PROD) exec app php artisan view:cache
	@echo "✓ Deploy completado."

migrate-prod:
	$(COMPOSE_PROD) exec app php artisan migrate --force
	@echo "✓ Migraciones de base central ejecutadas."

tenant-migrate-prod:
	$(COMPOSE_PROD) exec app php artisan tenants:migrate --force
	@echo "✓ Migraciones de tenants ejecutadas."

backup:
	@DATE=$$(date +%Y%m%d_%H%M%S); \
	mkdir -p ./backups; \
	$(COMPOSE_PROD) exec postgres pg_dump -U epos_user epos_central > ./backups/backup_$$DATE.sql; \
	echo "✓ Backup guardado en ./backups/backup_$$DATE.sql"
