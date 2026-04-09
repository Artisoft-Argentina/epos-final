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

.PHONY: up down build logs shell migrate tenant-migrate fresh \
        prod-up prod-down prod-deploy migrate-prod backup \
        artisan tinker queue-work

-include .env
export

COMPOSE      = docker compose
COMPOSE_PROD = docker compose -f docker-compose.prod.yml
APP          = epos-app

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
	$(COMPOSE) build --no-cache

rebuild: down build up

logs:
	$(COMPOSE) logs -f app

shell:
	$(COMPOSE) exec app sh

mysql-shell:
	$(COMPOSE) exec mysql mysql -uepos_user -pepos_password epos_central

migrate:
	$(COMPOSE) exec app php artisan migrate --force

tenant-migrate:
	$(COMPOSE) exec app php artisan tenants:migrate --force
	@echo "✓ Migraciones ejecutadas en todas las bases de tenants"

seed:
	$(COMPOSE) exec app php artisan db:seed --force

fresh:
	@echo "⚠️  Esto borrará TODOS los datos. Escribe 'si' para confirmar:"
	@read CONFIRM; [ "$$CONFIRM" = "si" ] || (echo "Cancelado." && exit 1)
	$(COMPOSE) down -v
	$(COMPOSE) up -d
	$(COMPOSE) exec app php artisan migrate:fresh --seed --force

artisan:
	$(COMPOSE) exec app php artisan $(cmd)

tinker:
	$(COMPOSE) exec app php artisan tinker

queue-work:
	$(COMPOSE) exec app php artisan queue:work --tries=3

# ─── PRODUCCIÓN ───────────────────────────────────────────

prod-up:
	$(COMPOSE_PROD) up -d

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
	$(COMPOSE_PROD) exec mysql sh -c \
		"mysqldump -uroot -p$$MYSQL_ROOT_PASSWORD --all-databases 2>/dev/null" \
		> ./backups/backup_$$DATE.sql; \
	echo "✓ Backup guardado en ./backups/backup_$$DATE.sql"
