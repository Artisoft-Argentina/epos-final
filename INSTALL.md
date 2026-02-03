# Instalación EPOS-Final

## Requisitos
- Docker
- Docker Compose
- Git

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/epos-final.git
cd epos-final

# Construir y levantar contenedores
docker-compose up -d --build

# Generar clave de aplicación
docker exec epos-final-app php artisan key:generate

# Ejecutar migraciones y seeders
docker exec epos-final-app php artisan migrate --seed

# Limpiar cache
docker exec epos-final-app php artisan config:clear
docker exec epos-final-app php artisan cache:clear
```

## Acceso

**URL**: https://localhost:3443

**Credenciales por defecto**:
- Usuario: superadmin@mail.com
- Contraseña: asdf1234
