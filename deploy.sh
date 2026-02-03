#!/bin/bash

# Script de deploy para Gepetto en Hostinger VPS
# Ubicación: /var/www/gepetto/deploy.sh

set -e

echo "🚀 Iniciando deploy de Gepetto..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directorio del proyecto
PROJECT_DIR="/var/www/gepetto"
cd $PROJECT_DIR

# Activar modo mantenimiento
echo -e "${YELLOW}🔧 Activando modo mantenimiento...${NC}"
php artisan down || true

# Pull de cambios
echo -e "${YELLOW}📥 Descargando cambios desde GitHub...${NC}"
git pull origin dev

# Instalar dependencias PHP
echo -e "${YELLOW}📦 Instalando dependencias PHP...${NC}"
composer install --no-dev --optimize-autoloader --no-interaction

# Instalar dependencias Node
echo -e "${YELLOW}📦 Instalando dependencias Node...${NC}"
npm ci --production=false

# Compilar assets
echo -e "${YELLOW}🏗️ Compilando assets...${NC}"
npm run build

# Ejecutar migraciones
echo -e "${YELLOW}🔄 Ejecutando migraciones...${NC}"
php artisan migrate --force

# Limpiar caches
echo -e "${YELLOW}🧹 Limpiando caches...${NC}"
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Optimizar aplicación
echo -e "${YELLOW}⚡ Optimizando aplicación...${NC}"
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Permisos
echo -e "${YELLOW}🔐 Configurando permisos...${NC}"
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Desactivar modo mantenimiento
echo -e "${YELLOW}✅ Desactivando modo mantenimiento...${NC}"
php artisan up

echo -e "${GREEN}✅ Deploy completado exitosamente!${NC}"
echo -e "${GREEN}🌐 Aplicación disponible en: https://tu-dominio.com${NC}"
