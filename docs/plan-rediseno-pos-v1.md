# Plan de Implementación — Rediseño de la pantalla de venta (POS) V1

## Resumen

Implementa la **propuesta B**: el catálogo y el comprobante dejan de compartir
columna y pasan a tener cada uno su región y su lenguaje visual —fichas en
grilla para elegir, renglones de comprobante para lo cargado—. Resuelve además
el bloqueante de mobile, donde hoy no se puede vender.

Relacionado con SCRUM-28 (Revisión de UI/UX del módulo de ventas en web y
mobile). Continúa el trabajo de SCRUM-26, que dejó el circuito de cobro y
cancelación consistente.

**Punto de partida:** `resources/js/pages/Sales/Create.tsx`, rama
`feature/SCRUM-26-refactor-sales`.

### Estado — 14/10/2026

**Etapa 1 terminada**, y absorbió las etapas 3 y 4 completas. El escalonamiento
original difería el cobro en porcentaje, el vuelto, los atajos, la barra de
contexto, los chips del cliente y el stock en la ficha. Al implementarlo quedó
claro que ese diferimiento no se sostenía:

- El cobro y los atajos eran **sólo frontend**: no había nada que esperar.
- El stock en la ficha, la barra de contexto y el saldo del cliente parecían
  caros y no lo son. Ver las decisiones 3 y 4, que cambiaron de respuesta.

Dejar la mitad de esos elementos afuera habría dado una pantalla que no se
parecía a la propuesta y que después había que volver a tocar.

### Estado — 16/10/2026

**Etapa 2 terminada.** Con eso el plan está completo: no quedan etapas abiertas.
La pantalla se reorganizó en una lógica compartida y dos shells, y a 390px se
completa una venta entera sin zoom ni scroll horizontal.

Lo que queda fuera del plan sigue en «Fuera de alcance V1»: búsqueda en el
servidor, ticket de impresión, los campos del payload de entregas en español y
los tests automatizados, que dependen del harness de SCRUM-67.

### Qué NO cambia

El rediseño es de la pantalla, no del circuito. Se conservan tal cual:

- `SaleService::create` y toda la lógica de venta, pago, entrega y stock.
- `StoreSaleRequest` y sus validaciones, incluido el piso de precio y la lista
  de precios obligatoria.
- Búsqueda por `sku`, `barcode`, `ean`, `qr_code` y `supplier_code`; Enter que
  agrega el match exacto de código; flechas y Escape.
- Almacén seleccionable por línea, botón de eliminar, pago automático por el
  total y entrega automática de productos.
- El bloqueo cuando no hay ninguna lista de precios configurada.

### Corrección respecto de la propuesta

La propuesta B decía que la grilla "vuelve urgente mover la búsqueda al
servidor". Es inexacto: **el payload es idéntico en A y en B** —hoy ya viajan
todos los artículos en cada carga—. B sólo agrega presión de *renderizado*, que
se resuelve con un tope de fichas igual que el desplegable corta en 8. La deuda
de la búsqueda en el servidor sigue existiendo, pero no bloquea este trabajo.

---

## Etapa 0 — Parche de mobile (opcional, se puede soltar ya)

Sólo si hace falta destrabar la venta por teléfono antes de que esté el
rediseño. Es independiente y descartable: la Etapa 2 lo reemplaza.

### 0.1 Causa

El contenedor usa `h-[calc(100vh-4rem)]` con `overflow-hidden`. A 390px el panel
izquierdo colapsa a 231px y el buscador junto con la lista de artículos quedan
recortados fuera de la caja.

### 0.2 Alcance

Que la altura fija y el recorte apliquen sólo desde `lg`, dejando que en mobile
la página scrollee normalmente.

**Terminado cuando:** a 390px se puede buscar un artículo, agregarlo y llegar al
botón de finalizar.

---

## Etapa 1 — Componentes compartidos y escritorio

`Create.tsx` ya pasa las 700 líneas y va a crecer. Antes de reestructurar,
extraer las dos piezas que el escritorio y el mobile comparten.

### 1.1 Componentes nuevos

| Archivo | Rol |
|---|---|
| `components/sales/product-card.tsx` | Artículo del catálogo: miniatura, nombre, SKU, precio, stock y botón de agregar. Se dibuja como tarjeta en grilla o como fila en lista, según la vista elegida |
| `components/sales/sale-line.tsx` | Renglón del comprobante: nombre, cantidad, importe, almacén, eliminar |

