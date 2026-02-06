# Solución: Formulario de MercadoPago no carga

## 🔍 Diagnóstico

El formulario de MercadoPago puede no cargar por varias razones. Sigue estos pasos para identificar el problema:

### 1. Abrir la Consola del Navegador

1. Presiona `F12` o `Ctrl+Shift+I` (Windows/Linux) o `Cmd+Option+I` (Mac)
2. Ve a la pestaña **Console**
3. Recarga la página del checkout
4. Busca los siguientes mensajes:

#### ✅ Si funciona correctamente verás:
```
Public Key: TEST-7e449f56-47d4-4cac-bc3f-8fbcae90161d
Inicializando MercadoPago...
MercadoPago inicializado correctamente
Payment form ready
```

#### ❌ Posibles errores:

**Error 1: Public Key no configurado**
```
Public Key: undefined
MercadoPago Public Key no configurado
```
**Solución:** Verificar configuración en el backend (ver sección Backend)

**Error 2: Bloqueador de anuncios**
```
POST https://api.mercadolibre.com/tracks
net::ERR_BLOCKED_BY_CLIENT
```
**Solución:** Desactivar bloqueador de anuncios (ver sección Bloqueadores)

**Error 3: SDK no carga**
```
Error al inicializar MercadoPago: [error details]
```
**Solución:** Verificar conexión a internet y CDN de MercadoPago

---

## 🛠️ Soluciones

### A. Bloqueador de Anuncios (Más Común)

Los bloqueadores de anuncios (AdBlock, uBlock Origin, etc.) bloquean el SDK de MercadoPago.

**Solución Rápida:**
1. Click en el icono del bloqueador de anuncios
2. Seleccionar "Desactivar en este sitio"
3. Recargar la página (F5)

**Alternativa - Modo Incógnito:**
```
Chrome: Ctrl+Shift+N
Firefox: Ctrl+Shift+P
```

**Alternativa - Agregar Excepción:**
En la configuración del bloqueador, agregar a la whitelist:
- `localhost` o tu dominio
- `*.mercadolibre.com`
- `*.mercadopago.com`

### B. Verificar Configuración Backend

**1. Verificar variables de entorno:**
```bash
cat .env | grep MERCADOPAGO
```

Debe mostrar:
```
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxx...
MERCADOPAGO_PUBLIC_KEY=TEST-xxxxx...
```

**2. Si no están configuradas:**
```bash
# Editar .env
nano .env

# Agregar:
MERCADOPAGO_ACCESS_TOKEN=tu_access_token
MERCADOPAGO_PUBLIC_KEY=tu_public_key

# Limpiar caché
php artisan config:clear
php artisan cache:clear
```

**3. Obtener credenciales de MercadoPago:**
- Ir a: https://www.mercadopago.com.ar/developers/panel
- Sección: "Tus credenciales"
- Copiar "Public Key" y "Access Token"
- Usar las de **TEST** para desarrollo

### C. Verificar Instalación del SDK

**1. Verificar que el paquete esté instalado:**
```bash
cat package.json | grep mercadopago
```

Debe mostrar:
```json
"@mercadopago/sdk-react": "^1.0.7"
```

**2. Si no está instalado:**
```bash
npm install @mercadopago/sdk-react
npm run build
```

### D. Problemas de Red/CDN

Si el SDK no carga por problemas de red:

**1. Verificar conectividad:**
```bash
curl -I https://sdk.mercadopago.com/js/v2
```

**2. Si falla, verificar:**
- Conexión a internet
- Firewall del servidor
- DNS configurado correctamente

---

## 🧪 Prueba Manual

Para verificar que todo funciona:

1. Ir a `/checkout` en el navegador
2. Abrir consola (F12)
3. Verificar logs:
   - ✅ "Public Key: TEST-..."
   - ✅ "Inicializando MercadoPago..."
   - ✅ "MercadoPago inicializado correctamente"
   - ✅ "Payment form ready"
4. El formulario debe aparecer con campos de tarjeta

---

## 📊 Mensajes en Pantalla

El componente ahora muestra diferentes estados:

### Estado 1: Cargando
```
🔄 Cargando formulario de pago...
Si no carga, desactiva tu bloqueador de anuncios
```

### Estado 2: Error de configuración
```
⚠️ Error de configuración
No se pudo cargar el sistema de pagos. Contacta al administrador.
```
**Causa:** Public Key no configurado en el backend

### Estado 3: Formulario cargado
```
[Formulario de tarjeta de MercadoPago visible]
```

---

## 🔧 Comandos Útiles

```bash
# Ver logs del servidor
tail -f storage/logs/laravel.log

# Limpiar caché
php artisan config:clear
php artisan cache:clear
php artisan view:clear

# Recompilar assets
npm run build

# Verificar configuración
php artisan tinker --execute="echo env('MERCADOPAGO_PUBLIC_KEY');"
```

---

## 📝 Checklist de Diagnóstico

- [ ] Abrir consola del navegador (F12)
- [ ] Verificar que aparezca "Public Key: TEST-..."
- [ ] Verificar que no haya errores ERR_BLOCKED_BY_CLIENT
- [ ] Desactivar bloqueador de anuncios si está activo
- [ ] Verificar que MERCADOPAGO_PUBLIC_KEY esté en .env
- [ ] Verificar que @mercadopago/sdk-react esté instalado
- [ ] Limpiar caché del navegador (Ctrl+Shift+Delete)
- [ ] Probar en modo incógnito
- [ ] Verificar conexión a internet

---

## 🎯 Solución Rápida (90% de los casos)

**El problema más común es el bloqueador de anuncios.**

1. Desactivar bloqueador de anuncios en el sitio
2. Recargar la página (F5)
3. ✅ El formulario debería cargar

Si después de esto no funciona, seguir el diagnóstico completo.

---

## 📞 Soporte

Si ninguna solución funciona:

1. Capturar screenshot de la consola (F12)
2. Copiar todos los mensajes de error
3. Verificar versión del navegador
4. Contactar al equipo de desarrollo con esta información

---

**Última actualización:** 2026-02-06
**Estado:** ✅ Implementado con logs y mejor feedback visual
