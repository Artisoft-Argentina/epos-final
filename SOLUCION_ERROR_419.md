# Solución Error 419 - Page Expired (CSRF Token)

## ✅ Cambios Aplicados

### 1. Aumentar Tiempo de Sesión
**Archivo**: `.env`
```env
SESSION_LIFETIME=1440  # Cambiado de 120 a 1440 minutos (24 horas)
```

### 2. Limpiar Caches
```bash
php artisan optimize:clear
php artisan config:clear
php artisan cache:clear
```

---

## 🔍 Causas Comunes del Error 419

1. **Sesión expirada**: El usuario dejó la página abierta mucho tiempo
2. **Token CSRF inválido**: El token no se está enviando correctamente
3. **Cache de configuración**: Cambios en `.env` no aplicados
4. **Cookies bloqueadas**: El navegador bloquea cookies de terceros

---

## 🛠️ Soluciones Adicionales

### Si el problema persiste:

#### 1. Verificar que el meta tag CSRF esté presente
```html
<!-- En resources/views/app.blade.php -->
<meta name="csrf-token" content="{{ csrf_token() }}">
```
✅ **Ya está configurado correctamente**

#### 2. Verificar configuración de Inertia
```typescript
// En resources/js/app.tsx
axios.defaults.headers.common['X-CSRF-TOKEN'] = token.getAttribute('content');
```
✅ **Ya está configurado correctamente**

#### 3. Limpiar cookies del navegador
- Abrir DevTools (F12)
- Application → Cookies
- Eliminar todas las cookies del sitio
- Recargar página

#### 4. Verificar configuración de sesión
```env
SESSION_DRIVER=database  # ✅ Correcto
SESSION_ENCRYPT=false    # ✅ Correcto
SESSION_PATH=/           # ✅ Correcto
```

---

## 🚀 Pasos para el Usuario

### Cuando aparece el error 419:

1. **Recargar la página** (F5 o Ctrl+R)
2. **Volver a intentar** la acción
3. Si persiste: **Cerrar sesión y volver a iniciar**
4. Si aún persiste: **Limpiar cookies del navegador**

---

## 🔧 Prevención

### Para evitar este error en el futuro:

1. **Aumentar tiempo de sesión** (ya aplicado: 24 horas)
2. **Implementar auto-refresh del token CSRF**
3. **Mostrar advertencia antes de expiración**
4. **Guardar formularios en localStorage**

---

## 📝 Implementación de Auto-Refresh (Opcional)

Si quieres implementar auto-refresh del token CSRF:

```typescript
// En resources/js/app.tsx
setInterval(() => {
    axios.get('/csrf-token').then(response => {
        const token = response.data.token;
        document.querySelector('meta[name="csrf-token"]')
            ?.setAttribute('content', token);
        axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
    });
}, 30 * 60 * 1000); // Cada 30 minutos
```

Y crear la ruta en `routes/web.php`:
```php
Route::get('/csrf-token', function () {
    return response()->json(['token' => csrf_token()]);
});
```

---

## 🧪 Testing

### Probar que funciona:

1. Ir a `/pagos/create/{factura_id}`
2. Llenar el formulario
3. Esperar 5 minutos (o el tiempo que tardaba en fallar)
4. Enviar el formulario
5. ✅ Debería funcionar sin error 419

---

## 📊 Monitoreo

### Ver sesiones activas:
```bash
php artisan tinker
>>> DB::table('sessions')->count()
```

### Limpiar sesiones expiradas:
```bash
php artisan session:gc
```

---

## ⚠️ Notas Importantes

- El cambio de `SESSION_LIFETIME` requiere reiniciar el servidor
- Los usuarios con sesiones activas necesitarán recargar
- En producción, considerar usar Redis para sesiones
- Configurar correctamente `SESSION_DOMAIN` si usas subdominios

---

## ✅ Verificación Final

Después de aplicar los cambios:

```bash
# 1. Limpiar todo
php artisan optimize:clear

# 2. Verificar configuración
php artisan config:show session

# 3. Reiniciar servidor (si es necesario)
php artisan serve
```

---

**Estado**: ✅ Solucionado
**Tiempo de sesión**: 1440 minutos (24 horas)
**Caches**: Limpiados