Ambos con los componentes existentes (`Badge`, `Button`, `Select`) y sin
variantes nuevas.

### 1.2 Reestructura del layout

Dos regiones en lugar de dos paneles con contenido mezclado:

- **Izquierda — catálogo:** buscador, chips de categoría y grilla de fichas. La
  grilla reemplaza al desplegable; nada se superpone al carrito.
- **Derecha — comprobante:** cliente, lista de precios, renglones, totales y
  cobro. Pie fijo: sólo scrollean los renglones.

Las categorías se derivan de los productos que ya llegan (`product.category`),
sin tocar el backend.

### 1.3 Vista grilla o lista

Un interruptor cambia cómo se dibuja el catálogo, sin tocar nada más:

- **Grilla** — tarjetas con miniatura grande. Rinde cuando los artículos tienen
  foto y se vende mirando el producto.
- **Lista** — filas compactas. Entra tres o cuatro veces más artículos en
  pantalla; es lo que sirve con catálogos grandes, sin fotos, o para quien ya
  conoce los códigos.

Dos condiciones para que no se vuelva un adorno:

1. **La elección se recuerda** por usuario (`localStorage`). Si vuelve al valor
   por defecto en cada carga, molesta más de lo que ayuda.
2. **La fila de lista no puede parecerse al renglón del comprobante**, o
   reaparece el problema que B vino a resolver. Se distinguen por anatomía: la
   del catálogo lleva precio, stock y botón de agregar; la del comprobante
   lleva cantidad editable, importe y eliminar. Y siguen viviendo en regiones
   distintas.

### 1.4 Tope de artículos dibujados

Reemplaza a `MAX_SEARCH_RESULTS = 8`. Con el buscador vacío muestra los
primeros N artículos del catálogo; al filtrar, las primeras N coincidencias, con
el mismo aviso de refinar que hoy. El tope puede ser distinto por vista: en
lista entran más sin costo visual.

**Decisión abierta:** cuántos (sugerido: 40 en grilla, 60 en lista).

### 1.5 Responsive

Por debajo de ~1100px las dos regiones se apilan: catálogo arriba, comprobante
abajo. Es el comportamiento intermedio entre escritorio y mobile.

**Terminado cuando:** se puede completar una venta en escritorio con el mismo
resultado que hoy, y en una ventana de 1024px nada se trunca.

---

## Etapa 2 — Mobile — **hecha (16/10/2026)**

Cierra el bloqueante de forma definitiva, reutilizando los componentes de la
Etapa 1.

### Arquitectura: una lógica, dos shells

El layout de teléfono no es un escritorio angosto —las dos regiones se turnan en
pestañas, el cobro vive en un `Sheet` y hay una barra inferior fija—, así que no
se resuelve con clases responsive: habría que montar los dos árboles y esconder
uno, duplicando `id="auto_payment"` y `id="auto_delivery"` en el DOM, los
efectos y hasta 60 fichas de catálogo.

Tampoco son dos pantallas separadas: el estado es demasiado —13 `useState`, el
`useForm` y unos 15 handlers— y dos copias divergen en la primera corrección.

```
pages/Sales/Create.tsx        elige shell y poco más
components/sales/
  use-sale-form.ts            estado y reglas, sin una decisión de layout
  pos-desktop.tsx             catálogo y comprobante a la vez
  pos-mobile.tsx              pestañas + barra inferior + Sheet
  pos-bits.tsx                Kbd y PercentInput, que usan los dos
  product-card.tsx            hojas compartidas
  sale-line.tsx
```

`Create.tsx` bajó de 1263 a 94 líneas. El escritorio quedó idéntico al
pre-refactor, medido: panel 865, encabezado 73, carrito 509 (7,4 renglones),
cobro 219, sin scroll de página.

### Lo que resuelve

A 390px el comprobante arrancaba a **1573px de scroll** y agregar un artículo no
daba ninguna señal: el contador no se veía y el carrito estaba fuera de pantalla.

- **Conmutador Catálogo / Venta · N** fijo arriba. El contador en la propia
  pestaña es la señal que faltaba: se agrega desde el catálogo y se ve subir sin
  cambiar de pestaña.
