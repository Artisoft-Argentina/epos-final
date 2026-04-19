#!/bin/bash

# Script de despliegue automatizado para Gepetto Docker
# Uso: ./scripts/docker-deploy.sh [desarrollo|produccion]

set -e

ENVIRONMENT=${1:-desarrollo}
PROJECT_NAME="gepetto"

echo "🐳 Iniciando despliegue Docker de Gepetto"
echo "📋 Ambiente: $ENVIRONMENT"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Verificar dependencias
check_dependencies() {
    log "Verificando dependencias..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker no está instalado"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose no está instalado"
    fi
    
    log "✅ Dependencias verificadas"
}

# Configurar variables de entorno
setup_environment() {
    log "Configurando variables de entorno..."
    
    if [ ! -f .env ]; then
        if [ -f .env.docker ]; then
            cp .env.docker .env
            log "✅ Archivo .env creado desde .env.docker"
        else
            error "No se encontró archivo .env.docker"
        fi
    else
        warn "Archivo .env ya existe, no se sobrescribirá"
    fi
    
    # Generar APP_KEY si no existe
    if ! grep -q "APP_KEY=base64:" .env; then
        log "Generando APP_KEY..."
        APP_KEY=$(openssl rand -base64 32)
        sed -i "s/APP_KEY=.*/APP_KEY=base64:$APP_KEY/" .env
    fi
}

# Construir imágenes
build_images() {
    log "Construyendo imágenes Docker..."
    
    if [ "$ENVIRONMENT" = "produccion" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
    else
        docker-compose build --no-cache
    fi
    
    log "✅ Imágenes construidas"
}

# Iniciar servicios
start_services() {
    log "Iniciando servicios..."
    
    if [ "$ENVIRONMENT" = "produccion" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    else
        docker-compose up -d
    fi
    
    log "✅ Servicios iniciados"
}

# Esperar a que los servicios estén listos
wait_for_services() {
    log "Esperando a que los servicios estén listos..."
    
    # Esperar MySQL
    log "Esperando MySQL..."
    timeout=60
    while ! docker-compose exec -T mysql mysqladmin ping -h localhost --silent; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            error "Timeout esperando MySQL"
        fi
    done
    
    # Esperar aplicación
    log "Esperando aplicación..."
    timeout=60
    while ! curl -f http://localhost/health 2>/dev/null; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            warn "Timeout esperando aplicación (puede estar funcionando)"
            break
        fi
    done
    
    log "✅ Servicios listos"
}

# Ejecutar migraciones
run_migrations() {
    log "Ejecutando migraciones..."
    
    docker-compose exec -T app php artisan migrate --force
    
    log "✅ Migraciones ejecutadas"
}

# Ejecutar seeders (solo en desarrollo)
run_seeders() {
    if [ "$ENVIRONMENT" = "desarrollo" ]; then
        log "Ejecutando seeders..."
        docker-compose exec -T app php artisan db:seed --force
        log "✅ Seeders ejecutados"
    fi
}

# Optimizar aplicación
optimize_app() {
    log "Optimizando aplicación..."
    
    docker-compose exec -T app php artisan config:cache
    docker-compose exec -T app php artisan route:cache
    docker-compose exec -T app php artisan view:cache
    
    log "✅ Aplicación optimizada"
}

# Mostrar información de despliegue
show_info() {
    echo ""
    echo -e "${BLUE}🎉 Despliegue completado exitosamente!${NC}"
    echo ""
    echo "📋 Información del despliegue:"
    echo "   • Ambiente: $ENVIRONMENT"
    echo "   • URL: http://localhost"
    echo "   • Usuario admin: admin@gepetto.com"
    echo "   • Password: password"
    echo ""
    echo "🔧 Comandos útiles:"
    echo "   • Ver logs: docker-compose logs -f"
    echo "   • Estado: docker-compose ps"
    echo "   • Detener: docker-compose down"
    echo ""
    
    # Mostrar estado de contenedores
    echo "📊 Estado de contenedores:"
    docker-compose ps
}

# Función principal
main() {
    echo ""
    log "Iniciando despliegue de Gepetto..."
    
    check_dependencies
    setup_environment
    build_images
    start_services
    wait_for_services
    run_migrations
    run_seeders
    optimize_app
    show_info
    
    echo ""
    log "🚀 Despliegue completado!"
}

# Manejo de errores
trap 'error "Despliegue fallido en línea $LINENO"' ERR

# Ejecutar función principal
main