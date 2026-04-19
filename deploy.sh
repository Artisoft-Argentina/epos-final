#!/bin/bash

# Script de deployment para Hostinger
echo "🚀 Iniciando deployment..."

# 1. Build del frontend
echo "📦 Building frontend..."
npm run build

# 2. Optimizar Laravel
echo "⚡ Optimizando Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 3. Migrar base de datos
echo "🗄️ Ejecutando migraciones..."
php artisan migrate --force

# 4. Limpiar caches antiguos
php artisan cache:clear

# 5. Permisos
echo "🔐 Configurando permisos..."
chmod -R 755 storage bootstrap/cache

echo "✅ Deployment completado!"
echo "🌐 Sitio: https://artisoft-demo.store"