- **El contador va en unidades, no en renglones.** Agregar un artículo que ya
  está cargado sube la cantidad de su renglón en lugar de sumar uno nuevo, así
  que contando renglones el badge no se movía al tocar «+» sobre algo ya
  agregado —justo lo único que avisa que la venta cambió—. Además la barra
  inferior ya mostraba unidades, y dos números distintos en la misma pantalla
  obligan a preguntarse cuál es cuál.
- **Barra inferior fija** con total, cancelar y Cobrar, presente en las dos
  pestañas. La venta se abandona desde el mismo lugar donde se cobra, igual que
  en el escritorio.
- **El cobro abre un `Sheet`** con ajustes, método, paga con, vuelto, los dos
  interruptores y la confirmación. Mide 425px de 844.
- **Fichas en dos columnas**, buscador fijo bajo el conmutador y filtros de
  categoría en scroll horizontal.
- **Grilla o lista también en el teléfono**, con preferencia propia. Era donde
  más rendía y casi se queda afuera: la fila de una línea deja 121px para el
  nombre a 390px —unos quince caracteres— y cortaba casi todo el catálogo. La
  variante `dense` la apila en dos renglones, el nombre se lleva el ancho entero
  y la fila mide 65px contra 197px de la ficha: **3x más densa**, 9 artículos
  por pantalla contra 6.
- La vista se guarda **por dispositivo** (`pos.catalog-view` y
  `pos.catalog-view.mobile`). Con una sola clave, elegir lista en la compu
  dejaba el teléfono en lista, y la decisión no es la misma en los dos.

### Dos cosas que aparecieron al construirlo

**El botón del Sheet no puede ser `type="submit"`.** El `Sheet` se dibuja en un
portal, así que en el DOM queda fuera del `<form>` y un submit nativo no
encuentra el formulario. Llama a `submit()` por `onClick`.

**Cobrar sin cliente era un callejón sin salida.** En el escritorio el selector
de cliente está a la vista; en el teléfono vive detrás de la otra pestaña, así
que un botón apagado dejaba al vendedor sin saber qué le faltaba. Ahora sólo se
deshabilita si no hay artículos: si falta el cliente, lleva a la pestaña de la
venta y abre el encabezado.

### `useIsMobile` reescrito con `useSyncExternalStore`

Arrancaba en `false` y se corregía en un efecto, así que en un teléfono se
pintaba un frame de la versión de escritorio —visible también en el sidebar, que
recién después saltaba a `Sheet`—. Inicializar el estado leyendo `window`
arreglaba el parpadeo pero rompía la hidratación si algún día se prende el SSR,
que está configurado en `config/inertia.php` aunque hoy no corra.
`useSyncExternalStore` resuelve los dos casos: su tercer argumento es el snapshot
del servidor, React hidrata con él y vuelve a renderizar con el del cliente sin
emitir mismatch.

### 2.1 Estructura

- Conmutador **Catálogo / Venta · N** fijo arriba, con el contador de ítems.
- Barra inferior fija con total y botón **Cobrar**, visible en las dos pestañas.
- El cobro abre un `Sheet` (componente ya existente) con método, paga con,
  vuelto, los dos interruptores y la confirmación.

### 2.2 Detalles

- Fichas en dos columnas.
- El buscador queda fijo bajo el conmutador, para no perder el escaneo al
  scrollear.
- Al agregar desde el catálogo, el contador del conmutador se actualiza sin
  cambiar de pestaña.

**Terminado cuando:** a 390px se completa una venta entera —buscar, agregar,
ajustar cantidad, cobrar— sin zoom ni scroll horizontal.

---

## Etapa 3 — Cobro — **hecha dentro de la Etapa 1**

Barato y de alto valor; no necesita backend. Por eso mismo no tenía sentido
diferirlo: sin esto el pie del comprobante no se parecía a la propuesta.

### 3.1 Recargo y descuento en porcentaje

Se escribe el %, se muestra el importe resultante. La venta sigue enviando el
monto en pesos a `sales.surcharge` y `sales.additional_discount`, así que
`SaleService` y la base no cambian.

