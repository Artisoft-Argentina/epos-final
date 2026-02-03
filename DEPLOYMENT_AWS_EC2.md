# Guía de Despliegue AWS EC2 - Sistema EPOS-Final

## 🚀 Configuración de Instancia EC2

### 1. Crear Instancia EC2
```bash
# Especificaciones mínimas recomendadas
- Tipo: t3.medium (2 vCPU, 4 GB RAM)
- OS: Ubuntu 22.04 LTS
- Storage: 20 GB SSD
- Security Group: HTTP (80), HTTPS (443), SSH (22)
```

### 2. Conectar a la Instancia
```bash
ssh -i "tu-key.pem" ubuntu@tu-ip-publica
```

## 📦 Instalación de Dependencias

### 3. Actualizar Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 4. Instalar PHP 8.2
```bash
sudo apt install software-properties-common -y
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install php8.2 php8.2-fpm php8.2-mysql php8.2-xml php8.2-curl php8.2-zip php8.2-mbstring php8.2-gd php8.2-intl php8.2-bcmath -y
```

### 5. Instalar Composer
```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

### 6. Instalar Node.js (Última Versión LTS)
```bash
# Instalar Node Version Manager (NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Instalar la última versión LTS de Node.js
nvm install --lts
nvm use --lts
nvm alias default node

# Verificar instalación
node --version
npm --version
```

### 7. Instalar Cliente MySQL (para conexión a RDS)
```bash
sudo apt install mysql-client -y
```

### 8. Instalar Nginx
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
```

## 🗄️ Configuración de AWS RDS

### 9. Crear Instancia RDS MySQL
```bash
# En AWS Console o CLI:
# - Engine: MySQL 8.0
# - Instance Class: db.t3.micro (Free Tier) o db.t3.small
# - Storage: 20 GB SSD
# - Multi-AZ: No (para desarrollo) / Yes (para producción)
# - VPC Security Group: Permitir puerto 3306 desde EC2
```

### 10. Configurar Security Group para RDS
```bash
# Crear regla de entrada:
# - Type: MySQL/Aurora (3306)
# - Source: Security Group de la instancia EC2
# - Description: "EC2 to RDS MySQL access"
```

### 11. Crear Base de Datos en RDS
```bash
# Conectar a RDS desde EC2
mysql -h tu-rds-endpoint.region.rds.amazonaws.com -u admin -p
```

```sql
CREATE DATABASE epos-final_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'epos-final_user'@'%' IDENTIFIED BY 'tu_password_seguro';
GRANT ALL PRIVILEGES ON epos-final_db.* TO 'epos-final_user'@'%';
FLUSH PRIVILEGES;
EXIT;
```

## 📁 Despliegue del Proyecto

### 12. Clonar Repositorio
```bash
cd /var/www
sudo git clone https://github.com/tu-usuario/epos-final-clean.git
sudo chown -R www-data:www-data epos-final-clean
cd epos-final-clean
```

### 13. Instalar Dependencias PHP
```bash
sudo -u www-data composer install --no-dev --optimize-autoloader
```

### 14. Configurar Variables de Entorno
```bash
sudo -u www-data cp .env.example .env
sudo -u www-data nano .env
```

```env
APP_NAME="EPOS-Final"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://tu-dominio.com

# Configuración RDS MySQL
DB_CONNECTION=mysql
DB_HOST=tu-rds-endpoint.region.rds.amazonaws.com
DB_PORT=3306
DB_DATABASE=epos-final_db
DB_USERNAME=epos-final_user
DB_PASSWORD=tu_password_seguro

# AFIP Configuración
AFIP_CUIT=20349590418
AFIP_ENVIRONMENT=produccion
AFIP_CERTIFICATE_PATH=storage/app/private/afip/cert.pem
AFIP_KEY_PATH=storage/app/private/afip/key.pem

# Configuración de correo
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=tu-app-password
MAIL_ENCRYPTION=tls
```

### 15. Generar Clave de Aplicación
```bash
sudo -u www-data php artisan key:generate
```

### 16. Instalar Dependencias Node.js y Compilar Assets
```bash
sudo -u www-data npm install
sudo -u www-data npm run build
```

### 17. Ejecutar Migraciones
```bash
sudo -u www-data php artisan migrate --force
sudo -u www-data php artisan db:seed --force
```

### 18. Configurar Permisos
```bash
sudo chown -R www-data:www-data /var/www/epos-final-clean
sudo chmod -R 755 /var/www/epos-final-clean
sudo chmod -R 775 /var/www/epos-final-clean/storage
sudo chmod -R 775 /var/www/epos-final-clean/bootstrap/cache
```

### 19. Optimizar Laravel
```bash
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache
```

## 🌐 Configuración de Nginx

### 20. Crear Configuración de Sitio
```bash
sudo nano /etc/nginx/sites-available/epos-final
```

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    root /var/www/epos-final-clean/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }

    client_max_body_size 100M;
}
```

### 21. Habilitar Sitio
```bash
sudo ln -s /etc/nginx/sites-available/epos-final /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Configuración SSL con Let's Encrypt

