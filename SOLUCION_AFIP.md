# Solución: Consulta de Clientes AFIP no funciona en VPS

## Problema Identificado

La consulta de datos fiscales de clientes en AFIP no funcionaba en el VPS pero sí en local. Se identificaron los siguientes problemas:

### 1. **CUIT Incorrecto en Base de Datos**

El CUIT configurado en la tabla `initial_settings` (20123456789) no coincidía con el CUIT de los certificados AFIP (20349590418).

**Solución:**
```bash
php artisan tinker --execute="
\$setting = \App\Models\InitialSetting::first();
\$setting->cuit = '20349590418';
\$setting->save();
"
```

### 2. **Tokens AFIP Obsoletos**

Los tokens de autenticación guardados localmente estaban generados para un CUIT diferente, causando el error:
```
Este token no le permite actuar en representacion de la CUIT 20123456789
```

**Solución:**
```bash
php artisan afip:clear-tokens
php artisan cache:clear
php artisan config:clear
```

### 3. **Error "El CEE ya posee un TA valido"**

AFIP mantiene tokens activos por 12 horas en su servidor. Si se intenta generar un nuevo token antes de que expire el anterior, devuelve este error.

**Solución:**
- Esperar a que expire el token anterior (hasta 12 horas)
- O ejecutar `php artisan afip:clear-tokens` y esperar unos minutos antes de reintentar

### 4. **API Pública de AFIP no disponible**

La API pública `https://soa.afip.gob.ar/sr-padron/v2/persona/{cuit}` devuelve 404. Esta API no requiere autenticación pero parece estar deshabilitada o cambió de endpoint.

**Solución:**
El sistema ahora usa el WebService autenticado (ws_sr_padron_a5) como método principal.

## Cambios Realizados

### 1. **AfipService.php**
- Agregados logs detallados para diagnosticar problemas
- Cambiado el orden: primero intenta API pública, luego WebService autenticado
- Mejor manejo de errores con mensajes descriptivos

### 2. **AfipWebService.php**
- Mejorado el mensaje de error cuando AFIP ya tiene un token activo
- Validación automática de tokens al cambiar CUIT o ambiente

### 3. **Nuevo Comando Artisan**
```bash
php artisan afip:clear-tokens
```
Limpia todos los tokens locales y caché de AFIP.

## Verificación de Configuración

### 1. Verificar CUIT en Base de Datos
```bash
php artisan tinker --execute="
\$setting = \App\Models\InitialSetting::first();
echo 'CUIT: ' . \$setting->cuit . PHP_EOL;
"
```

### 2. Verificar CUIT en Certificados
```bash
openssl x509 -in storage/app/private/afip/cert.pem -noout -subject
```

### 3. Verificar Variables de Entorno
```bash
cat .env | grep AFIP
```

**Deben coincidir:**
- CUIT en `.env` (AFIP_CUIT)
- CUIT en `initial_settings` tabla
- CUIT en certificados AFIP

## Comandos Útiles

```bash
# Limpiar tokens y caché
php artisan afip:clear-tokens
php artisan cache:clear
php artisan config:clear

# Verificar certificados AFIP
php artisan afip:check-certificates

# Probar consulta AFIP
php artisan tinker --execute="
\$service = new \App\Services\AfipService();
\$result = \$service->consultarDatosFiscales('20276341828');
print_r(\$result);
"
```

## Logs para Diagnóstico

Los logs de AFIP se encuentran en `storage/logs/laravel.log`:

```bash
# Ver logs de AFIP en tiempo real
tail -f storage/logs/laravel.log | grep "AFIP:"

# Ver últimos 50 logs de AFIP
tail -100 storage/logs/laravel.log | grep "AFIP:"
```

## Notas Importantes

1. **Ambiente de Homologación**: El sistema está configurado para usar el ambiente de homologación de AFIP. Los CUIT de prueba pueden no existir en este ambiente.

2. **Tokens de 12 horas**: Los tokens de AFIP tienen una validez de 12 horas. El sistema los guarda en archivos y caché para reutilizarlos.

3. **Certificados**: Los certificados AFIP deben estar en `storage/app/private/afip/` con los nombres `cert.pem` y `key.pem`.

4. **Permisos**: Asegurarse de que el usuario `www-data` tenga permisos de lectura/escritura en `storage/app/private/afip/`.

## Solución Rápida

Si la consulta AFIP no funciona, ejecutar en orden:

```bash
# 1. Verificar que el CUIT sea correcto
php artisan tinker --execute="\$s = \App\Models\InitialSetting::first(); echo \$s->cuit;"

# 2. Si es incorrecto, actualizarlo
php artisan tinker --execute="\$s = \App\Models\InitialSetting::first(); \$s->cuit = '20349590418'; \$s->save();"

# 3. Limpiar tokens y caché
php artisan afip:clear-tokens
php artisan cache:clear
php artisan config:clear

# 4. Esperar 2-3 minutos y probar
```

## Estado Actual

✅ CUIT corregido en base de datos
✅ Tokens limpiados
✅ Logs agregados para diagnóstico
✅ Comando de limpieza creado
⚠️ API pública de AFIP no disponible (usando WebService autenticado)
⚠️ Puede requerir esperar si hay token activo en AFIP

## Próximos Pasos

1. Esperar a que expire el token actual en el servidor de AFIP (puede tomar hasta 12 horas desde la última generación)
2. Probar la consulta con un CUIT real que exista en el padrón de AFIP
3. Considerar implementar un sistema de cola para reintentos automáticos
