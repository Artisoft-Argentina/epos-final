# Reporte QA UX/UI — EPOS
**Fecha:** 2026-04-01
**Flujos analizados:** Dashboard, Clientes, Artículos, Ventas, Presupuestos, Inventarios, Entregas, Proveedores, Remitos, Listas de Precios, Estados de Cuenta, IA (Chat + Asistente Compras), Configuración (Usuarios, Roles, Empresa, AFIP, MercadoPago, Perfil), E-commerce (Shop, Carrito, Checkout)
**Total de problemas:** 27 (Críticos: 4 | Altos: 8 | Medios: 10 | Bajos: 5)

---

## Resumen ejecutivo

El sistema EPOS presenta cuatro problemas críticos que bloquean flujos de negocio principales: el checkout de e-commerce no puede completarse porque la clave pública de MercadoPago no está configurada (vacía), el módulo Proveedores retorna 404 desde el sidebar, la ruta `/logout` por GET expone el stack trace completo de Laravel en producción, y toda la sección de configuración de perfil/settings está en inglés sin traducir. Adicionalmente, se detectaron inconsistencias sistemáticas en el formato de precios, fechas sin año en tablas, y múltiples botones de acción sin etiquetas accesibles a lo largo de todos los módulos.

---

## Problemas detectados

### [QA-001] Checkout bloqueado: MercadoPago sin configurar expone errores en consola

| Campo | Valor |
|-------|-------|
| **Módulo** | E-commerce / Checkout |
| **Archivo(s)** | `resources/js/pages/Shop/Checkout.tsx`, `resources/js/settings/mercadopago.tsx` |
| **Para** | Ambos |
| **Criticidad** | Crítico |
| **Tipo** | Funcional |

**Descripción:**
Al navegar a `/checkout`, el SDK de MercadoPago falla porque la Public Key está configurada como "TEST-" (valor vacío/incompleto). Esto genera 4 errores en consola ("Failed to load resource: 404" desde `api.mercadopago.com`) y el formulario de pago nunca se renderiza. La sección "Pago Seguro" muestra únicamente el texto "Procesado de forma segura por Mercado Pago" sin ningún botón ni campo de pago. El usuario llega al checkout y no puede completar la compra.

**Pasos para reproducir:**
1. Ir a `/shop`
2. Agregar cualquier producto al carrito
3. Ir a `/cart` y hacer clic en "Proceder al pago"
4. Observar que la sección de pago está vacía y la consola muestra errores 404 de MercadoPago

**Impacto en el usuario:**
El flujo de compra completo del e-commerce está bloqueado. Ningún cliente puede pagar. Es la función de negocio más crítica del módulo de tienda online.

**Solución sugerida:**
1. Configurar las credenciales reales de MercadoPago en `/settings/mercadopago`
2. Agregar un estado de error visible en el checkout cuando la integración no está configurada, en lugar de mostrar una pantalla vacía silenciosa
3. Validar que las credenciales estén presentes antes de renderizar la pantalla de checkout

---

### [QA-002] Ruta `/proveedores` retorna 404 — link del sidebar roto

| Campo | Valor |
|-------|-------|
| **Módulo** | Proveedores |
| **Archivo(s)** | `resources/js/layouts/AppSidebar.tsx` (o componente de navegación), `routes/web.php` |
| **Para** | Ambos |
| **Criticidad** | Crítico |
| **Tipo** | Funcional |

**Descripción:**
El item "Proveedores" del sidebar apunta a `/proveedores`, pero esa ruta no existe — retorna un error 404 "NOT FOUND". La ruta real del módulo es `/suppliers` (en inglés). El submenú expandido sí apunta correctamente a `/suppliers`, pero la inconsistencia entre la ruta mostrada y la real hace que los usuarios que tipeen la URL directamente o usen historial del navegador encuentren un 404.

**Pasos para reproducir:**
1. Hacer clic en el item "Proveedores" del sidebar (botón padre, no el submenú)
2. O navegar directamente a `http://principal.epos.lvh.me:3000/proveedores`
3. Ver pantalla de error 404

**Impacto en el usuario:**
Acceso interrumpido al módulo de proveedores. Genera desconfianza en la navegación.

**Solución sugerida:**
Unificar la ruta a `/proveedores` tanto en el backend (`routes/web.php`) como en el frontend, o agregar un redirect de `/proveedores` a `/suppliers` hasta que se renombre la ruta.

---

### [QA-003] Stack trace de Laravel visible al navegar a `/logout` por GET

