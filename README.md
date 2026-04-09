# EPOS-Final - Sistema de Gestión Comercial

Sistema integral de gestión comercial desarrollado con Laravel 12 y React, diseñado para empresas que requieren facturación electrónica AFIP, control de inventario y gestión completa de ventas.

## 🚀 Características Principales

### 📊 Dashboard y Administración
- Dashboard ejecutivo con métricas clave
- Sistema de roles y permisos (Superadmin, Admin, Usuario)
- Gestión de usuarios y configuración empresarial
- Log de actividades del sistema

### 👥 Gestión de Clientes
- CRUD completo de clientes
- Consulta automática de datos fiscales AFIP por CUIT
- Estado de cuenta detallado
- Exportación a Excel y PDF
- Gestión de condiciones IVA

### 📦 Gestión de Productos
- Catálogo de artículos con categorías y marcas
- Gestión de imágenes múltiples por producto
- Control de inventario en tiempo real
- Listas de precios diferenciadas
- Gestión de proveedores

### 🧾 Facturación Electrónica AFIP
- Integración completa con AFIP
- Autorización automática de facturas
- Generación de CAE
- Soporte para diferentes tipos de comprobantes
- Verificación de certificados digitales

### 💰 Gestión de Ventas
- Presupuestos y conversión a facturas
- Remitos de entrega
- Control de pagos y entregas
- Seguimiento de cuenta corriente

### 📋 Compras e Inventario
- Gestión de compras a proveedores
- Conversión automática de remitos a inventario
- Control de stock en tiempo real
- Movimientos de inventario

### 📈 Reportes y Exportaciones
- Estados de cuenta en PDF/Excel
- Facturas en PDF con formato AFIP
- Reportes de ventas y stock
- Exportaciones personalizables

## 🛠️ Stack Tecnológico

### Backend
- **Laravel 12** - Framework PHP
- **PHP 8.2+** - Lenguaje de programación
- **MySQL** - Base de datos
- **AFIP SDK** - Integración con servicios AFIP

### Frontend
- **React 19** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático
- **Inertia.js** - SPA sin API
- **Tailwind CSS 4** - Framework CSS
- **Radix UI** - Componentes accesibles
- **Lucide React** - Iconografía

### Herramientas de Desarrollo
- **Vite** - Build tool y dev server
- **ESLint** - Linting JavaScript/TypeScript
- **Prettier** - Formateo de código
- **Pest** - Testing framework PHP
- **Laravel Pint** - Code style fixer

## 📋 Dependencias Principales

### PHP (composer.json)
```json
{
  "require": {
    "php": "^8.2",
    "laravel/framework": "^12.0",
    "inertiajs/inertia-laravel": "^2.0",
    "afipsdk/afip.php": "^1.2",
    "barryvdh/laravel-dompdf": "^3.1",
    "maatwebsite/excel": "^3.1",
    "spatie/laravel-activitylog": "^4.10",
    "tightenco/ziggy": "^2.4"
  }
}
```

### Node.js (package.json)
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@inertiajs/react": "^2.1.0",
    "@tailwindcss/vite": "^4.1.11",
    "tailwindcss": "^4.0.0",
    "@radix-ui/react-*": "^1.x.x",
    "lucide-react": "^0.475.0",
    "typescript": "^5.7.2"
  }
}
```

## 🏗️ Arquitectura del Sistema

### Estructura de Directorios
```
epos-final/
├── app/
│   ├── Http/Controllers/     # Controladores de la aplicación
│   ├── Models/              # Modelos Eloquent
│   ├── Services/            # Servicios (AFIP, etc.)
│   └── Exports/             # Exportadores Excel/PDF
├── database/
│   ├── migrations/          # Migraciones de BD
│   └── seeders/            # Datos iniciales
├── resources/
│   ├── js/                 # Aplicación React
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/         # Páginas de la aplicación
│   │   └── layouts/       # Layouts principales
│   └── views/             # Vistas Blade (PDF)
└── routes/                # Definición de rutas
```

### Modelos Principales
- **User** - Usuarios del sistema
- **Cliente** - Clientes de la empresa
- **Articulo** - Productos/servicios
- **Factura** - Facturas de venta
- **Presupuesto** - Cotizaciones
- **Remito** - Remitos de entrega
- **Inventario** - Control de stock
- **Compra** - Compras a proveedores

## 🔐 Sistema de Roles

### Superadmin
- Acceso total al sistema
- Gestión de usuarios y roles
- Configuración empresarial
- Logs de actividad

### Admin
- Gestión de productos y categorías
- Control de inventario
- Gestión de proveedores
- Configuración de precios

### Usuario
- Gestión de clientes
- Creación de presupuestos y facturas
- Consulta de reportes básicos

## 🚦 Instalación

### Requisitos
- Docker
- Docker Compose
- Git

### Instalación
```bash
# Clonar repositorio
git clone https://github.com/FrancoDiCampli/geppeto.git
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

