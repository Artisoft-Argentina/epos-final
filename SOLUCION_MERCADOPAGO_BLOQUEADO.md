# Solución: MercadoPago Bloqueado por AdBlocker

## ❌ Error
```
POST https://api.mercadolibre.com/tracks
net::ERR_BLOCKED_BY_CLIENT
```

## 🔍 Causa
Los bloqueadores de anuncios (AdBlock, uBlock Origin, etc.) bloquean peticiones que contienen "tracks" en la URL porque asumen que son trackers de publicidad.

---

## ✅ Soluciones para el Usuario

### Opción 1: Desactivar Bloqueador (Recomendado)
1. Click en el icono del bloqueador de anuncios
2. Seleccionar "Desactivar en este sitio"
3. Recargar la página (F5)

### Opción 2: Modo Incógnito
```
Chrome: Ctrl+Shift+N
Firefox: Ctrl+Shift+P
```
Las extensiones suelen estar desactivadas en modo incógnito.

### Opción 3: Agregar Excepción
En la configuración del bloqueador, agregar a la whitelist:
- `localhost`
- `*.mercadolibre.com`
- `*.mercadopago.com`

---

## 🛠️ Solución para Desarrolladores (Opcional)

Si quieres evitar que los usuarios tengan este problema, puedes crear un proxy en el backend:

### 1. Crear Ruta Proxy
```php
// routes/web.php
Route::post('/api/mp-proxy', [MercadoPagoProxyController::class, 'proxy'])
    ->middleware('auth');
```

### 2. Crear Controller
```php
// app/Http/Controllers/MercadoPagoProxyController.php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class MercadoPagoProxyController extends Controller
{
    public function proxy(Request $request)
    {
        $url = $request->input('url');
        $method = $request->input('method', 'POST');
        $data = $request->input('data', []);
        
        // Validar que sea una URL de MercadoPago
        if (!str_contains($url, 'mercadopago.com') && !str_contains($url, 'mercadolibre.com')) {
            return response()->json(['error' => 'URL no permitida'], 403);
        }
        
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . env('MERCADOPAGO_ACCESS_TOKEN'),
            'Content-Type' => 'application/json',
        ])->$method($url, $data);
        
        return response()->json($response->json(), $response->status());
    }
}
```

### 3. Modificar Frontend
```typescript
// En lugar de llamar directamente a MercadoPago
// Llamar al proxy
const response = await axios.post('/api/mp-proxy', {
    url: 'https://api.mercadolibre.com/tracks',
    method: 'POST',
    data: trackingData
});
```

---

## ⚠️ Nota Importante

**La petición a `/tracks` es solo para analytics de MercadoPago.**

Si el pago funciona pero solo falla el tracking:
- ✅ El pago se procesa correctamente
- ❌ Solo no se registra la analítica en MercadoPago

**No es crítico para el funcionamiento del checkout.**

---

## 🧪 Verificar si es el Problema

1. Abrir DevTools (F12)
2. Ir a la pestaña "Network"
3. Intentar hacer el pago
4. Buscar peticiones en rojo con "blocked"
5. Si dice `ERR_BLOCKED_BY_CLIENT` → Es el bloqueador

---

## 📊 Estadísticas

Aproximadamente el **30-40%** de usuarios tienen bloqueadores de anuncios instalados. Si implementas el proxy, evitas este problema para todos.

---

## ✅ Recomendación

**Para desarrollo**: Desactivar bloqueador en localhost

**Para producción**: 
- Opción A: Agregar aviso en checkout: "Desactiva tu bloqueador de anuncios"
- Opción B: Implementar proxy (más trabajo pero mejor UX)

---

**Estado**: ⚠️ No crítico - El pago funciona, solo falla el tracking
