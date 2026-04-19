#!/bin/sh
set -e

echo "==> Esperando que MySQL esté disponible en ${DB_HOST:-mysql}:${DB_PORT:-3306}..."
until nc -z "${DB_HOST:-mysql}" "${DB_PORT:-3306}"; do
    sleep 1
done
echo "==> MySQL disponible."

# Instalar dependencias si no existen (bind-mount del host puede no tener vendor/node_modules)
if [ ! -f /var/www/html/vendor/autoload.php ] || [ ! -d /var/www/html/vendor/laravel/pail ]; then
    echo "==> Instalando dependencias PHP (composer install)..."
    composer install --no-interaction --optimize-autoloader --no-scripts
    composer run-script post-autoload-dump --no-interaction 2>/dev/null || true
fi

if [ ! -f /var/www/html/node_modules/.bin/vite ]; then
    echo "==> Instalando dependencias JS (npm install)..."
    npm install --no-audit --no-fund
fi

# Crear directorios de storage necesarios si no existen
# NOTA: ./storage está bind-mounted desde el host (ver docker-compose.yml)
# por eso es necesario crear los subdirectorios y aplicar permisos en cada inicio
mkdir -p storage/app/public
mkdir -p storage/app/private/tenants
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs
mkdir -p bootstrap/cache

# Asegurar permisos correctos sobre el volumen bind-mounted
# El bind-mount del host preserva los permisos del host (usuario germanio),
# que generalmente es UID 1000. php-fpm corre como www-data (UID 33 en Alpine).
# Para desarrollo local, usamos permisos amplios para evitar problemas de escritura.
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
# Asegurar que los logs sean escribibles por php-fpm, incluso si fueron creados
# por root en una ejecución anterior del entrypoint
chmod -R 777 storage/logs storage/framework/cache storage/framework/sessions storage/framework/views

# Generar APP_KEY si no está definida
if [ -z "$(grep -E '^APP_KEY=base64:' /var/www/html/.env 2>/dev/null)" ]; then
    echo "==> Generando APP_KEY..."
    php artisan key:generate --force
fi

# Crear symlink de storage
# Se usa --force porque public/storage vive dentro del contenedor (no en el volumen)
# y se pierde cada vez que el contenedor es recreado. También maneja symlinks rotos.
echo "==> Creando symlink de storage..."
ln -sfn /var/www/html/storage/app/public /var/www/html/public/storage

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

echo "==> Iniciando servicios (nginx + php-fpm + vite)..."

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
