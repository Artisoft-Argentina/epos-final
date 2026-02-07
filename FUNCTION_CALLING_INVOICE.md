# Function Calling: Crear y Enviar Factura

## Nueva Función: `create_and_send_invoice`

Esta función encadena automáticamente todo el proceso de facturación:

1. ✅ Busca el cliente por nombre o CUIT
2. ✅ Busca los productos por nombre o código
3. ✅ Crea la factura
4. ✅ Autoriza en AFIP
5. ✅ Envía el PDF por email al cliente

## Uso

### Ejemplo 1: Factura simple
```
Envía una factura a Juan Pérez con 2 LEGO Classic
```

### Ejemplo 2: Múltiples productos
```
Factura para María García:
- 3 Barbie Fashionista
- 1 Hot Wheels
- 2 Peluche Oso
```

### Ejemplo 3: Con CUIT
```
Crea y envía factura a CUIT 20123456789 con:
- 5 LEGO001
- 2 BAR001
```

## Respuesta

La función devuelve un objeto con:

```json
{
  "success": true,
  "factura_id": 123,
  "numero": 456,
  "cliente": "Juan Pérez",
  "total": 15000.50,
  "cae": "12345678901234",
  "email_enviado": true,
  "steps": [
    "Buscando cliente...",
    "✓ Cliente encontrado: Juan Pérez",
    "Buscando productos...",
    "✓ Producto encontrado: LEGO Classic x2",
    "Creando factura...",
    "✓ Factura #456 creada. Total: $15000.50",
    "Autorizando en AFIP...",
    "✓ Autorizada en AFIP. CAE: 12345678901234",
    "✓ Email enviado a juan@example.com"
  ],
  "message": "Proceso completado: Factura #456 creada, autorizada (CAE: 12345678901234) y enviada a juan@example.com"
}
```

## Ventajas

### Antes (3 pasos manuales):
1. Usuario: "Busca el cliente Juan Pérez"
2. Usuario: "Crea una factura para cliente ID 5 con producto ID 1, cantidad 2"
3. Usuario: "Autoriza la factura ID 123 y envíala por email"

### Ahora (1 paso automático):
1. Usuario: "Envía una factura a Juan Pérez con 2 LEGO Classic"

## Manejo de Errores

Si algo falla en el proceso, la función devuelve:

```json
{
  "success": false,
  "message": "Cliente 'Pedro Inexistente' no encontrado",
  "steps": [
    "Buscando cliente...",
    "✗ Error: Cliente no encontrado"
  ]
}
```

Si la factura se crea pero falla AFIP:

```json
{
  "success": false,
  "message": "Error al autorizar en AFIP: Token expirado",
  "factura_id": 123,
  "factura_creada": true,
  "steps": [
    "✓ Cliente encontrado: Juan Pérez",
    "✓ Factura #456 creada",
    "Autorizando en AFIP...",
    "✗ Error: Token expirado"
  ]
}
```

## Parámetros

### `cliente` (requerido)
- Tipo: string
- Descripción: Nombre o CUIT del cliente
- Ejemplos: "Juan Pérez", "20123456789", "García"

### `productos` (requerido)
- Tipo: array de objetos
- Cada producto tiene:
  - `nombre` (requerido): Nombre o código del producto
  - `cantidad` (opcional): Cantidad (default: 1)
  - `precio` (opcional): Precio unitario (usa el precio del producto por defecto)

## Archivos Modificados

1. **Nueva función**: `/app/Services/Functions/CreateAndSendInvoiceFunction.php`
2. **Registro**: `/app/Http/Controllers/TelegramWebhookController.php`

## Testing

Prueba con Telegram:

```
Envía una factura a LEGO001 con 1 LEGO Classic
```

Deberías recibir:
- Confirmación de cada paso
- Número de factura
- CAE de AFIP
- Confirmación de email enviado

## Logs

Los logs se guardan en `storage/logs/laravel.log`:

```
[2026-02-07] local.INFO: Function call: create_and_send_invoice
[2026-02-07] local.INFO: Cliente encontrado: Juan Pérez (ID: 5)
[2026-02-07] local.INFO: Factura creada: #456
[2026-02-07] local.INFO: AFIP autorizada: CAE 12345678901234
[2026-02-07] local.INFO: Email enviado a: juan@example.com
```

## Próximas Mejoras

- [ ] Soporte para descuentos
- [ ] Soporte para recargos
- [ ] Selección de lista de precios
- [ ] Programar fecha de entrega
- [ ] Registrar pago automático
- [ ] Notificación por WhatsApp además de email

---

**Creado**: 2026-02-07
**Versión**: 1.0
**Estado**: ✅ Implementado y funcionando
