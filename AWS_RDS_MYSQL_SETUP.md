# Guía de Configuración AWS RDS MySQL

## 🎯 Configuración de RDS MySQL para Sistema EPOS-Final

### Requisitos Previos
- Cuenta AWS activa
- VPC configurada (o usar VPC por defecto)
- Instancia EC2 creada (para conectividad)

---

## 🚀 Creación de Instancia RDS

### 1. Acceder a RDS Console
```bash
# Navegar a: AWS Console > RDS > Databases > Create database
```

### 2. Configuración del Motor
```yaml
Database creation method: Standard create
Engine type: MySQL
Engine Version: MySQL 8.0.35 (o la más reciente)
Templates: 
  - Production (para producción)
  - Dev/Test (para desarrollo)
  - Free tier (para pruebas)
```

### 3. Configuración de Credenciales
```yaml
DB instance identifier: epos-final-mysql-db
Master username: admin
Master password: TuPasswordSeguro123!
Confirm password: TuPasswordSeguro123!
```

### 4. Configuración de Instancia
```yaml
# Para Free Tier
DB instance class: db.t3.micro
Storage type: General Purpose SSD (gp2)
Allocated storage: 20 GB
Storage autoscaling: Enable (máximo 100 GB)

# Para Producción
DB instance class: db.t3.small o db.t3.medium
Storage type: General Purpose SSD (gp3)
Allocated storage: 100 GB
Storage autoscaling: Enable (máximo 1000 GB)
```

### 5. Configuración de Conectividad
```yaml
Virtual private cloud (VPC): Default VPC o tu VPC personalizada
DB subnet group: default
Public access: No (recomendado para seguridad)
VPC security groups: Create new
  - Name: epos-final-rds-sg
  - Description: Security group for EPOS-Final RDS MySQL
Availability Zone: No preference
Database port: 3306
```

### 6. Configuración Adicional
```yaml
Database options:
  Initial database name: epos-final_db
  DB parameter group: default.mysql8.0
  Option group: default:mysql-8-0

Backup:
  Backup retention period: 7 days
  Backup window: 03:00-04:00 UTC
  Copy tags to snapshots: Yes

Monitoring:
  Enable Enhanced monitoring: Yes (para producción)
  Monitoring Role: rds-monitoring-role
  Granularity: 60 seconds

Maintenance:
  Enable auto minor version upgrade: Yes
  Maintenance window: sun:04:00-sun:05:00 UTC

Deletion protection: Enable (para producción)
```

---

## 🔐 Configuración de Security Groups

### 7. Crear Security Group para RDS
```bash
# En EC2 Console > Security Groups > Create security group
```

```yaml
Security group name: epos-final-rds-sg
Description: MySQL access for EPOS-Final application
VPC: Seleccionar la misma VPC que EC2

Inbound rules:
  Type: MySQL/Aurora
  Protocol: TCP
  Port range: 3306
  Source: Custom (Security Group de EC2)
  Description: EC2 to RDS MySQL access

Outbound rules: (mantener por defecto)
  Type: All traffic
  Protocol: All
  Port range: All
  Destination: 0.0.0.0/0
```

### 8. Configurar Security Group de EC2
```bash
# Agregar regla outbound en SG de EC2 si es necesario
```

```yaml
Outbound rule:
  Type: MySQL/Aurora
  Protocol: TCP
  Port range: 3306
  Destination: Security Group de RDS
  Description: EC2 to RDS MySQL connection
```

---

## 🗄️ Configuración de Base de Datos

### 9. Obtener Endpoint de RDS
```bash
# En RDS Console > Databases > epos-final-mysql-db > Connectivity & security
# Copiar el Endpoint: epos-final-mysql-db.xxxxxxxxx.region.rds.amazonaws.com
```

### 10. Conectar desde EC2
```bash
# Instalar cliente MySQL en EC2
sudo apt update
sudo apt install mysql-client -y

# Conectar a RDS
mysql -h epos-final-mysql-db.xxxxxxxxx.region.rds.amazonaws.com -u admin -p
```

### 11. Crear Base de Datos y Usuario
```sql
-- Crear base de datos
CREATE DATABASE epos-final_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario específico para la aplicación
CREATE USER 'epos-final_user'@'%' IDENTIFIED BY 'EPOS-FinalPassword123!';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON epos-final_db.* TO 'epos-final_user'@'%';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar creación
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User = 'epos-final_user';

-- Salir
EXIT;
```

### 12. Verificar Conexión con Usuario de Aplicación
```bash
mysql -h epos-final-mysql-db.xxxxxxxxx.region.rds.amazonaws.com -u epos-final_user -p epos-final_db
```

```sql
-- Verificar acceso
SELECT DATABASE();
SELECT USER();
SHOW TABLES;
EXIT;
```

---

## ⚙️ Configuración Avanzada

### 13. Configurar Parameter Group (Opcional)
```bash
# En RDS Console > Parameter groups > Create parameter group
```

```yaml
Parameter group family: mysql8.0
Group name: epos-final-mysql-params
Description: Custom parameters for EPOS-Final MySQL

Parámetros recomendados:
  innodb_buffer_pool_size: 75% de RAM disponible
  max_connections: 200
  slow_query_log: 1
  long_query_time: 2
  general_log: 0 (para producción)
```

### 14. Aplicar Parameter Group
```bash
# En RDS Console > Databases > epos-final-mysql-db > Modify
# DB parameter group: epos-final-mysql-params
# Apply immediately: Yes (requiere reinicio)
```