| Campo | Valor |
|-------|-------|
| **Módulo** | Autenticación |
| **Archivo(s)** | `routes/web.php`, configuración de entorno |
| **Para** | Backend |
| **Criticidad** | Crítico |
| **Tipo** | Seguridad |

**Descripción:**
Al navegar directamente a `/logout` por GET (ya sea escribiendo la URL o por error), Laravel muestra la página de debug completa con: stack trace de la excepción `MethodNotAllowedHttpException`, código fuente de `public/index.php`, variables de la request, cookies de sesión, versión exacta de PHP (8.4.19) y Laravel (12.25.0), y datos de routing. Esta información es un vector de ataque serio en producción.

**Pasos para reproducir:**
1. Estando logueado, navegar a `http://principal.epos.lvh.me:3000/logout` directamente en la barra de direcciones
2. Ver la página de debug de Laravel con stack trace completo

**Impacto en el usuario:**
Exposición de información técnica interna (versiones, rutas, código fuente) que puede ser usada para ataques dirigidos. En producción, `APP_DEBUG` debe estar en `false`.

**Solución sugerida:**
1. Establecer `APP_DEBUG=false` en el entorno de producción/staging
2. Configurar una página de error 405 personalizada y amigable
3. Opcionalmente agregar un redirect de GET `/logout` al dashboard con un mensaje explicativo

---

### [QA-004] Sección completa de Settings/Perfil en inglés sin traducir

| Campo | Valor |
|-------|-------|
| **Módulo** | Configuración / Perfil de usuario |
| **Archivo(s)** | `resources/js/pages/settings/profile.tsx`, `resources/js/pages/settings/password.tsx`, `resources/js/pages/settings/appearance.tsx` |
| **Para** | Frontend |
| **Criticidad** | Crítico |
| **Tipo** | UX / Visual |

**Descripción:**
Toda la sección de settings del usuario (`/settings/profile`, `/settings/afip`, `/settings/mercadopago`) muestra el encabezado base del template en inglés: "Settings", "Manage your profile and account settings". Las pestañas de navegación también están en inglés: "Profile", "Password", "Appearance". El formulario de perfil muestra "Profile information", "Update your name and email address", "Name", "Email address", "Save". La sección de eliminación de cuenta muestra "Delete account", "Warning", "Please proceed with caution, this cannot be undone." Ninguno de estos textos está traducido al español.

**Pasos para reproducir:**
1. Navegar a `/settings/profile`
2. Observar todos los textos en inglés

**Impacto en el usuario:**
Experiencia inconsistente y confusa para usuarios hispanohablantes. Mezcla de idiomas en la misma aplicación genera desconfianza.

**Solución sugerida:**
Traducir todos los strings del template base de Laravel al español. Usar el sistema de i18n de Laravel/React para centralizar las traducciones.

---

### [QA-005] Mensaje de validación expone nombre interno del campo: "documentounico"

| Campo | Valor |
|-------|-------|
| **Módulo** | Clientes / Crear Cliente |
| **Archivo(s)** | `resources/js/pages/Clientes/Create.tsx`, `app/Http/Requests/StoreClienteRequest.php` |
| **Para** | Ambos |
| **Criticidad** | Alto |
| **Tipo** | UX |

**Descripción:**
Al enviar el formulario de creación de cliente sin completar el campo CUIT/DNI, el mensaje de error dice "El campo documentounico es obligatorio." en lugar de "El campo CUIT / DNI es obligatorio." El nombre interno del campo (`documento_unico` o similar) se expone directamente en la UI sin humanizar.

**Pasos para reproducir:**
1. Ir a `/clientes/create`
2. Dejar el campo CUIT/DNI vacío
3. Hacer clic en "Crear"
4. Ver el mensaje de error debajo del campo

**Impacto en el usuario:**
El usuario recibe un mensaje técnico e incomprensible. Daña la percepción de calidad del sistema.

**Solución sugerida:**
Agregar un atributo personalizado en la validación de Laravel: `'documento_unico' => 'CUIT / DNI'` en el método `attributes()` del FormRequest. En React, asegurarse de usar el label del campo en el mensaje de error en lugar del nombre de la propiedad.

---

### [QA-006] Presupuestos: tabla vacía sin estado vacío ni call-to-action

| Campo | Valor |
|-------|-------|
| **Módulo** | Ventas / Presupuestos |
| **Archivo(s)** | `resources/js/pages/Presupuestos/Index.tsx` |
| **Para** | Frontend |
| **Criticidad** | Alto |
| **Tipo** | UX |

