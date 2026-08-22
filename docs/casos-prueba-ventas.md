# Ventas — casos de prueba del circuito de cobro y cancelación

Cubre lo que tiene que mantenerse consistente a medida que se cobra una venta y
cuando se la cancela. Surge de la auditoría de SCRUM-26.

**Cómo leer la columna Estado**

| | |
|---|---|
| ✅ | verificado a mano contra el tenant local, comprobando el estado resultante en la base |
| 🧪 | cubierto además por test automatizado (`php artisan test --testsuite=Unit`) |
| ⏳ | pendiente de verificar |
| 🚫 | no verificable hoy (requiere infraestructura que todavía no existe) |

Los casos que la interfaz bloquea escondiendo botones se probaron **contra el
endpoint**, no por la UI: lo que interesa es que el backend también los rechace,
que es lo que protege ante un doble submit o un llamado directo a la API.

Los tests automatizados con base de datos llegan con SCRUM-67: el suite actual
usa SQLite en memoria, donde no corren las migraciones tenant y `lockForUpdate`
es no-op, con lo que los casos de concurrencia serían vacíos.

---

## Invariantes

Todo caso de abajo verifica, en el fondo, una de estas cuatro reglas:

1. **El saldo es el mismo en todas las pantallas.** Detalle de venta, estado de
   cuenta, PDF, Excel, portal del cliente y dashboard tienen que decir lo mismo
   para la misma venta.
2. **Una venta cancelada no factura, no adeuda y no vendió.** No suma a ningún
   total, no deja saldo, y sus productos no cuentan como vendidos.
3. **El crédito acreditado es exactamente lo cobrado en esa venta**, ni su total
   ni la suma de otras.
4. **El stock solo se mueve por entregas**, y toda salida tiene su movimiento
   registrado.

---

## 1. Cobro y saldo pendiente

| # | Caso | Resultado esperado | Estado | Verificado |
|---|---|---|---|---|
| 1.1 | Venta con pago total al crear | `paid` + `cash`; saldo $0 | ✅ | 14/8/2026 |
| 1.2 | Venta con pago parcial al crear | `partial` + `credit`; saldo = total − pago | ✅ | 14/8/2026 |
| 1.3 | Venta sin pago | `pending` + `credit`; no se crea `SalePayment` | ✅ | 14/8/2026 |
| 1.4 | Segundo pago que no salda | sigue `partial`; saldo baja por el monto exacto | ✅ | 14/8/2026 |
| 1.5 | Pago que salda el total | pasa a `paid`; saldo $0 | ✅ | 22/8/2026 |
| 1.6 | Eliminar un pago de una venta saldada | vuelve a `partial`; el saldo reaparece | ✅ | 22/8/2026 |
| 1.7 | Eliminar el único pago | vuelve a `pending` | ✅ | 22/8/2026 |
| 1.8 | Pago mayor al saldo | rechazado con mensaje visible en el formulario; no se crea el pago | ✅ | 14/8/2026 |
| 1.9 | Pago inicial mayor al total | rechazado (422) antes de crear la venta | ✅ | 22/8/2026 |
| 1.10 | Venta con dos o más pagos | "Pagado" y "Saldo" muestran importes, nunca `$NaN` | ✅ | 14/8/2026 |
| 1.11 | Método de pago inválido | rechazado; los seis métodos de la UI son válidos | 🧪 | 14/8/2026 |

**1.10** es la regresión de sumar strings: con un solo pago el error no se nota.
Probar siempre con dos.

## 2. Entregas y stock

| # | Caso | Resultado esperado | Estado | Verificado |
|---|---|---|---|---|
| 2.1 | Venta con entrega automática | entrega `delivered`; stock baja; movimiento `delivery_exit` | ✅ | 14/8/2026 |
| 2.2 | Venta sin entrega automática | entrega `pending`; **stock intacto** | ✅ | 22/8/2026 |
| 2.3 | Marcar entregada una pendiente | pasa a `delivered`; recién ahí baja el stock | ✅ | 22/8/2026 |
| 2.4 | Marcar entregada una ya entregada | idempotente: un solo movimiento, no descuenta dos veces | ✅ | 22/8/2026 |
| 2.5 | Entregar más de lo vendido | rechazado; no se crea la entrega | ✅ | 22/8/2026 |
| 2.6 | Venta con stock insuficiente | se revierte **toda** la venta: no queda venta, ítems, entregas ni movimientos | ✅ | 22/8/2026 |
| 2.7 | Egreso que dejaría stock negativo | rechazado por el guard de `MovimientoService`; 0 movimientos | ✅ | 22/8/2026 |

## 3. Cancelación

| # | Caso | Resultado esperado | Estado | Verificado |
|---|---|---|---|---|
| 3.1 | Cancelar venta con entrega entregada | entrega a `cancelled`; **stock repuesto**; movimiento `return` | ✅ | 14/8/2026 |
| 3.2 | Cancelar venta con entrega pendiente | entrega a `cancelled`; stock **sin tocar** | ✅ | 22/8/2026 |
| 3.3 | Cancelar venta con pagos | crédito del cliente += lo cobrado **en esa venta**; los pagos quedan como histórico | ✅ | 14/8/2026 |
| 3.4 | Cancelar venta sin pagos | crédito sin cambios | ✅ | 22/8/2026 |
| 3.5 | Cancelar dos veces | la segunda se rechaza; **no acredita de nuevo** | ✅ | 22/8/2026 |
| 3.6 | Registrar un pago sobre una venta cancelada | bloqueado (la pantalla de pago redirige) | ✅ | 14/8/2026 |
| 3.7 | Editar una venta cancelada | bloqueado; redirige a la lista | ✅ | 22/8/2026 |
| 3.8 | Entregar ítems de una venta cancelada | bloqueado; no se crea la entrega | ✅ | 22/8/2026 |
| 3.9 | Eliminar un pago de una venta cancelada | bloqueado; el pago sigue vigente | ✅ | 22/8/2026 |
| 3.10 | Venta cancelada con factura AFIP (CAE) | bloqueado: no se cancela un comprobante autorizado | ✅ | 22/8/2026 |
| 3.11 | El registro no se borra | sigue visible en la lista con badge "Cancelada" | ✅ | 14/8/2026 |

