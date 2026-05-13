#!/bin/sh
set -e

echo "==> Esperando que PostgreSQL esté disponible en ${DB_HOST:-postgres}:${DB_PORT:-5432}..."
until pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-epos_user}" -q; do
    sleep 1
done
echo "==> PostgreSQL disponible."

mkdir -p storage/app/public
mkdir -p storage/app/private/afip
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs
mkdir -p bootstrap/cache

chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Fix permisos de nginx tmp para uploads de archivos
mkdir -p /tmp/nginx/client_body /tmp/nginx/fastcgi /tmp/nginx/proxy /tmp/nginx/uwsgi /tmp/nginx/scgi
chown -R www-data:www-data /tmp/nginx
chmod -R 755 /tmp/nginx
chmod 2755 /tmp/nginx

if [ -z "$(grep -E '^APP_KEY=base64:' /var/www/html/.env 2>/dev/null)" ]; then
    echo "==> Generando APP_KEY..."
    php artisan key:generate --force
fi

echo "==> Creando symlink de storage..."
php artisan storage:link --force

echo "==> Limpiando cache de configuración..."
php artisan config:clear

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo "==> Ejecutando migraciones de la base central..."
    php artisan migrate --force
fi

if [ "${RUN_SEEDERS:-false}" = "true" ]; then
    echo "==> Ejecutando seeders..."
    php artisan db:seed --force
fi

echo "==> Optimizando configuración..."
php artisan package:discover --ansi
php artisan config:cache
php artisan route:cache
php artisan view:cache

mkdir -p /var/log/supervisor
mkdir -p /var/log/nginx

echo "==> Iniciando servicios (nginx + php-fpm)..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
