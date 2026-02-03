# 🚀 Pasos Rápidos para Configurar Deploy Automático

## 1️⃣ En GitHub (5 minutos)

### Agregar Secrets
1. Ve a tu repositorio en GitHub
2. `Settings` → `Secrets and variables` → `Actions`
3. Click en `New repository secret`
4. Agregar estos 3 secrets:

```
Nombre: VPS_HOST
Valor: TU_IP_VPS

Nombre: VPS_USER  
Valor: root

Nombre: VPS_PASSWORD
Valor: TU_CONTRASEÑA
```

### Subir archivos
```bash
cd /Users/francodicampli/proyectos/artisoft/epos-final

git add .github/workflows/deploy-dev.yml
git add deploy.sh
git add DEPLOY_HOSTINGER.md
git commit -m "feat: configurar deploy automático a Hostinger"
git push origin dev
```

---

## 2️⃣ En el VPS (15 minutos)

### Conectar al servidor
```bash
ssh root@TU_IP_VPS
# Usar tu contraseña
```

### Instalar todo lo necesario
```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Git
apt install git -y

# Agregar repositorio de PHP
apt install software-properties-common -y
add-apt-repository ppa:ondrej/php -y
apt update

# Instalar PHP 8.3
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

### Configurar MySQL
```bash
mysql -u root -p

# Dentro de MySQL:
CREATE DATABASE epos-final;
CREATE USER 'epos-final_user'@'localhost' IDENTIFIED BY 'epos-final_password';
GRANT ALL PRIVILEGES ON epos-final.* TO 'epos-final_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Clonar proyecto
```bash
cd /var/www
git clone https://github.com/TU_USUARIO/epos-final.git
cd epos-final
git checkout dev
```

### Configurar proyecto
```bash
# Copiar .env
cp .env.example .env

# Editar .env (ajustar DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD)
nano .env

# Instalar dependencias
composer install --no-dev --optimize-autoloader
npm ci
npm run build

# Generar key
php artisan key:generate

# Migrar base de datos
php artisan migrate --seed

# Permisos
chown -R www-data:www-data /var/www/epos-final
chmod -R 775 storage bootstrap/cache

# Hacer ejecutable el script de deploy
chmod +x deploy.sh
```

### Configurar Nginx
```bash
nano /etc/nginx/sites-available/epos-final
```

Pegar esto:
```nginx
server {
    listen 80;
    server_name TU_IP_VPS;
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
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl restart php8.3-fpm
```

---

## 3️⃣ Probar Deploy (2 minutos)

### Desde tu computadora
```bash
# Hacer un cambio pequeño
echo "# Deploy test" >> README.md
git add README.md
git commit -m "test: probar deploy automático"
git push origin dev
```

### Ver el progreso
1. Ve a GitHub → Actions
2. Verás el workflow ejecutándose
3. Espera a que termine (2-3 minutos)
4. Visita: http://TU_IP_VPS

---

## ✅ Verificación Final

### En el navegador
```
http://TU_IP_VPS
```

Deberías ver tu aplicación funcionando.

### En el servidor
```bash
ssh root@TU_IP_VPS
cd /var/www/epos-final
git log -1  # Ver último commit
```

---

## 🎉 ¡Listo!

Ahora cada vez que hagas `git push origin dev`, tu aplicación se actualizará automáticamente en el servidor.

---

## 🔥 Comandos Útiles

### Ver logs en tiempo real
```bash
# Laravel
tail -f /var/www/epos-final/storage/logs/laravel.log

# Nginx
tail -f /var/log/nginx/error.log
```

### Deploy manual
```bash
ssh root@TU_IP_VPS
cd /var/www/epos-final
./deploy.sh
```

### Reiniciar servicios
```bash
systemctl restart nginx
systemctl restart php8.3-fpm
```

---

**Tiempo total**: ~20 minutos
**Resultado**: Deploy automático funcionando ✅