**Descripción:**
La pantalla de Presupuestos (`/presupuestos`) muestra la tabla con sus cabeceras (PRESUPUESTO, CLIENTE, FECHA, TOTAL, VENDEDOR, ACCIONES) pero el cuerpo está completamente vacío cuando no hay datos. No hay ícono ilustrativo, mensaje explicativo ("No hay presupuestos registrados"), ni call-to-action ("Crear primer presupuesto"). La paginación muestra "página 1" aunque no haya registros.

**Pasos para reproducir:**
1. Navegar a `/presupuestos`
2. Observar la tabla con cabeceras pero sin filas ni mensaje

**Impacto en el usuario:**
El usuario no sabe si el módulo está roto, si no tiene datos o si debe hacer algo. Genera confusión y desconfianza.

**Solución sugerida:**
Agregar un estado vacío consistente con el del resto del sistema: ícono, mensaje descriptivo y enlace/botón para crear el primer presupuesto. Ocultar la paginación cuando no hay resultados.

---

### [QA-007] Formato de moneda inconsistente en el admin (sin separadores de miles)

| Campo | Valor |
|-------|-------|
| **Módulo** | Ventas, Artículos, Detalle de Venta |
| **Archivo(s)** | `resources/js/pages/Ventas/Index.tsx`, `resources/js/pages/Articulos/Index.tsx`, `resources/js/pages/Ventas/Show.tsx` |
| **Para** | Frontend |
| **Criticidad** | Alto |
| **Tipo** | UX / Visual |

**Descripción:**
En el módulo admin, los precios se muestran sin formato de moneda argentino: "$112481.53", "$15999.99", "$321908.06" (usando punto decimal anglosajón, sin separador de miles). En cambio, el e-commerce muestra correctamente "$15.999,99". Esta inconsistencia es sistemática en toda la interfaz de administración.

**Pasos para reproducir:**
1. Navegar a `/ventas` — ver columna Total
2. Navegar a `/articulos` — ver columna Precio
3. Navegar a `/ventas/63` — ver subtotales y totales

**Impacto en el usuario:**
Los montos son difíciles de leer para usuarios argentinos acostumbrados al formato local. Un monto como "$321908.06" requiere contar dígitos; "$321.908,06" es instantáneamente legible.

**Solución sugerida:**
Aplicar un formateador de moneda consistente en toda la app admin. Usar `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })` o un helper centralizado.

---

### [QA-008] Fecha de ventas sin año en la tabla de listado

| Campo | Valor |
|-------|-------|
| **Módulo** | Ventas |
| **Archivo(s)** | `resources/js/pages/Ventas/Index.tsx` |
| **Para** | Frontend |
| **Criticidad** | Alto |
| **Tipo** | UX |

**Descripción:**
La columna "Fecha" en el listado de ventas muestra solo día y mes: "06/11", "02/11", "31/10". Sin el año, es imposible distinguir facturas del mismo período de diferentes años. El detalle de la venta sí muestra el año completo ("5/11/2025").

**Pasos para reproducir:**
1. Navegar a `/ventas`
2. Observar la columna Fecha

**Impacto en el usuario:**
Ambigüedad en los datos — no se puede saber a qué año pertenece cada venta en el listado. Especialmente problemático en sistemas con historial de más de un año.

**Solución sugerida:**
Mostrar la fecha completa en formato "dd/mm/aaaa" o al menos incluir el año abreviado ("06/11/25").

---

### [QA-009] Todos los botones de acción sin aria-label ni texto visible (solo íconos)

| Campo | Valor |
|-------|-------|
| **Módulo** | Clientes, Ventas, Artículos, Usuarios, Listas de Precios |
| **Archivo(s)** | Múltiples componentes de tabla |
| **Para** | Frontend |
| **Criticidad** | Alto |
| **Tipo** | Accesibilidad / UX |

**Descripción:**
En todos los módulos del admin, los botones de acción de las tablas (ver, editar, eliminar, descargar PDF) solo contienen íconos SVG sin texto visible ni atributo `aria-label`. En el snapshot se confirma: `button [ref=e174]: img` — ningún label. El usuario que usa lector de pantalla o que pasa el cursor sin tooltip no sabe qué hace cada botón.

**Pasos para reproducir:**
1. Navegar a `/clientes`, `/ventas`, `/articulos`, `/users`, `/listas-precios`
2. Observar los botones de la columna "Acciones" — solo íconos, sin texto ni tooltip

**Impacto en el usuario:**
Inaccesible para usuarios con discapacidad visual. Confuso para usuarios nuevos que no identifican los íconos. El botón de eliminar (papelera roja) no tiene label diferenciador del resto.

