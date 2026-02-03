# 🔧 Solución: Access Denied MySQL

## Error
```
SQLSTATE[HY000] [1045] Access denied for user 'epos_user'@'localhost' (using password: YES)
```

## Solución Rápida

### 1. Conectar a MySQL como root
```bash
sudo mysql -u root -p
```

### 2. Verificar usuario existente
```sql
SELECT User, Host FROM mysql.user WHERE User = 'epos_user';
```

### 3. Eliminar usuario si existe (para recrearlo limpio)
```sql
DROP USER IF EXISTS 'epos_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Crear usuario nuevamente con contraseña
```sql
CREATE USER 'epos_user'@'localhost' IDENTIFIED BY '4411';
```

### 5. Otorgar TODOS los permisos
```sql
GRANT ALL PRIVILEGES ON epos_final.* TO 'epos_user'@'localhost';
FLUSH PRIVILEGES;
```

### 6. Verificar permisos
```sql
SHOW GRANTS FOR 'epos_user'@'localhost';
```

Deberías ver:
```
GRANT ALL PRIVILEGES ON `epos_final`.* TO `epos_user`@`localhost`
```

### 7. Salir de MySQL
```sql
EXIT;
```

### 8. Actualizar .env
```bash
nano /var/www/epos-final/.env
```

Asegúrate que tenga:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=epos_final
DB_USERNAME=epos_user
DB_PASSWORD=4411
```

### 9. Limpiar cache de Laravel
```bash
cd /var/www/epos-final
php artisan config:clear
php artisan cache:clear
```

### 10. Probar conexión
```bash
php artisan migrate
```

---

## Alternativa: Usar root temporalmente

Si sigues teniendo problemas, usa root temporalmente:

```bash
nano /var/www/epos-final/.env
```

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=epos_final
DB_USERNAME=root
DB_PASSWORD=tu_password_root_mysql
```

```bash
php artisan config:clear
php artisan migrate --seed
```

---

## Verificar que MySQL esté corriendo

```bash
sudo systemctl status mysql
```

Si no está corriendo:
```bash
sudo systemctl start mysql
sudo systemctl enable mysql
```

---

## Script Completo (Copiar y Pegar)

```bash
# Conectar a MySQL
sudo mysql -u root -p

# Dentro de MySQL, ejecutar:
DROP USER IF EXISTS 'epos_user'@'localhost';
CREATE USER 'epos_user'@'localhost' IDENTIFIED BY 'Password123!';
GRANT ALL PRIVILEGES ON epos_final.* TO 'epos_user'@'localhost';
FLUSH PRIVILEGES;
SHOW GRANTS FOR 'epos_user'@'localhost';
EXIT;

# Actualizar .env
cd /var/www/epos-final
nano .env
# Cambiar DB_PASSWORD=Password123!

# Limpiar y probar
php artisan config:clear
php artisan migrate
```

---

## ✅ Checklist

- [ ] MySQL está corriendo
- [ ] Base de datos `epos_final` existe
- [ ] Usuario `epos_user` creado correctamente
- [ ] Permisos otorgados con GRANT ALL
- [ ] FLUSH PRIVILEGES ejecutado
- [ ] .env tiene las credenciales correctas
- [ ] php artisan config:clear ejecutado
- [ ] Conexión probada con php artisan migrate

---

**Nota**: Reemplaza `Password123!` con una contraseña segura real.