### 22. Instalar Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 23. Obtener Certificado SSL
```bash
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

## 📋 Configuración de Certificados AFIP

### 24. Subir Certificados AFIP
```bash
sudo mkdir -p /var/www/epos-final-clean/storage/app/private/afip
sudo chown www-data:www-data /var/www/epos-final-clean/storage/app/private/afip
```

Subir archivos `cert.pem` y `key.pem` a la carpeta `/var/www/epos-final-clean/storage/app/private/afip/`

### 25. Verificar Certificados
```bash
sudo -u www-data php artisan afip:check-certificates
```

## ⚙️ Configuración de Servicios

### 26. Configurar Queue Worker (Opcional)
```bash
sudo nano /etc/systemd/system/epos-final-worker.service
```

```ini
[Unit]
Description=EPOS-Final Queue Worker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/epos-final-clean
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable epos-final-worker
sudo systemctl start epos-final-worker
```

### 27. Configurar Cron Jobs
```bash
sudo crontab -e
```

```cron
# Laravel Scheduler
* * * * * cd /var/www/epos-final-clean && php artisan schedule:run >> /dev/null 2>&1

# Backup diario a las 2 AM
0 2 * * * cd /var/www/epos-final-clean && php artisan backup:run >> /var/log/epos-final-backup.log 2>&1
```

## 🔧 Configuración de Firewall

### 28. Configurar UFW
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 📊 Monitoreo y Logs

### 29. Configurar Logs
```bash
sudo mkdir -p /var/log/epos-final
sudo chown www-data:www-data /var/log/epos-final
```

### 30. Rotar Logs
```bash
sudo nano /etc/logrotate.d/epos-final
```

```
/var/www/epos-final-clean/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 644 www-data www-data
}
```

## 🚀 Script de Despliegue Automático

### 31. Crear Script de Deploy
```bash
sudo nano /var/www/deploy-epos-final.sh
```

```bash
#!/bin/bash
cd /var/www/epos-final-clean

# Modo mantenimiento
sudo -u www-data php artisan down

# Actualizar código
sudo -u www-data git pull origin main

# Instalar dependencias
sudo -u www-data composer install --no-dev --optimize-autoloader

# Compilar assets
sudo -u www-data npm ci
sudo -u www-data npm run build

# Ejecutar migraciones
sudo -u www-data php artisan migrate --force

# Limpiar y optimizar cache
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache

# Salir de mantenimiento
sudo -u www-data php artisan up

echo "Despliegue completado exitosamente"
```

```bash
sudo chmod +x /var/www/deploy-epos-final.sh
```

## 🔍 Verificación Final

### 32. Verificar Servicios
```bash
# Verificar Nginx
sudo systemctl status nginx

# Verificar PHP-FPM
sudo systemctl status php8.2-fpm

# Verificar conexión a RDS
mysql -h tu-rds-endpoint.region.rds.amazonaws.com -u epos-final_user -p -e "SELECT 1;"

# Verificar aplicación
curl -I https://tu-dominio.com
```

### 33. Verificar Logs
```bash
# Logs de Laravel
tail -f /var/www/epos-final-clean/storage/logs/laravel.log

# Logs de Nginx
tail -f /var/log/nginx/error.log

# Logs del sistema
tail -f /var/log/syslog
```

## 🛡️ Seguridad Adicional

### 34. Configuraciones de Seguridad
```bash
# Ocultar versión de Nginx
sudo nano /etc/nginx/nginx.conf
# Agregar: server_tokens off;

# Configurar fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

## 📋 Checklist de Despliegue

- [ ] Instancia EC2 configurada
- [ ] Dependencias instaladas (PHP, MySQL Client, Nginx, Node.js)
- [ ] RDS MySQL creada y configurada
- [ ] Security Groups configurados para RDS
- [ ] Código clonado y dependencias instaladas
- [ ] Variables de entorno configuradas
- [ ] Migraciones ejecutadas
- [ ] Assets compilados
- [ ] Nginx configurado
- [ ] SSL configurado
- [ ] Certificados AFIP subidos
- [ ] Permisos configurados
- [ ] Servicios habilitados
- [ ] Firewall configurado
- [ ] Logs configurados
- [ ] Verificación final completada

## 🆘 Troubleshooting

### Problemas Comunes

**Error 500**:
```bash
# Verificar logs
tail -f /var/www/epos-final-clean/storage/logs/laravel.log
# Verificar permisos
sudo chown -R www-data:www-data /var/www/epos-final-clean
```

**Error de Base de Datos RDS**:
```bash
# Verificar conexión a RDS
mysql -h tu-rds-endpoint.region.rds.amazonaws.com -u epos-final_user -p

# Verificar desde Laravel
sudo -u www-data php artisan tinker
# DB::connection()->getPdo();

# Verificar Security Groups
# Asegurar que el SG de RDS permite conexiones desde EC2
```

**Error de AFIP**:
```bash
# Verificar certificados
sudo -u www-data php artisan afip:check-certificates
```

---

**Tiempo estimado de despliegue**: 2-3 horas  
**Última actualización**: Diciembre 2024