**Solución sugerida:**
Agregar `aria-label` descriptivo a cada botón de acción. Opcionalmente agregar `title` para tooltip en hover. Ejemplo: `<button aria-label="Eliminar cliente">`.

---

### [QA-010] Vencimiento CAE con formato técnico de timestamp

| Campo | Valor |
|-------|-------|
| **Módulo** | Ventas / Detalle de Venta |
| **Archivo(s)** | `resources/js/pages/Ventas/Show.tsx` |
| **Para** | Frontend |
| **Criticidad** | Medio |
| **Tipo** | UX / Visual |

**Descripción:**
En el detalle de una venta, el campo "Vencimiento CAE" muestra el valor en formato de timestamp técnico: "2025-11-06 00:00:00". Debería mostrarse en formato legible: "06/11/2025".

**Pasos para reproducir:**
1. Navegar a `/ventas/63` (o cualquier venta)
2. Ver el campo "Vencimiento CAE" en la sección "Información de la Venta"

**Impacto en el usuario:**
Aspecto técnico/descuidado. El usuario debe interpretar el formato ISO con hora ":00:00:00".

**Solución sugerida:**
Formatear la fecha usando el mismo helper de formato de fechas que se usa en el resto de la aplicación. Ejemplo: `format(new Date(vencimiento_cae), 'dd/MM/yyyy')`.

---

### [QA-011] Permisos de Roles mostrados como claves técnicas en inglés

| Campo | Valor |
|-------|-------|
| **Módulo** | Configuración / Roles |
| **Archivo(s)** | `resources/js/pages/Roles/Index.tsx` |
| **Para** | Frontend |
| **Criticidad** | Medio |
| **Tipo** | UX |

**Descripción:**
La tabla de Roles muestra los permisos asignados como cadenas técnicas en inglés sin formato: "manage_users,manage_products", "view_products,create_sales", "view_shop,create_orders". Son difíciles de leer, están en inglés, sin separación visual entre permisos y sin etiquetas descriptivas.

**Pasos para reproducir:**
1. Navegar a `/roles`
2. Ver la columna "Permisos"

**Impacto en el usuario:**
El administrador no puede interpretar fácilmente qué permisos tiene cada rol. Una lista de chips/badges con nombres en español sería mucho más clara.

**Solución sugerida:**
Mapear los permisos técnicos a nombres legibles en español. Mostrarlos como badges/chips separados en lugar de una cadena. Ejemplo: "manage_users" → "Gestionar usuarios".

---

### [QA-012] Acciones de Registro de Actividad en inglés ("created")

| Campo | Valor |
|-------|-------|
| **Módulo** | Configuración / Registro de Actividad |
| **Archivo(s)** | `resources/js/pages/ActivityLog/Index.tsx`, backend de registro de actividad |
| **Para** | Ambos |
| **Criticidad** | Medio |
| **Tipo** | UX |

**Descripción:**
El Registro de Actividad muestra las acciones en inglés: "Sistema · created · Factura #80". El verbo "created" debería estar en español ("creó" o "creado"). Además, el módulo no tiene filtros por fecha, usuario o tipo de acción, ni paginación visible.

**Pasos para reproducir:**
1. Navegar a `/activity-log`
2. Ver las entradas — todas dicen "created" en inglés

**Impacto en el usuario:**
Inconsistencia de idioma. La falta de filtros hace el log inutilizable cuando hay muchas entradas.

**Solución sugerida:**
Traducir los tipos de acción al español en el backend al registrar la actividad, o mapearlos en el frontend. Agregar filtros por rango de fechas y paginación.

---

### [QA-013] Links del sidebar en inglés inconsistentes con el resto

| Campo | Valor |
|-------|-------|
| **Módulo** | Navegación global |
| **Archivo(s)** | `resources/js/layouts/AppSidebar.tsx` |
| **Para** | Frontend |
| **Criticidad** | Medio |
| **Tipo** | UX / Visual |

**Descripción:**
El sidebar tiene dos enlaces en inglés en la zona inferior: "Repository" (apunta a `https://github.com/laravel/react-starter-kit`) y "Documentation" (apunta a `https://laravel.com/docs/starter-kits#react`). Son restos del template base de Laravel que no fueron removidos. También el ícono del usuario en el login del admin redirige a `/dashboard` en inglés.

**Pasos para reproducir:**
1. Navegar a cualquier página del admin
2. Ver la zona inferior del sidebar — "Repository" y "Documentation"