**Resuelto: el porcentaje no se persiste.** Al reabrir una venta se ve el monto,
no el "5%". No afecta a nada funcional: `SaleService::update` sólo permite
editar recargo y descuento —no las líneas—, así que no existe un caso donde un
porcentaje guardado recalcularía distinto a un monto guardado. Es sólo fidelidad
de visualización.

Si más adelante hace falta, son dos columnas nullable: migración aditiva, sin
backfill y sin riesgo.

### 3.2 Vuelto

Campo "Paga con" y el vuelto calculado a la vista. No se persiste: es ayuda de
mostrador.

**Corrección respecto del plan:** decía "visible sólo cuando el método es
efectivo". Se implementó sin esa condición, porque "Paga con" es lo que el
cliente entrega y eso no es exclusivo del efectivo —una transferencia de más
también deja vuelto a favor—. Filtrarlo por método habría escondido el cálculo
justo en los casos en que la cuenta no es obvia.

Lo importante es que **"Paga con" no es `payment_amount`**: con $50.000 por una
venta de $40.740 se registran $40.740 y los $9.260 son vuelto. `StoreSaleRequest`
rechaza un pago mayor al total, así que el excedente nunca se envía. Con el pago
automático destildado el campo pasa a ser el pago real y lo que falte queda como
saldo pendiente: los pagos parciales siguen funcionando igual.

### 3.3 Atajos de teclado

`F3` al buscador, `F2` a cobrar, `Escape` limpia la búsqueda. Con indicación
visible en los controles.

**Terminado cuando:** una venta en efectivo se completa sin tocar el mouse y el
vuelto coincide con la cuenta manual.

---

## Etapa 4 — Información de contexto — **hecha dentro de la Etapa 1**

Era la etapa con más decisiones abiertas y resultó la que menos costaba. Los
tres datos salieron de `SaleController::create` sin endpoints nuevos ni
permisos nuevos.

### 4.1 Barra de contexto — hecha

Punto de venta y almacén salen de props que ya viajaban; sólo hizo falta
agregar `->with('warehouse:id,name')` para tener el nombre del almacén.

El próximo comprobante se muestra en el encabezado del comprobante, no en la
barra de contexto: pertenece al comprobante, no al catálogo. **La decisión 3 se
resolvió sola**: no hay que elegir entre "con cliente elegido" o "los dos
contadores", porque sin cliente la letra por defecto es B y el número se muestra
igual, cambiando a la serie A en cuanto se elige un Responsable Inscripto.
`next_invoice_number_a` y `_b` ya viajaban —`PointOfSale::get()` sin lista de
columnas trae la fila entera—, así que costó cero.

Es el número *esperado*, no uno reservado. Si otra caja factura primero, el
definitivo será el siguiente; si el contador no está inicializado no se muestra
un número inventado.

### 4.2 Situación del cliente — hecha

**La decisión 4 cambió de respuesta.** Estaba resuelta como "endpoint liviano al
seleccionar el cliente", con el argumento de que calcularlo para todos los
clientes sería caro. Al escribirlo resultó que **no lo es**: son dos agregados
con `GROUP BY customer_id` sobre `sales` y `sale_payments`, no un recorrido por
cliente. `SaleController::customerBalances()` los resuelve en el mismo request.

Un endpoint habría sido más código, un permiso más y un salto de red justo en el
momento en que el vendedor elige el cliente. La condición IVA y el crédito ya
venían en `Customer::all()`.

Queda sin efecto la nota sobre cómo nombrar un permiso nuevo en un módulo ya
anglicado: no hizo falta crear ninguno. El razonamiento sigue siendo válido para
cuando aparezca el caso.

### 4.3 Stock en la ficha — hecha

**El stock en el catálogo no era caro, y el plan lo había encuadrado mal.** Es
una sola consulta agregada —`Stock::where('warehouse_id', $posWarehouseId)
->pluck('quantity', 'product_id')`—, no una por artículo. El detalle por almacén
se sigue pidiendo bajo demanda con `products.stock-by-warehouse` al agregar el
artículo, que es lo que de verdad cuesta.

El plan además decía "stock **total** del artículo", y eso habría estado mal: el
número correcto es el del **almacén del punto de venta**, que es el único que la
venta puede comprometer sin pedir una transferencia. Mostrar un total de 12
cuando en la caja hay 0 sería peor que no mostrar nada. La propuesta ya lo decía
sin decirlo: en el mockup la ficha del Foco Halógeno marca 96 y su renglón marca
"Principal (96)" — el mismo número.

