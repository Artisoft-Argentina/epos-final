#!/bin/sh
set -e

echo "==> Esperando que MySQL esté disponible en ${DB_HOST:-mysql}:${DB_PORT:-3306}..."
until nc -z "${DB_HOST:-mysql}" "${DB_PORT:-3306}"; do
    sleep 1
done
echo "==> MySQL disponible."

# Crear directorios de storage necesarios si no existen
mkdir -p storage/app/public
mkdir -p storage/app/private/afip
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs
mkdir -p bootstrap/cache

# Asegurar permisos correctos
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Generar APP_KEY si no está definida
if [ -z "$(grep -E '^APP_KEY=base64:' /var/www/html/.env 2>/dev/null)" ]; then
    echo "==> Generando APP_KEY..."
    php artisan key:generate --force
fi

# Crear symlink de storage si no existe
if [ ! -L "public/storage" ]; then
    echo "==> Creando symlink de storage..."
    php artisan storage:link
fi

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
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Crear directorios de logs para supervisor
mkdir -p /var/log/supervisor
mkdir -p /var/log/nginx

echo "==> Iniciando servicios (nginx + php-fpm)..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