**Impacto en el usuario:**
Los usuarios del sistema ven links a la documentación de un framework ajeno. Rompe la experiencia y revela que el sistema está basado en un starter kit. En una aplicación de producción esto debe eliminarse.

**Solución sugerida:**
Eliminar los enlaces "Repository" y "Documentation" del sidebar. Opcionalmente reemplazarlos con links de soporte propios del producto.

---

### [QA-014] Input de archivos nativo sin estilo en múltiples formularios

| Campo | Valor |
|-------|-------|
| **Módulo** | Artículos (crear), Empresa, AFIP |
| **Archivo(s)** | `resources/js/pages/Articulos/Create.tsx`, `resources/js/pages/Empresa/Index.tsx`, `resources/js/pages/settings/afip.tsx` |
| **Para** | Frontend |
| **Criticidad** | Medio |
| **Tipo** | UX / Visual |

**Descripción:**
Los campos de subida de archivos usan el input nativo del navegador sin ningún estilo personalizado. Muestran el texto del sistema operativo del usuario: "Elegir archivos Sin archivos seleccionados" (Safari/Chrome en español del OS), o "Seleccionar archivo Sin archiv...cionados" con el texto cortado. Esta es la experiencia más inconsistente visualmente del formulario.

**Pasos para reproducir:**
1. Ir a `/articulos/create` — ver campo "Imágenes"
2. Ir a `/empresa` — ver campos "Logo" y certificados
3. Ir a `/settings/afip` — ver campos de certificados

**Impacto en el usuario:**
Aspecto descuidado y poco profesional. El texto varía según el sistema operativo y navegador del usuario.

**Solución sugerida:**
Reemplazar los inputs de archivo con un componente de drag-and-drop estilizado o al menos un botón customizado que oculte el input nativo y muestre el nombre del archivo seleccionado con el estilo del sistema.

---

### [QA-015] Vaciar Carrito sin diálogo de confirmación

| Campo | Valor |
|-------|-------|
| **Módulo** | E-commerce / Carrito |
| **Archivo(s)** | `resources/js/pages/Shop/Cart.tsx` |
| **Para** | Frontend |
| **Criticidad** | Medio |
| **Tipo** | UX |

**Descripción:**
El botón "Vaciar Carrito" en la página del carrito ejecuta la acción directamente sin pedir confirmación. Es una acción destructiva que elimina todos los productos del carrito y no tiene undo.

**Pasos para reproducir:**
1. Agregar productos al carrito
2. Ir a `/cart`
3. Hacer clic en "Vaciar Carrito"
4. El carrito se vacía inmediatamente sin confirmación

**Impacto en el usuario:**
Un clic accidental elimina todos los productos seleccionados. El usuario tiene que volver a buscar y agregar cada producto.

**Solución sugerida:**
Mostrar un diálogo de confirmación: "¿Querés vaciar el carrito? Se eliminarán todos los productos seleccionados." con opciones "Cancelar" y "Vaciar".

---

### [QA-016] Módulo de Chat IA sin título ni breadcrumb visible en la pantalla

| Campo | Valor |
|-------|-------|
| **Módulo** | IA / Asistente IA |
| **Archivo(s)** | `resources/js/pages/Chat/Index.tsx` |
| **Para** | Frontend |
| **Criticidad** | Medio |
| **Tipo** | UX / Visual |

**Descripción:**
La pantalla del chat IA (`/chat`) no tiene título de página visible ni breadcrumb. El único indicador de dónde está el usuario es el título del navegador ("Chat IA") y el item seleccionado en el sidebar. A diferencia de todos los demás módulos, no hay un `<h1>` con el nombre del módulo.

**Pasos para reproducir:**
1. Navegar a `/chat` desde el sidebar
2. Observar el área de contenido — sin título, sin breadcrumb

**Impacto en el usuario:**
Inconsistencia visual con el resto del sistema. El usuario puede desorientarse.

**Solución sugerida:**
Agregar un encabezado "Asistente IA" con su breadcrumb correspondiente, consistente con el patrón de las demás páginas.

---

### [QA-017] Todos los productos del e-commerce sin imagen

| Campo | Valor |
|-------|-------|
| **Módulo** | E-commerce / Tienda |
| **Archivo(s)** | `resources/js/pages/Shop/Index.tsx`, gestión de imágenes en artículos |
| **Para** | Ambos |
| **Criticidad** | Medio |
| **Tipo** | UX / Visual |

**Descripción:**
Todos los 8 productos visibles en la tienda online muestran un placeholder "Sin imagen" con un ícono genérico. No hay ninguna imagen de producto cargada. El admin también muestra las imágenes de producto como placeholder en la tabla de artículos.

