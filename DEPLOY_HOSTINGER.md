# 🚀 Configuración de Deploy Automático a Hostinger VPS

## 📋 Resumen
Deploy automático desde GitHub (rama `dev`) a VPS Hostinger usando GitHub Actions.

---

## ⚙️ Configuración Inicial en el VPS

### 1. Conectar al VPS
```bash
ssh root@XXXX.XXX.XXXX
# Contraseña: 
```

### 2. Instalar dependencias necesarias
```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Git
apt install git -y

# Agregar repositorio de PHP
apt install software-properties-common -y
add-apt-repository ppa:ondrej/php -y
apt update

# Instalar PHP 8.3 y extensiones
apt install php8.3 php8.3-fpm php8.3-mysql php8.3-xml php8.3-mbstring php8.3-curl php8.3-zip php8.3-gd php8.3-bcmath -y

# Instalar Composer
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
chmod +x /usr/local/bin/composer

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install nodejs -y

# Instalar Nginx
apt install nginx -y

# Instalar MySQL
apt install mysql-server -y
```

### 3. Clonar el repositorio
```bash
# Crear directorio
mkdir -p /var/www
cd /var/www

# Clonar repositorio (necesitarás configurar SSH key o usar HTTPS con token)
git clone https://github.com/TU_USUARIO/epos-final.git
cd epos-final

# Cambiar a rama dev
git checkout dev
```

### 4. Configurar el proyecto
```bash
# Copiar .env
cp .env.example .env

# Editar .env con tus credenciales
nano .env

# Instalar dependencias
composer install --no-dev --optimize-autoloader
npm ci
npm run build

# Generar key
php artisan key:generate

# Ejecutar migraciones
php artisan migrate --seed

# Permisos
chown -R www-data:www-data /var/www/epos-final
chmod -R 775 storage bootstrap/cache
```

### 5. Configurar Nginx
```bash
nano /etc/nginx/sites-available/epos-final
```

Contenido del archivo:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/epos-final/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Activar sitio:
```bash
ln -s /etc/nginx/sites-available/epos-final /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 6. Copiar script de deploy
```bash
# Copiar deploy.sh al servidor
cd /var/www/epos-final
chmod +x deploy.sh
```

---

## 🔐 Configurar GitHub Secrets

### 1. Ir a tu repositorio en GitHub
```
Settings → Secrets and variables → Actions → New repository secret
```

### 2. Agregar los siguientes secrets:

**VPS_HOST**
```
TU_IP_VPS
```

**VPS_USER**
```
root
```

**VPS_PASSWORD**
```
TU_CONTRASEÑA_VPS
```

---

## 🎯 Uso del Deploy Automático

### Deploy automático
```bash
# Hacer cambios en tu código
git add .
git commit -m "feat: nueva funcionalidad"
git push origin dev

# GitHub Actions se ejecutará automáticamente
# Puedes ver el progreso en: GitHub → Actions
```

### Deploy manual desde el servidor
```bash
ssh root@XXX.XXXX
cd /var/www/epos-final
./deploy.sh
```

---

## 📊 Monitoreo del Deploy

### Ver logs de GitHub Actions
1. Ir a tu repositorio en GitHub
2. Click en "Actions"
3. Ver el workflow "Deploy to Hostinger VPS (Dev)"
4. Click en el último run para ver detalles

### Ver logs en el servidor
```bash
# Logs de Nginx
tail -f /var/log/nginx/error.log

# Logs de Laravel
tail -f /var/www/epos-final/storage/logs/laravel.log

# Logs de PHP-FPM
tail -f /var/log/php8.3-fpm.log
```

---

## 🔧 Comandos Útiles

### Reiniciar servicios
```bash
systemctl restart nginx
systemctl restart php8.3-fpm
systemctl restart mysql
```

### Verificar estado
```bash
systemctl status nginx
systemctl status php8.3-fpm
systemctl status mysql
```

### Limpiar caches manualmente
```bash
cd /var/www/epos-final
php artisan optimize:clear
```

### Ver procesos
```bash
ps aux | grep nginx
ps aux | grep php-fpm
```

---

## 🛡️ Seguridad

### 1. Configurar Firewall
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2. Instalar SSL con Let's Encrypt
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d artisoft-demo.store
```

### 3. Cambiar contraseña de root (Recomendado)
```bash
passwd root
# Actualizar GitHub Secret VPS_PASSWORD
```

### 4. Crear usuario específico para deploy (Más seguro)
```bash
adduser deployer
usermod -aG www-data deployer
# Configurar SSH key en lugar de password
```

---

## 🚨 Troubleshooting

### Error: Permission denied
```bash
chown -R www-data:www-data /var/www/epos-final
chmod -R 775 storage bootstrap/cache
```

### Error: Composer out of memory
```bash
php -d memory_limit=-1 /usr/local/bin/composer install
```

### Error: npm build fails
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Error: Database connection
```bash
# Verificar MySQL
systemctl status mysql

# Verificar credenciales en .env
nano /var/www/epos-final/.env
```

---

## 📝 Checklist de Deploy

- [ ] VPS configurado con PHP, Composer, Node, Nginx
- [ ] Repositorio clonado en `/var/www/epos-final`
- [ ] `.env` configurado correctamente
- [ ] Base de datos creada y migrada
- [ ] Nginx configurado y funcionando
- [ ] Permisos correctos en storage y bootstrap/cache
- [ ] GitHub Secrets configurados
- [ ] Workflow de GitHub Actions creado
- [ ] Script deploy.sh con permisos de ejecución
- [ ] SSL configurado (opcional pero recomendado)
- [ ] Firewall configurado

---

## 🎉 Resultado Final

Después de configurar todo:

1. **Haces push a `dev`** → GitHub Actions se ejecuta automáticamente
2. **El servidor descarga cambios** → Instala dependencias
3. **Compila assets** → Ejecuta migraciones
4. **Limpia caches** → Optimiza aplicación
5. **✅ Aplicación actualizada** → Sin downtime

---

## 📞 Soporte

**Conexión SSH:**
```bash
ssh root@xxxxxx
```

**Ubicación del proyecto:**
```
/var/www/epos-final
```

**Logs importantes:**
- Laravel: `/var/www/epos-final/storage/logs/laravel.log`
- Nginx: `/var/log/nginx/error.log`
- PHP-FPM: `/var/log/php8.2-fpm.log`

---

## ⚠️ Notas Importantes

1. **Nunca commitear credenciales** al repositorio
2. **Usar GitHub Secrets** para información sensible
3. **Hacer backup** antes de cada deploy importante
4. **Probar en local** antes de hacer push a dev
5. **Monitorear logs** después de cada deploy

---

**Estado**: ✅ Configuración lista para usar
**Rama de deploy**: `dev`
**Servidor**: Hostinger VPS
