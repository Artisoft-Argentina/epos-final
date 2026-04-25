#!/bin/sh
set -e

echo "==> Esperando que PostgreSQL esté disponible en ${DB_HOST:-postgres}:${DB_PORT:-5432}..."
until pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-epos_user}" -q; do
    sleep 1
done
echo "==> PostgreSQL disponible."

# Crear directorios de storage necesarios si no existen
# NOTA: ./storage está bind-mounted desde el host (ver docker-compose.yml)
# por eso es necesario crear los subdirectorios y aplicar permisos en cada inicio
mkdir -p storage/app/public
mkdir -p storage/app/private/afip
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs
mkdir -p bootstrap/cache

# Asegurar permisos correctos sobre el volumen bind-mounted
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Generar APP_KEY si no está definida
if [ -z "$(grep -E '^APP_KEY=base64:' /var/www/html/.env 2>/dev/null)" ]; then
    echo "==> Generando APP_KEY..."
    php artisan key:generate --force
fi

# Crear symlink de storage
# Se usa --force porque public/storage vive dentro del contenedor (no en el volumen)
# y se pierde cada vez que el contenedor es recreado. También maneja symlinks rotos.
echo "==> Creando symlink de storage..."
php artisan storage:link --force

# Limpiar solo el config cache antes de migrar (no el cache de BD que aún no existe)
echo "==> Limpiando cache de configuración..."
php artisan config:clear

# Migraciones de la base de datos central
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo "==> Ejecutando migraciones de la base central..."
    php artisan migrate --force
fi

# Seeders
if [ "${RUN_SEEDERS:-false}" = "true" ]; then
    echo "==> Ejecutando seeders..."
    php artisan db:seed --force
fi

# Caché de configuración (mejora el rendimiento)
echo "==> Optimizando configuración..."
php artisan package:discover --ansi
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Crear directorios de logs para supervisor
mkdir -p /var/log/supervisor
mkdir -p /var/log/nginx

echo "==> Iniciando servicios (nginx + php-fpm)..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