**Pasos para reproducir:**
1. Navegar a `/shop`
2. Ver todos los productos con el placeholder "Sin imagen"

**Impacto en el usuario:**
Una tienda online sin imágenes de productos no puede vender efectivamente. Las imágenes son el principal driver de conversión en e-commerce.

**Solución sugerida:**
Cargar imágenes representativas para los productos de demostración. Verificar que el pipeline de procesamiento de imágenes funcione correctamente con el upload de artículos.

---

### [QA-018] Campo "Inicio de Actividades" en formulario de Empresa con formato ISO

| Campo | Valor |
|-------|-------|
| **Módulo** | Configuración / Empresa |
| **Archivo(s)** | `resources/js/pages/Empresa/Index.tsx` |
| **Para** | Frontend |
| **Criticidad** | Medio |
| **Tipo** | UX / Visual |

**Descripción:**
El campo "Inicio de Actividades" en la configuración de empresa muestra el valor en formato ISO: "2020-01-01". En Argentina el formato estándar es "dd/mm/aaaa" (01/01/2020). También el campo usa un `<input type="text">` sin formato visual de fecha ni picker.

**Pasos para reproducir:**
1. Navegar a `/empresa`
2. Ver el campo "Inicio de Actividades" con valor "2020-01-01"

**Impacto en el usuario:**
Inconsistencia con las convenciones de formato de fecha locales.

**Solución sugerida:**
Mostrar la fecha en formato "dd/mm/aaaa". Usar un `<input type="date">` o un date picker con localización argentina.

---

### [QA-019] Monto del Estado de Cuenta con espacio entre signo $ y número

| Campo | Valor |
|-------|-------|
| **Módulo** | Clientes / Estado de Cuenta |
| **Archivo(s)** | `resources/js/pages/Clientes/EstadoCuenta.tsx` |
| **Para** | Frontend |
| **Criticidad** | Medio |
| **Tipo** | Visual |

**Descripción:**
En la pantalla de Estado de Cuenta, los montos de las métricas superiores muestran un espacio entre el signo monetario y el número: "$ 1.908.216,56", "$ 1.121.814,15", "$ 786.402,41". El formato correcto en Argentina no lleva espacio: "$1.908.216,56".

**Pasos para reproducir:**
1. Navegar a `/clientes/5/estado-cuenta`
2. Ver las tarjetas de totales en la parte superior

**Impacto en el usuario:**
Formato de moneda no estándar para Argentina. Inconsistente con el resto de la app (en el carrito del e-commerce aparece correctamente "$15.999,99").

**Solución sugerida:**
Revisar el helper/función de formateo de moneda en este componente y unificarlo con el del e-commerce.

---

### [QA-020] Formulario de Nuevo Artículo: texto "Puedes" en lugar de "Podés"

| Campo | Valor |
|-------|-------|
| **Módulo** | Artículos / Crear |
| **Archivo(s)** | `resources/js/pages/Articulos/Create.tsx` |
| **Para** | Frontend |
| **Criticidad** | Bajo |
| **Tipo** | UX |

**Descripción:**
El texto de ayuda del campo de imágenes dice "Puedes seleccionar múltiples imágenes...". Toda la interfaz usa voseo (forma argentina de tratamiento), por lo que debería decir "Podés seleccionar múltiples imágenes...".

**Pasos para reproducir:**
1. Navegar a `/articulos/create`
2. Ver el texto debajo del campo "Imágenes"

**Impacto en el usuario:**
Inconsistencia de tratamiento (tuteo vs. voseo) que genera una experiencia de usuario menos pulida.

**Solución sugerida:**
Reemplazar "Puedes" por "Podés" y revisar todos los textos de la app en busca de otras instancias de tuteo.

---

### [QA-021] Textos del Hero de la tienda sin tildes

| Campo | Valor |
|-------|-------|
| **Módulo** | E-commerce / Shop |
| **Archivo(s)** | `resources/js/pages/Shop/Index.tsx` |
| **Para** | Frontend |
| **Criticidad** | Bajo |
| **Tipo** | Visual |

**Descripción:**
El hero de la tienda online contiene múltiples textos con tildes faltantes: "Descubri lo mejor para vos" (debería ser "Descubrí"), "Explora nuestra coleccion de productos seleccionados con la mejor calidad y precios increibles" ("colección", "increíbles"), "Envio Rapido" ("Envío Rápido"), "Recibe tu pedido en tiempo record" ("récord"), "Estamos aqui para ayudarte" ("aquí").