---

## Revisión del panel del comprobante — 14/10/2026

Fiel a la propuesta, el panel repartía mal su alto: el carrito —lo único que el
vendedor mira durante toda la venta— se quedaba con el 30%, y el 70% se lo
llevaba cromo que no cambia.

| Zona | Antes | Después |
|---|---|---|
| Encabezado | 236px (27%) | **73px (8%)** |
| Carrito | 262px (30%) | **509px (59%)** |
| Cobro | 303px (35%) | 219px (25%) |
| Botones | 64px | 64px |

A 945px el carrito pasó de 3,8 a 7,4 renglones; a 700px, de 137px a 264px.

### El encabezado se pliega

El cliente y la lista se eligen una vez y no se vuelven a tocar, pero cobraban
236px fijos durante toda la venta. Plegado dicen lo mismo en 73px: número de
comprobante, letra, cliente, lista y —si los hay— saldo y crédito. Se toca para
corregir, y elegir cliente lo vuelve a plegar.

Plegado no repite la condición IVA: la letra del comprobante ya la dice.

### Recargo y descuento aparecen cuando se usan

Tres filas para informar que el subtotal es el total y que no hay ajustes eran
100px fijos. Ahora son una línea —"Agregar recargo o descuento"— que se abre al
tocarla, y también sola si la venta ya trae un ajuste cargado: un ajuste que no
se ve es un ajuste que se olvida.

### El resumen se pliega, el total no

De los 219px del bloque de cobro, el total son 45. Los otros 174 —método, importe
entregado, interruptores y el enlace de ajustes— son controles que en la mayoría
de las ventas quedan en su valor por defecto. Esos se pliegan con el chevron que
va a la izquierda del total; el total y el botón de cobrar, no.

Medido a 1512×945: el carrito pasa de **509px (7,4 renglones) a 650px (9,4)**.

| Regla | Por qué |
|---|---|
| El total nunca se pliega | Es lo último que se confirma antes de cobrarle a alguien. Esconderlo habilita cobrar a ciegas y sólo ahorra 45px |
| Tres badges `outline` reemplazan lo que se esconde | Método, forma de pago y entrega. Sin eso, plegar escondería que la entrega automática está destildada —y entonces el stock no se mueve— |
| El que se desvía cambia de variante, no de forma | `Entrega pendiente` y `Pago parcial` pasan a `warning`. Los otros dos no se mueven |
| Se abre solo cuando hay algo que resolver | Vuelto, saldo pendiente, un ajuste cargado o un error de pago fuerzan la apertura y deshabilitan el chevron |
| Se recuerda por puesto | `localStorage`, como el interruptor de grilla/lista. Es el único plegado manual de los tres |

**Por qué `outline` y no badges grises rellenos:** el gris del badge es `#F3F4F6`
y el fondo del pie `#F0F2F2`. Tres puntos de diferencia sobre la superficie donde
tienen que leerse: desaparecerían. El `outline` resuelve el contraste con borde en
lugar de relleno.

**Por qué badges y no texto plano:** la línea vive entre el total —2xl— y el botón
primario, y en `text-xs` sobre `muted-foreground` se pierde. Los badges además
hacen que la excepción sea un cambio de variante y no un salto de forma.

### Todo plegado tiene que tener vuelta

Los tres plegables salieron de ida y sin vuelta, y los tres había que corregirlos:

| Qué pasaba | Por qué | Cómo se resolvió |
|---|---|---|
| Abrir el encabezado con el lápiz dejaba al vendedor atrapado | Sólo se plegaba al elegir cliente, así que mirar los datos —o tocar sólo la lista de precios— obligaba a reelegir un cliente para recuperar el alto del carrito | Botón **Ocultar** en la fila del número |
| Abrir los ajustes no se podía deshacer | `showAdjustments` no volvía nunca a `false`, así que abrirlos por curiosidad costaba 100px para el resto de la venta | Chevron sobre *Subtotal*, con la misma gramática que el del total. Se bloquea si hay un ajuste cargado, porque un recargo que no se ve es un recargo que se olvida |
| Abrir los ajustes bloqueaba además el chevron del resumen | `paymentNeedsAttention` miraba `adjustmentsOpen` en lugar de los importes | Ahora mira `hasAdjustment`: lo que protege el plegado es que haya un ajuste **cargado**, no que el panel esté abierto |