**3.5** solo es concluyente con una venta **que tenga pagos**: si el guard no
existiera, el crédito se duplicaría. Con una venta sin pagos el caso pasa igual y
no prueba nada.

## 4. Consistencia entre pantallas

Con **una venta cancelada que tuvo pagos** y **otra vigente con saldo**, verificar
que todas digan lo mismo:

| # | Pantalla | Resultado esperado | Estado | Verificado |
|---|---|---|---|---|
| 4.1 | Detalle de venta cancelada | no muestra saldo a cobrar; aclara lo acreditado | ✅ | 22/8/2026 |
| 4.2 | Estado de cuenta (cards) | Total Ventas y Saldo excluyen la cancelada; Crédito refleja lo acreditado | ✅ | 14/8/2026 |
| 4.3 | Estado de cuenta (movimientos) | débito por venta, crédito por pago, anulación que compensa; **el saldo de la última fila = card de Saldo Pendiente** | ✅ | 14/8/2026 |
| 4.4 | PDF del estado de cuenta | mismos importes que la pantalla | ✅ | 14/8/2026 |
| 4.5 | Excel del estado de cuenta | mismos importes que la pantalla | ✅ | 14/8/2026 |
| 4.6 | Portal del cliente (`Client/Dashboard`, rol `cliente`) | lista sus compras con el estado real de cada una; la cancelada figura como "Cancelada" | ✅ | 22/8/2026 |
| 4.6b | Landing del vendedor (`user-dashboard`, rol `vendedor`) | si su email coincide con un cliente, el resumen excluye las canceladas y muestra el crédito | ⏳ | — |
| 4.7 | Dashboard | Total Ventas, tendencia diaria, ranking de vendedores y de productos **excluyen** la cancelada | ✅ | 22/8/2026 |
| 4.8 | Dashboard → Saldo Impagas | suma solo `pending` y `partial` | ✅ | 22/8/2026 |
| 4.9 | Lista de ventas | la cancelada oculta editar, pagar, entregar, AFIP y cancelar | ✅ | 14/8/2026 |

**4.3** es el chequeo más barato para detectar cualquier desvío: si el acumulado
no cierra con el card, algo quedó fuera del criterio.

**4.6b** quedó sin verificar porque requiere un vendedor cuyo email coincida con
el de un cliente, combinación que en la práctica casi no ocurre: esa pantalla
suele mostrar "no hay un cliente vinculado a tu cuenta".

## 5. Numeración e identificación

| # | Caso | Resultado esperado | Estado | Verificado |
|---|---|---|---|---|
| 5.1 | Emitir dos facturas seguidas | números correlativos; el contador del PV avanza | ✅ | 14/8/2026 |
| 5.2 | Cliente Responsable Inscripto / Monotributo | letra **A** | 🧪 | 14/8/2026 |
| 5.3 | Cliente Consumidor Final / Exento | letra **B** | 🧪 | 14/8/2026 |
| 5.4 | Cliente sin condición IVA | letra **B** (fallback) | 🧪 | 14/8/2026 |
| 5.5 | Identificación en pantalla | se muestra el comprobante completo (`B 0003-00000002`), nunca `#N` pelado | ✅ | 21/8/2026 |
| 5.6 | Diálogo de cancelación | nombra comprobante, cliente e importe, y avisa que no se puede deshacer | ✅ | 21/8/2026 |

**5.5 y 5.6** existen porque el `#N` pelado se confunde con el id de la URL —
no coinciden— y eso ya provocó cancelar la factura equivocada.

## 6. Concurrencia (requiere el harness de SCRUM-67)

| # | Caso | Resultado esperado | Estado | Verificado |
|---|---|---|---|---|
| 6.1 | Doble submit del formulario de pago | un solo pago; nunca sobrepago | 🚫 | — |
| 6.2 | Dos pagos concurrentes que juntos superan el saldo | el segundo se rechaza | 🚫 | — |
| 6.3 | Doble submit de registrar entrega | descuenta una sola vez | 🚫 | — |
| 6.4 | Dos ventas concurrentes del último ítem | una sola prospera | 🚫 | — |
| 6.5 | Dos ventas concurrentes en el mismo PV | números distintos, sin duplicados | 🚫 | — |

Estos no se pueden cubrir con tests de un solo proceso: necesitan conexiones
paralelas reales. Hoy están cubiertos por diseño (`lockForUpdate` + relectura del
saldo después del lock), pero **sin verificación de ningún tipo**.

---

## Fuera de alcance

Conversión de presupuesto a venta (SCRUM-27), facturación AFIP, e-commerce y
checkout con MercadoPago.

Dos huecos conocidos, que no son bugs de este circuito pero conviene tener a la
vista:

- **El crédito a favor es informativo.** Queda registrado en el cliente y se
  muestra en el estado de cuenta, pero no se aplica automáticamente como
  descuento en una venta futura.
- **El cliente no ve su saldo.** `Client/Dashboard` lista las compras con su
  estado, pero no muestra saldo pendiente ni crédito a favor: para conocerlos
  hay que pedirle el estado de cuenta al admin.
