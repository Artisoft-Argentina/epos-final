# Sistema de Gestión de Entregas - Documentación

## 📦 Resumen de Cambios

Se implementó un sistema completo de gestión de entregas diferenciado por tipo de venta (E-commerce vs POS) con control de estados y descuento de stock inteligente.

---

## 🔄 Flujo de Ventas y Stock

### 🛒 **E-COMMERCE**
1. **Al crear la venta**: 
   - ✅ Se crea la factura
   - ✅ Se registran los artículos
   - ✅ Se crea entrega con estado `pendiente`
   - ❌ **NO se descuenta stock** (aún no se entregó)

2. **Al marcar entrega como completada**:
   - ✅ Se descuenta el stock del inventario
   - ✅ Se marca entrega como `entregada`
   - ✅ Se registra fecha de entrega real

### 🏪 **POS (Punto de Venta)**

#### Opción A: Entrega Inmediata (auto_delivery = true)
1. **Al crear la venta**:
   - ✅ Se crea la factura
   - ✅ Se registran los artículos
   - ✅ **Se descuenta stock inmediatamente**
   - ✅ Se crea entrega con estado `entregada`

#### Opción B: Entrega Diferida (auto_delivery = false)
1. **Al crear la venta**:
   - ✅ Se crea la factura
   - ✅ Se registran los artículos
   - ✅ Se crea entrega con estado `pendiente`
   - ❌ **NO se descuenta stock**

2. **Al marcar entrega como completada**:
   - ✅ Se descuenta el stock del inventario
   - ✅ Se marca entrega como `entregada`
   - ✅ Se registra fecha de entrega real

---

## 🗄️ Cambios en Base de Datos

### Tabla `entregas`
```sql
ALTER TABLE entregas ADD COLUMN estado ENUM('pendiente', 'entregada', 'cancelada') DEFAULT 'pendiente';
ALTER TABLE entregas ADD COLUMN fecha_entrega_real TIMESTAMP NULL;
```

**Campos agregados:**
- `estado`: Estado de la entrega (pendiente/entregada/cancelada)
- `fecha_entrega_real`: Fecha real cuando se completó la entrega

---

## 📝 Modelos Actualizados

### `app/Models/Entrega.php`
**Nuevos métodos:**
- `scopePendientes()`: Filtrar entregas pendientes
- `scopeEntregadas()`: Filtrar entregas completadas
- `marcarComoEntregada()`: Completar una entrega
- `isPendiente()`: Verificar si está pendiente
- `isEntregada()`: Verificar si está completada

---

## 🎮 Controladores

### `VentaController::store()`
**Lógica corregida:**
- ❌ **ANTES**: Descuento duplicado de stock
- ✅ **AHORA**: Descuento inteligente según tipo de venta

**Flujo:**
```php
if ($tipoVenta === 'ecommerce') {
    // Crear entrega pendiente (sin descontar stock)
} else {
    if ($auto_delivery) {
        // Descontar stock + crear entrega completada
    } else {
        // Crear entrega pendiente (sin descontar stock)
    }
}
```

### `EntregaController`
**Nuevos endpoints:**
- `GET /entregas` - Listar entregas pendientes
- `POST /entregas/{id}/marcar-entregada` - Completar entrega
- `POST /entregas/{id}/cancelar` - Cancelar entrega
- `DELETE /entregas/{id}` - Eliminar entrega

---

## 🌐 Rutas Agregadas

```php
Route::get('entregas', [EntregaController::class, 'index'])
    ->name('entregas.index');

Route::post('entregas/{entrega}/marcar-entregada', [EntregaController::class, 'marcarEntregada'])
    ->name('entregas.marcar-entregada');

Route::post('entregas/{entrega}/cancelar', [EntregaController::class, 'cancelar'])
    ->name('entregas.cancelar');
```

---

## 🎨 Interfaz de Usuario

### Vista: `resources/js/pages/Entregas/Index.tsx`

**Características:**
- 📋 Lista de entregas pendientes
- 🔍 Filtros por estado y tipo de venta
- ✅ Botón "Completar" para marcar como entregada
- ❌ Botón "Cancelar" para cancelar entrega
- 📊 Badges de estado visual
- 🏷️ Diferenciación E-commerce vs POS

**Columnas mostradas:**
- Número de factura
- Cliente
- Artículo y código
- Cantidad
- Fecha de entrega estimada
- Tipo de venta (E-commerce/POS)
- Estado (Pendiente/Entregada/Cancelada)
- Acciones

---

## 🔐 Validaciones de Seguridad

### Al completar entrega:
```php
// Verificar stock disponible
if ($inventario->cantidad < $entrega->cantidad) {
    throw new Exception('Stock insuficiente');
}
```

### Al cancelar entrega:
```php
// No permitir cancelar si ya está entregada
if ($entrega->isEntregada()) {
    return back()->with('error', 'No se puede cancelar');
}
```

---

## 📊 Estados de Entrega

| Estado | Descripción | Stock Descontado |
|--------|-------------|------------------|
| `pendiente` | Esperando ser entregada | ❌ No |
| `entregada` | Completada y entregada | ✅ Sí |
| `cancelada` | Cancelada por el usuario | ❌ No |

---

## 🚀 Casos de Uso

### Caso 1: Venta E-commerce
```
1. Cliente compra online
2. Se crea factura + entrega pendiente
3. Stock NO se descuenta
4. Operador prepara pedido
5. Operador marca como "Entregada"
6. Stock se descuenta automáticamente
```

### Caso 2: Venta POS con entrega inmediata
```
1. Cliente compra en tienda
2. Se crea factura + entrega completada
3. Stock se descuenta inmediatamente
4. Cliente se lleva el producto
```

### Caso 3: Venta POS con entrega diferida
```
1. Cliente compra en tienda
2. Se crea factura + entrega pendiente
3. Stock NO se descuenta
4. Cliente retira después
5. Operador marca como "Entregada"
6. Stock se descuenta automáticamente
```

---

## 🔧 Comandos Útiles

### Ver entregas pendientes
```bash
php artisan tinker
>>> Entrega::pendientes()->count()
```

### Marcar todas las entregas antiguas como entregadas
```bash
php artisan tinker
>>> Entrega::pendientes()->where('fecha_entrega', '<', now()->subDays(7))->get()->each->marcarComoEntregada()
```

---

## ✅ Checklist de Implementación

- [x] Migración de base de datos
- [x] Actualización del modelo Entrega
- [x] Corrección de VentaController
- [x] Actualización de EntregaController
- [x] Rutas agregadas
- [x] Vista React para gestión de entregas
- [x] Validaciones de stock
- [x] Estados de entrega
- [x] Documentación

---

## 🎯 Próximos Pasos Sugeridos

1. **Notificaciones**: Enviar email cuando una entrega está lista
2. **Tracking**: Agregar número de seguimiento para e-commerce
3. **Entregas parciales**: Permitir entregar cantidades menores
4. **Reportes**: Dashboard de entregas pendientes/completadas
5. **Historial**: Log de cambios de estado de entregas

---

## 📞 Soporte

Para consultas sobre este sistema:
- Revisar código en `app/Http/Controllers/EntregaController.php`
- Ver modelo en `app/Models/Entrega.php`
- Interfaz en `resources/js/pages/Entregas/Index.tsx`