El patrón que faltaba es el mismo en los tres: **lo que se abre tiene que poder
cerrarse sin cambiar datos**. Abrir algo para mirarlo no puede dejar la pantalla
peor que antes.

**Sobre la palabra del botón:** dice «Ocultar» porque es lo único que hace.
«Confirmar» o «Guardar» prometerían algo que no pasa —cada cambio se aplica al
elegirlo, no al salir— y «Cerrar», en un POS, se lee como cerrar la venta o la
caja.

### El resumen es fijo, y hay una sola zona de scroll

Era la duda concreta: si el resumen debía scrollear con los ítems o quedar fijo.
Queda **fijo**. Con el encabezado plegado y los ajustes cerrados, el cromo mide
356px, así que el bloque de cobro entra entero hasta los ~608px de viewport y no
necesita su propio scroll. Antes aparecían dos barras apiladas en un panel de
420px de ancho, que es lo que se sentía roto.

### Detalles del renglón

- **El unitario aparece sólo con más de una unidad.** Con una sola repetía el
  mismo número dos veces; en un carrito de ocho renglones eran ocho líneas de
  ruido donde hay que leer precios. Con una unidad el importe *es* el precio y
  se corrige tocándolo.
- **El subrayado del precio aparece al pasar el mouse.** Fijo, ocho precios
  subrayados se leían como ocho enlaces.
- **El panel pasó de 400 a 420px.** Los 20px salen del catálogo, que no los
  necesita, y se los lleva la columna del nombre, que cortaba en 20 caracteres.
- **El bloque fijo tiene fondo apenas hundido.** El carrito corta un renglón al
  medio contra ese borde, y un filete de 0,67px en gris claro no alcanzaba para
  distinguir lo que scrollea de lo que no.

---

## El pie fijo contra las pantallas bajas

La nota 5 de la propuesta pide que el pie entero quede anclado: totales,
recargo, descuento, vuelto, los dos interruptores y el botón de cobrar, con sólo
los renglones scrolleando. Implementado tal cual, el pie mide **419px**.

Medido en el tenant local, con el encabezado de la app (112px hasta donde
arranca el formulario):

| Pantalla | Panel disponible | Encabezado | Pie | Renglones |
|---|---|---|---|---|
| 1512×945 | 825px | 236px | 419px | 210px (3 renglones) |
| 1366×700 | 580px | 236px | 419px | **0px** |

A 700px —un portátil de 14" al 125%— el pie fijo deja los renglones en cero y
manda "Cobrar y facturar" abajo del borde de la pantalla. Es el mismo síntoma
que ya se había corregido una vez.

**Resolución:** el pie se mantiene fijo y en el orden de la propuesta, pero el
bloque de cobro puede encogerse y scrollear por dentro, con los botones anclados
aparte. En una pantalla alta no scrollea nada y queda idéntico a la propuesta;
en una baja se scrollea desde el total hacia abajo y el botón nunca desaparece.
Los renglones tienen un piso de 88px para que no se aplasten a cero.

**Actualización (revisión del 14/10):** con el encabezado plegado y los ajustes
cerrados el cromo bajó de 603px a 356px, así que ese scroll interno ya no se
dispara hasta los ~608px de viewport. Queda como red de seguridad, no como el
comportamiento habitual. La tabla de arriba corresponde a la versión anterior;
los números vigentes están en la revisión.

El mockup no tiene este problema porque su marco es más alto que un viewport
real menos el encabezado de la aplicación.

---

## Orden de ejecución

1. ~~**Etapa 0**~~ — innecesaria: la Etapa 1 ya dejó el recorte sólo desde `xl`.
2. **Etapa 1** — componentes y escritorio. **Hecha**, con las etapas 3 y 4
   adentro.
3. **Etapa 2** — mobile. **Hecha** (16/10/2026): una lógica, dos shells.

Las etapas 1 y 2 conviene hacerlas seguidas: comparten los componentes y
dejarlas a mitad implica mantener dos layouts a la vez.

---

## Verificación

