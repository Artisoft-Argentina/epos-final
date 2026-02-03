# 🗄️ Configuración de MySQL en VPS Hostinger

## 📋 Pasos para Configurar la Base de Datos

### 1. Conectar al VPS
```bash
ssh root@TU_IP_VPS
```

### 2. Asegurar MySQL (Primera vez)
```bash
mysql_secure_installation
```

Responder:
- **Set root password?** → Y (Sí, crear contraseña segura)
- **Remove anonymous users?** → Y
- **Disallow root login remotely?** → Y
- **Remove test database?** → Y
- **Reload privilege tables?** → Y

### 3. Conectar a MySQL
```bash
mysql -u root -p
# Ingresar la contraseña que creaste
```

### 4. Crear Base de Datos y Usuario
```sql
-- Crear base de datos
CREATE DATABASE epos_final CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario
CREATE USER 'epos_user'@'localhost' IDENTIFIED BY 'TU_CONTRASEÑA_SEGURA';

-- Dar permisos
GRANT ALL PRIVILEGES ON epos_final.* TO 'epos_user'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar
SHOW DATABASES;

-- Salir
EXIT;
```

### 5. Configurar .env en el Servidor
```bash
cd /var/www/epos-final
nano .env
```

Actualizar estas líneas:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=epos_final
DB_USERNAME=epos_user
DB_PASSWORD=TU_CONTRASEÑA_SEGURA
```

Guardar: `Ctrl+O`, Enter, `Ctrl+X`

### 6. Ejecutar Migraciones
```bash
cd /var/www/epos-final
php artisan migrate --seed
```

---

## ✅ Verificar Configuración

### Probar conexión
```bash
php artisan tinker
>>> DB::connection()->getPdo();
>>> exit
```

Si no hay errores, ¡la conexión funciona! ✅

### Ver tablas creadas
```bash
mysql -u epos_user -p epos_final
```

```sql
SHOW TABLES;
EXIT;
```

---

## 🔐 Seguridad Adicional

### Cambiar puerto MySQL (Opcional)
```bash
nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Cambiar:
```ini
port = 3307
```

Reiniciar:
```bash
systemctl restart mysql
```

Actualizar `.env`:
```env
DB_PORT=3307
```

### Backup de Base de Datos
```bash
# Crear backup
mysqldump -u epos_user -p epos_final > backup_$(date +%Y%m%d).sql

# Restaurar backup
mysql -u epos_user -p epos_final < backup_20240203.sql
```

---

## 🚨 Troubleshooting

### Error: Access denied
```bash
# Resetear contraseña de root
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'nueva_contraseña';
FLUSH PRIVILEGES;
EXIT;
```

### Error: Can't connect to MySQL server
```bash
# Verificar que MySQL esté corriendo
systemctl status mysql

# Iniciar MySQL
systemctl start mysql

# Habilitar inicio automático
systemctl enable mysql
```

### Error: Too many connections
```bash
nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Agregar:
```ini
max_connections = 200
```

Reiniciar:
```bash
systemctl restart mysql
```

---

## 📊 Comandos Útiles

### Ver usuarios
```sql
SELECT User, Host FROM mysql.user;
```

### Ver bases de datos
```sql
SHOW DATABASES;
```

### Ver tamaño de base de datos
```sql
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'epos_final'
GROUP BY table_schema;
```

### Optimizar tablas
```sql
USE epos_final;
OPTIMIZE TABLE users, clientes, articulos, facturas;
```

---

## 🔄 Migrar desde Local

### 1. Exportar desde local
```bash
# En tu computadora local
mysqldump -u gepetto_user -p gepetto > epos_local.sql
```

### 2. Subir al VPS
```bash
scp epos_local.sql root@TU_IP_VPS:/tmp/
```

### 3. Importar en VPS
```bash
# En el VPS
mysql -u epos_user -p epos_final < /tmp/epos_local.sql
rm /tmp/epos_local.sql
```

---

## ✅ Resumen Rápido

```bash
# 1. Conectar a MySQL
mysql -u root -p

# 2. Crear todo
CREATE DATABASE epos_final CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'epos_user'@'localhost' IDENTIFIED BY 'password_seguro';
GRANT ALL PRIVILEGES ON epos_final.* TO 'epos_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 3. Configurar .env
nano /var/www/epos-final/.env
# Actualizar DB_DATABASE, DB_USERNAME, DB_PASSWORD

# 4. Migrar
cd /var/www/epos-final
php artisan migrate --seed
```

---

**Estado**: ✅ Base de datos configurada
**Nombre DB**: epos_final
**Usuario**: epos_user