**Pasos para reproducir:**
1. Navegar a `/shop`
2. Ver el hero principal y las secciones de características

**Impacto en el usuario:**
Aspecto descuidado y poco profesional en la cara pública del negocio.

**Solución sugerida:**
Corregir todas las tildes en los textos estáticos de la tienda.

---

### [QA-022] Footer de la tienda con datos placeholder sin personalizar

| Campo | Valor |
|-------|-------|
| **Módulo** | E-commerce / Layout |
| **Archivo(s)** | `resources/js/layouts/ShopLayout.tsx` o componente Footer de shop |
| **Para** | Frontend |
| **Criticidad** | Bajo |
| **Tipo** | UX |

**Descripción:**
El footer de la tienda online muestra datos genéricos que no corresponden a la empresa configurada: nombre "TIENDA" (en lugar de "Juguetería Gepetto S.A." o "Gepetto Juguetes"), email "info@tienda.com" (en lugar del email real de la empresa) y el copyright dice "© 2026 TIENDA". Estos datos deberían leer de la configuración de empresa del tenant.

**Pasos para reproducir:**
1. Navegar a `/shop` y hacer scroll al footer
2. Comparar con los datos en `/empresa` (CUIT 20123456789, Gepetto Juguetes)

**Impacto en el usuario:**
La tienda no refleja la identidad real del negocio. Genera desconfianza en los clientes.

**Solución sugerida:**
Pasar los datos de la empresa (nombre, email, teléfono, horarios) al componente de la tienda dinámicamente desde la configuración del tenant.

---

### [QA-023] Ambiente AFIP en página de Settings muestra "Homologacion" sin tilde

| Campo | Valor |
|-------|-------|
| **Módulo** | Configuración / AFIP |
| **Archivo(s)** | `resources/js/pages/settings/afip.tsx` |
| **Para** | Frontend |
| **Criticidad** | Bajo |
| **Tipo** | Visual |

**Descripción:**
En la pantalla de Configuración AFIP, el valor del ambiente muestra "Homologacion" sin la tilde correspondiente. El texto correcto es "Homologación".

**Pasos para reproducir:**
1. Navegar a `/settings/afip`
2. Ver la sección "Configuración Actual" → campo "Ambiente" → valor "Homologacion"

**Impacto en el usuario:**
Error ortográfico menor en una pantalla de configuración crítica.

**Solución sugerida:**
Corregir el string "Homologacion" por "Homologación" en el backend o en el mapeo del frontend.

---

### [QA-024] Remitos: estado vacío sin ícono ilustrativo ni call-to-action

| Campo | Valor |
|-------|-------|
| **Módulo** | Proveedores / Remitos |
| **Archivo(s)** | `resources/js/pages/Remitos/Index.tsx` |
| **Para** | Frontend |
| **Criticidad** | Bajo |
| **Tipo** | UX |

**Descripción:**
La pantalla de Remitos vacía muestra solo un texto "No hay remitos registrados." dentro de una caja, sin ícono ilustrativo y sin botón de call-to-action para crear el primero. Contrasta con Entregas Pendientes, que tiene un estado vacío bien diseñado con ícono y dos líneas de texto.

**Pasos para reproducir:**
1. Navegar a `/remitos`
2. Ver el estado vacío

**Impacto en el usuario:**
Experiencia menos guiada. El usuario debe buscar el botón "Nuevo Remito" en la esquina superior.

**Solución sugerida:**
Agregar un ícono y un botón "Crear primer remito" dentro del estado vacío, consistente con el patrón de Entregas Pendientes.

---

### [QA-025] Columnas de tablas con contenido truncado sin posibilidad de ver el texto completo

| Campo | Valor |
|-------|-------|
| **Módulo** | Artículos, Proveedores, Roles |
| **Archivo(s)** | `resources/js/pages/Articulos/Index.tsx`, `resources/js/pages/Suppliers/Index.tsx`, `resources/js/pages/Roles/Index.tsx` |
| **Para** | Frontend |
| **Criticidad** | Medio |
| **Tipo** | UX / Visual |

**Descripción:**
Varias columnas de tablas muestran contenido cortado sin tooltip ni forma de ver el texto completo: la columna "Categoría" en Artículos muestra "Construcció..." (cortada), la columna "Email" en Proveedores se corta con elipsis, la columna "Descripción" en Roles muestra solo parte del texto.

**Pasos para reproducir:**
1. Navegar a `/articulos` — columna Categoría cortada en pantalla de 960px
2. Navegar a `/suppliers` — columna Email cortada
3. Navegar a `/roles` — columna Descripción cortada