### 15. Configurar Subnet Group (Si es necesario)
```bash
# En RDS Console > Subnet groups > Create DB subnet group
```

```yaml
Name: epos-final-subnet-group
Description: Subnet group for EPOS-Final RDS
VPC: Tu VPC
Availability Zones: Seleccionar al menos 2 AZ
Subnets: Seleccionar subnets privadas en cada AZ
```

---

## 📊 Monitoreo y Mantenimiento

### 16. Configurar CloudWatch Alarms
```bash
# En CloudWatch Console > Alarms > Create alarm
```

```yaml
Alarmas recomendadas:
1. CPU Utilization > 80%
2. Database Connections > 80% de max_connections
3. Free Storage Space < 2 GB
4. Read Latency > 0.2 seconds
5. Write Latency > 0.2 seconds
```

### 17. Configurar Backups Automáticos
```yaml
Backup retention: 7 días (mínimo recomendado)
Backup window: Horario de menor actividad
Point-in-time recovery: Habilitado automáticamente
Manual snapshots: Crear antes de cambios importantes
```

### 18. Configurar Enhanced Monitoring
```yaml
Enable Enhanced Monitoring: Yes
Monitoring Role: rds-monitoring-role
Granularity: 60 seconds
Metrics disponibles:
  - OS processes
  - RDS processes  
  - Memory usage
  - File system usage
```

---

## 🔧 Optimización de Performance

### 19. Configuraciones de Performance
```sql
-- Conectar como admin y ejecutar:
SET GLOBAL innodb_buffer_pool_size = 1073741824; -- 1GB para t3.small
SET GLOBAL max_connections = 200;
SET GLOBAL innodb_log_file_size = 268435456; -- 256MB
SET GLOBAL query_cache_size = 67108864; -- 64MB
```

### 20. Índices Recomendados para EPOS-Final
```sql
-- Usar la base de datos
USE epos-final_db;

-- Índices para optimizar consultas frecuentes
CREATE INDEX idx_clientes_documentounico ON clientes(documentounico);
CREATE INDEX idx_clientes_razonsocial ON clientes(razonsocial);
CREATE INDEX idx_facturas_fecha ON facturas(fecha);
CREATE INDEX idx_facturas_cliente_id ON facturas(cliente_id);
CREATE INDEX idx_articulos_codarticulo ON articulos(codarticulo);
CREATE INDEX idx_inventario_articulo_id ON inventario(articulo_id);
```

---

## 🛡️ Seguridad y Mejores Prácticas

### 21. Configuraciones de Seguridad
```yaml
Encryption:
  Encryption at rest: Enable
  AWS KMS key: Default o custom key
  
Network Security:
  Public accessibility: No
  VPC Security Groups: Restrictivo
  SSL/TLS: Force SSL connections

Access Control:
  IAM database authentication: Enable (opcional)
  Master user password: Rotar cada 90 días
  Application user: Permisos mínimos necesarios
```

### 22. Rotación de Passwords
```sql
-- Cambiar password del usuario de aplicación
ALTER USER 'epos-final_user'@'%' IDENTIFIED BY 'NuevoPasswordSeguro123!';
FLUSH PRIVILEGES;
```

### 23. Configurar SSL/TLS
```bash
# Descargar certificado SSL de AWS
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# En Laravel .env agregar:
DB_SSL_MODE=REQUIRED
DB_SSL_CERT=/path/to/global-bundle.pem
```

---

## 🔍 Verificación y Testing

### 24. Test de Conectividad
```bash
# Desde EC2, probar conexión
mysql -h epos-final-mysql-db.xxxxxxxxx.region.rds.amazonaws.com -u epos-final_user -p -e "SELECT 1 as test;"

# Test de latencia
time mysql -h epos-final-mysql-db.xxxxxxxxx.region.rds.amazonaws.com -u epos-final_user -p -e "SELECT 1;"
```

### 25. Test de Performance
```sql
-- Test básico de escritura
CREATE TABLE test_performance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos de prueba
INSERT INTO test_performance (data) VALUES 
('test1'), ('test2'), ('test3'), ('test4'), ('test5');

-- Verificar
SELECT COUNT(*) FROM test_performance;

-- Limpiar
DROP TABLE test_performance;
```

---

## 📋 Checklist de Configuración

- [ ] Instancia RDS MySQL creada
- [ ] Security Groups configurados
- [ ] Conectividad EC2-RDS verificada
- [ ] Base de datos `epos-final_db` creada
- [ ] Usuario `epos-final_user` creado con permisos
- [ ] Parameter Group configurado (opcional)
- [ ] Backups automáticos habilitados
- [ ] Enhanced Monitoring configurado
- [ ] CloudWatch Alarms creadas
- [ ] SSL/TLS configurado
- [ ] Índices de performance aplicados
- [ ] Tests de conectividad exitosos

---

## 💰 Estimación de Costos

### Free Tier (12 meses)
```yaml
db.t3.micro: $0/mes
Storage 20GB: $0/mes
Backup storage: 20GB gratis
Total: $0/mes (primer año)
```

### Producción Básica
```yaml
db.t3.small: ~$25/mes
Storage 100GB: ~$10/mes
Backup storage: ~$5/mes
Enhanced Monitoring: ~$3/mes
Total: ~$43/mes
```

### Producción Avanzada
```yaml
db.t3.medium: ~$50/mes
Storage 500GB: ~$50/mes
Multi-AZ: +100% del costo de instancia
Backup storage: ~$15/mes
Total: ~$165/mes
```

---

**Tiempo estimado de configuración**: 30-45 minutos  
**Última actualización**: Diciembre 2024