### Acceso
HTTP: http://localhost:APP_PORT 

HTTPS: https://localhost:3443 

**Credenciales**:
- Usuario: superadmin@mail.com
- Contraseña: asdf1234

## 📝 Historias de Usuario

### Epic: Gestión de Clientes
- **Como** vendedor **quiero** registrar nuevos clientes **para** poder facturarles
- **Como** vendedor **quiero** consultar datos AFIP por CUIT **para** completar automáticamente la información fiscal
- **Como** administrador **quiero** ver el estado de cuenta de un cliente **para** conocer su situación crediticia
- **Como** vendedor **quiero** exportar el estado de cuenta **para** enviárselo al cliente

### Epic: Gestión de Productos
- **Como** administrador **quiero** crear categorías y marcas **para** organizar el catálogo
- **Como** administrador **quiero** registrar artículos con imágenes **para** mostrar el catálogo
- **Como** administrador **quiero** gestionar múltiples listas de precios **para** diferentes tipos de clientes
- **Como** administrador **quiero** controlar el stock **para** evitar ventas sin inventario

### Epic: Facturación Electrónica
- **Como** vendedor **quiero** crear presupuestos **para** cotizar productos a clientes
- **Como** vendedor **quiero** convertir presupuestos en facturas **para** formalizar la venta
- **Como** sistema **quiero** autorizar facturas en AFIP **para** cumplir con la normativa
- **Como** vendedor **quiero** generar PDF de facturas **para** entregar al cliente

### Epic: Control de Pagos
- **Como** vendedor **quiero** registrar pagos de facturas **para** actualizar la cuenta corriente
- **Como** vendedor **quiero** programar entregas **para** coordinar la logística
- **Como** administrador **quiero** ver reportes de cobranzas **para** analizar el flujo de caja

### Epic: Gestión de Compras
- **Como** administrador **quiero** registrar proveedores **para** gestionar las compras
- **Como** administrador **quiero** crear órdenes de compra **para** solicitar mercadería
- **Como** administrador **quiero** recibir remitos **para** actualizar el inventario
- **Como** sistema **quiero** convertir remitos a inventario **para** actualizar el stock automáticamente

### Epic: Administración del Sistema
- **Como** superadmin **quiero** gestionar usuarios **para** controlar el acceso al sistema
- **Como** superadmin **quiero** configurar la empresa **para** personalizar facturas y reportes
- **Como** superadmin **quiero** ver logs de actividad **para** auditar las operaciones
- **Como** administrador **quiero** verificar certificados AFIP **para** asegurar la facturación

## 🔧 Comandos Útiles

### Desarrollo
```bash
# Servidor de desarrollo con hot reload
composer run dev

# Ejecutar tests
composer run test

# Formatear código
npm run format
php artisan pint

# Verificar certificados AFIP
php artisan afip:check-certificates
```

### Producción
```bash
# Build para producción
npm run build

# Optimizar aplicación
php artisan optimize
php artisan config:cache
php artisan route:cache
```

## 📊 Métricas del Proyecto

- **Líneas de código**: ~15,000 (PHP + TypeScript)
- **Modelos**: 15 entidades principales
- **Controladores**: 20 controladores
- **Migraciones**: 35 migraciones de base de datos
- **Componentes React**: 50+ componentes
- **Rutas**: 40+ endpoints

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte técnico o consultas:
- Crear issue en el repositorio
- Documentación en `/docs`
- Wiki del proyecto

---

**EPOS-Final** - Sistema de Gestión Comercial con Facturación Electrónica AFIP