Cada etapa se prueba contra el tenant local y suma casos a
[casos-prueba-ventas.md](casos-prueba-ventas.md). Los casos del circuito de
cobro y cancelación que ya están ahí tienen que seguir pasando: el rediseño no
toca esa lógica, pero sí la pantalla desde donde se dispara.

Casos nuevos que agrega este trabajo:

| # | Caso | Resultado esperado | Estado |
|---|---|---|---|
| 7.1 | Venta completa a 390px | Se puede buscar, agregar, ajustar y cobrar | ✅ 16/10/2026 — `A 0003-00000005`, 2 ítems, 3 unidades, $2.150 |
| 7.2 | Venta completa a 1024px | Nada se trunca ni se superpone | ✅ 14/10/2026 |
| 7.3 | Catálogo con más artículos que el tope | Muestra el tope y avisa de refinar | ✅ 14/10/2026 |
| 7.4 | Artículo sin stock en la grilla | Aparece atenuado, con el cero marcado | ✅ 14/10/2026 |
| 7.8 | Interruptor grilla/lista | Cambia la vista, se recuerda al recargar, y la fila de catálogo no se confunde con el renglón del comprobante | ✅ 14/10/2026 |
| 7.9 | Artículo sin foto | Cae al ícono, en grilla y en lista | ✅ 14/10/2026 |
| 7.5 | Vuelto | Paga con − total; el pago registrado es el total, no lo entregado | ✅ 14/10/2026 — $50.000 por $40.740 ⇒ vuelto $9.260 y pago $40.740 |
| 7.6 | Recargo y descuento en % | El importe resultante coincide con el total guardado | ✅ 14/10/2026 — 42.000 +2% −5% ⇒ 840 / 2.100 / 40.740 en base |
| 7.7 | Conmutador en mobile | El contador refleja los ítems sin cambiar de pestaña | ✅ 16/10/2026 |
| 7.10 | Pago parcial | Se destilda el automático, se paga menos y queda saldo pendiente | ✅ 14/10/2026 |
| 7.11 | Próximo comprobante | El número mostrado coincide con el emitido | ✅ 14/10/2026 — predijo `A 0003-00000002`, emitió `A 0003-00000002` |
| 7.12 | Atajos F2 y F3 | F3 enfoca el buscador, F2 cobra | ✅ 14/10/2026 |
| 7.13 | Pie fijo a 700px de alto | El total y el botón de cobrar siguen visibles | ✅ 14/10/2026 |
| 7.14 | Encabezado plegado | Se pliega al elegir cliente, el lápiz lo reabre, y el carrito gana el alto | ✅ 14/10/2026 — 236px ⇒ 73px |
| 7.15 | Ajustes plegados | El enlace los abre; si la venta ya trae un %, se abren solos | ✅ 14/10/2026 |
| 7.16 | Una sola zona de scroll | El resumen nunca scrollea en paralelo al carrito | ✅ 14/10/2026 — verificado a 945 y 700 |
| 7.17 | Unitario redundante | Con una unidad no se repite el precio dos veces | ✅ 14/10/2026 |
| 7.18 | Plegado del resumen | El chevron pliega el cobro y el carrito gana alto | ✅ 14/10/2026 — 509px ⇒ 650px (7,4 ⇒ 9,4 renglones) |
| 7.19 | Badges del pie plegado | Método, forma de pago y entrega, en `outline` | ✅ 14/10/2026 |
| 7.20 | Excepción en el pie plegado | Entrega destildada ⇒ badge `warning`, los otros dos sin cambios | ✅ 14/10/2026 — y la venta quedó con 10 entregas en `pending` |
| 7.21 | Plegado no esconde decisiones | Pago parcial fuerza la apertura y deshabilita el chevron | ✅ 14/10/2026 |
| 7.22 | El plegado se recuerda | Sobrevive a recargar la pantalla | ✅ 14/10/2026 |
| 7.23 | Cobrar desde el pie plegado | F2 factura con el resumen plegado | ✅ 14/10/2026 — `A 0003-00000004`, 10 ítems, $915.000 |
| 7.24 | Salir del encabezado sin reelegir | El lápiz abre, **Ocultar** cierra, sin tocar el cliente | ✅ 16/10/2026 |
| 7.25 | Cerrar los ajustes vacíos | Abrir «Agregar recargo o descuento» y cerrarlo sin cargar nada | ✅ 16/10/2026 |
| 7.26 | Ajuste cargado bloquea el cierre | Con 5% de descuento, el cierre y el chevron del resumen quedan deshabilitados | ✅ 16/10/2026 |
| 7.27 | Volver el ajuste a 0 desbloquea | Cierre y plegado del resumen vuelven a habilitarse | ✅ 16/10/2026 |
| 7.28 | Shell correcto por tamaño | A 390px monta el de teléfono; a 1512px el de escritorio | ✅ 16/10/2026 |
| 7.29 | Escritorio tras el refactor | Mismas medidas que antes de extraer la lógica | ✅ 16/10/2026 — 73 / 509 / 219, sin scroll de página |
| 7.30 | Barra inferior en ambas pestañas | Total y Cobrar visibles en Catálogo y en Venta | ✅ 16/10/2026 |
| 7.31 | Hoja de cobro | Abre con ajustes, método, paga con, interruptores y confirmación | ✅ 16/10/2026 — 425px de 844 |
| 7.32 | Cobrar sin cliente | Lleva a la pestaña de venta y abre el encabezado, no queda mudo | ✅ 16/10/2026 |
| 7.33 | Grilla o lista en el teléfono | El conmutador cambia la vista y los nombres no se cortan | ✅ 16/10/2026 — fila 65px contra ficha 197px, 3x más densa |
| 7.34 | Preferencia de vista por dispositivo | Elegir lista en la compu no cambia la del teléfono | ✅ 16/10/2026 — claves separadas |
| 7.35 | Contador del conmutador | Coincide con la barra inferior y se mueve al repetir un artículo ya cargado | ✅ 16/10/2026 — 3 renglones, 5 unidades, los dos dicen 5 |
| 7.36 | Cancelar la venta en el teléfono | La X de la barra inferior abandona la venta, igual que en el escritorio | ✅ 16/10/2026 — total con 176px, sin cortes ni superposición |