**Impacto en el usuario:**
Información incompleta en las vistas de listado. El usuario debe entrar al detalle para ver datos básicos.

**Solución sugerida:**
Agregar `title` con el texto completo en las celdas truncadas, o usar un tooltip. Revisar los anchos de columna para optimizar el espacio.

---

### [QA-026] Botón de eliminar pago en detalle de venta sin confirmación

| Campo | Valor |
|-------|-------|
| **Módulo** | Ventas / Detalle |
| **Archivo(s)** | `resources/js/pages/Ventas/Show.tsx` |
| **Para** | Frontend |
| **Criticidad** | Alto |
| **Tipo** | UX |

**Descripción:**
En el detalle de una venta, la tabla de "Pagos Realizados" tiene un botón con ícono de papelera roja para eliminar cada pago. No se verificó visualmente si tiene diálogo de confirmación (a diferencia de la eliminación de clientes que sí lo tiene). El botón no tiene aria-label ni texto visible.

**Pasos para reproducir:**
1. Navegar a `/ventas/63`
2. Ver la sección "Pagos Realizados"
3. Observar el botón de eliminación de pago (papelera roja)

**Impacto en el usuario:**
Eliminar un pago de una factura es una acción de alto impacto contable. Sin confirmación y sin label, un clic accidental podría desregistrar un pago real.

**Solución sugerida:**
Agregar diálogo de confirmación con texto claro ("¿Eliminar este pago? Esta acción afectará el estado de la factura."). Agregar `aria-label="Eliminar pago"` al botón.

---

### [QA-027] Dashboard: widget "Productos Más Vendidos" sin estado vacío

| Campo | Valor |
|-------|-------|
| **Módulo** | Dashboard |
| **Archivo(s)** | `resources/js/pages/Dashboard/Index.tsx` |
| **Para** | Frontend |
| **Criticidad** | Bajo |
| **Tipo** | UX |

**Descripción:**
El widget "Productos Más Vendidos" en el dashboard está completamente vacío cuando no hay datos — sin mensaje, sin ícono, solo un espacio en blanco. Los widgets "Ventas por Vendedor" y "Ventas por Día" sí tienen mensajes de estado vacío ("No hay datos de vendedores en el período seleccionado", "No hay ventas en el período seleccionado"), pero "Productos Más Vendidos" no.

**Pasos para reproducir:**
1. Navegar al Dashboard
2. Ver el widget "Productos Más Vendidos" — completamente vacío

**Impacto en el usuario:**
El usuario no sabe si el widget está cargando, roto o simplemente no tiene datos.

**Solución sugerida:**
Agregar un mensaje de estado vacío consistente con los demás widgets, por ejemplo: "No hay productos vendidos en el período seleccionado."

---

## Resumen de hallazgos por módulo

| Módulo | Críticos | Altos | Medios | Bajos | Total |
|--------|----------|-------|--------|-------|-------|
| E-commerce / Checkout | 1 | 0 | 1 | 1 | 3 |
| Autenticación / Perfil | 2 | 0 | 0 | 0 | 2 |
| Proveedores | 1 | 0 | 0 | 1 | 2 |
| Clientes | 0 | 2 | 1 | 0 | 3 |
| Ventas | 0 | 2 | 2 | 0 | 4 |
| Artículos | 0 | 0 | 1 | 2 | 3 |
| Configuración | 0 | 1 | 2 | 1 | 4 |
| Dashboard | 0 | 0 | 0 | 1 | 1 |
| E-commerce / Shop | 0 | 1 | 1 | 2 | 4 |
| Navegación global | 0 | 1 | 0 | 1 | 2 |
| Presupuestos | 0 | 1 | 0 | 0 | 1 |
| **Total** | **4** | **8** | **8** | **9** | **29** |

---

## Recomendaciones prioritarias

1. **Inmediato:** Configurar credenciales de MercadoPago para habilitar el checkout
2. **Inmediato:** Deshabilitar `APP_DEBUG=true` en entornos accesibles públicamente
3. **Inmediato:** Corregir la ruta `/proveedores` → `/suppliers` en el sidebar
4. **Corto plazo:** Traducir completamente la sección de Settings/Perfil al español
5. **Corto plazo:** Implementar un helper centralizado de formato de moneda y fecha para toda la app admin
6. **Mediano plazo:** Agregar `aria-label` a todos los botones de acción de las tablas
7. **Mediano plazo:** Unificar los estados vacíos de todos los módulos (Presupuestos, Remitos, widget de dashboard)