---

## Decisiones abiertas

Conviene resolverlas antes de la etapa que las necesita, no durante.

| # | Decisión | Estado | Afecta |
|---|---|---|---|
| 1 | Cuántos artículos se dibujan antes de pedir refinar | **Resuelta** — 40 en grilla, 60 en lista, con aviso de refinar | Etapa 1 |
| 2 | ¿Se persiste el porcentaje de recargo y descuento? | **Resuelta** — no se persiste; dos columnas después si hace falta | Etapa 3 |
| 3 | Próximo comprobante: ¿recién con cliente elegido, o los dos contadores? | **Resuelta** — ninguna de las dos: uno solo, que sigue a la letra del cliente | Etapa 1 |
| 4 | Saldo del cliente: ¿cómo se obtiene? | **Resuelta (corregida)** — dos agregados en el payload inicial, sin endpoint | Etapa 1 |
| 5 | Fotos de artículos | **Resuelta** — la carga ya existe (`ProductImage`); es poblar datos, no construir | Calidad visual |
| 6 | ¿Imagen por defecto o ícono? | **Resuelta** — ícono, por el motivo de abajo | Etapa 1 |

La 6 se cerró como estaba recomendada. Además el renglón del comprobante quedó
**sin miniatura**, como en la propuesta: ahí el artículo ya está elegido y la
foto no agrega nada, mientras que los 40px que ocupaba eran los que le faltaban
al nombre para no cortarse.

Sobre la 6: una foto genérica de relleno es peor que un ícono honesto. El ícono
comunica "este artículo no tiene foto"; una imagen de stock finge que sí y
ensucia la grilla con algo que no aporta información. El interruptor de lista
cubre el caso de catálogos sin fotos mejor que cualquier placeholder.

---

## Fuera de alcance V1

- **Búsqueda en el servidor.** El catálogo completo se sigue enviando en cada
  carga (~2 KB por artículo). Es deuda previa a este trabajo y no lo bloquea.
- **Ticket de impresión y pantalla post-venta.** Hoy redirige al listado con un
  mensaje.
- **Campos del payload de entregas en español** (`entregas`, `articulo_id`,
  `cantidad`), pendientes del rename del módulo.
- **Tests automatizados de la pantalla.** Dependen del harness de SCRUM-67.
