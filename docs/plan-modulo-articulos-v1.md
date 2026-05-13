# Plan — Módulo de Productos v1

Referencia Confluence: https://artisoft-sys.atlassian.net/wiki/spaces/AS/pages/4259842

---

## Estado actual (diagnóstico)

### Base de datos

| Campo | Estado | Acción |
|---|---|---|
| `sku` | ✅ existe | — |
| `name` | ✅ existe | — |
| `description` | ✅ existe | — |
| `unit` | ✅ existe | — |
| `price` | ✅ existe | — |
| `tax_rate` | ✅ existe | — |
| `min_stock` | ✅ existe | — |
| `brand_id` | ✅ existe | — |
| `category_id` | ✅ existe | — |
| `supplier_id` | ✅ existe | — |
| `supplier_code` | ✅ existe | — |
| `active` | ✅ existe | — |
| `barcode` | ⚠️ existe | Mantener como nullable/unique — lo usa el módulo de códigos existente |
| `qr_code` | ⚠️ existe | Mantener como nullable/unique — lo usa el módulo de códigos existente |
| `ean` | ❌ falta | Agregar: EAN/GTIN opcional (Confluence §9.2) |
| `type` | ❌ falta | Agregar: enum `product`/`service`, default `product` (Confluence §5.2) |
| `cost` | ❌ falta | Agregar: costo unitario decimal nullable (Confluence §7.2) |

### Backend

| Archivo | Problema |
|---|---|
| `ArticuloController` | Nombre en español, lógica de negocio en el controller, usa `$request->except()`, no tiene `ProductService`, filtros incompletos, paginación de 5 |
| `Product` model | Sin `scopeActive`, `scopeSearch`, `scopeByType`, `scopeByCategory`, `scopeByBrand`, `scopeBySupplier` |
| Rutas | Usan `articulos` (español) — renombrar a `products` |
| Sin `ProductService` | Toda la lógica está inline en el controller |
| SKU autogenerado | No implementado (Confluence §9.1) |
| `destroy` | Elimina físicamente imágenes sin verificar historial |

### Frontend

| Archivo | Problema |
|---|---|
| `Articulos/Index.tsx` | Sin KPIs, sin filtros por categoría/marca/tipo/estado, `toast` sin importar, paginación de 5 |
| `Articulos/Create.tsx` | Sin breadcrumb, layout plano (no `lg:grid-cols-3`), usa `FileUpload` no estándar, sin campo `type`/`ean`, sin botón "Generar SKU" |
| `Articulos/Edit.tsx` | Usa `Label` + `InputError` directo en lugar de `FormField`, colores hardcodeados (`bg-red-500`), layout no estándar |
| `Articulos/Show.tsx` | Colores hardcodeados (`text-gray-500`, `bg-gray-50`, `text-green-600`), sin `Tabs variant="underline"`, sin breadcrumb, no sigue patrón de Cards del design system |

---

## Decisiones de diseño

### BD: `barcode` y `qr_code`
Se mantienen como campos almacenados (nullable, unique) por compatibilidad con el módulo de códigos (`CodigoController`, `CodigoDisplay`). Según Confluence §9.4, el barcode puede generarse on-the-fly, pero el módulo existente ya los persiste. No romper esa integración.

### Rutas: `articulos` → `products`
Renombrar rutas y carpeta de páginas. Actualizar todas las referencias en `web.php`, vistas y componentes. El controller pasa a llamarse `ProductController`.

### SKU autogenerado
Formato: `ART-000001` (correlativo, Confluence §9.1). El service consulta el último SKU con ese prefijo y genera el siguiente. El frontend muestra un botón "Generar" junto al campo SKU.

### Tipo de artículo
Switch/selector `product` / `service`. Los servicios no requieren tratamiento inventariable (Confluence §6.2) — en el Show se oculta la sección de stock si `type === 'service'`.

### Imágenes en Create/Edit
Se usa `input[type=file]` nativo con preview en React (sin `FileUpload` custom). En Edit se muestra la galería existente con botón eliminar y "Hacer principal" — sin modal, acción directa.

### Toggle activo/inactivo
Inline en la tabla, sin modal. Igual al módulo de clientes.

---

## Plan de implementación

### Fase 1 — Base de datos

**Paso 1.1** — Modificar migración `0001_01_01_000012_create_products_table.php`
- Agregar columna `ean` (string, nullable, unique) — EAN/GTIN comercial opcional
- Agregar columna `type` (string, default `'product'`) — `product` | `service`
- Agregar columna `cost` (decimal 12,2, nullable) — costo unitario

---

### Fase 2 — Backend

**Paso 2.1** — Actualizar modelo `Product`
- Agregar `ean`, `type`, `cost` a `$fillable` y `$casts`
- Agregar scopes: `scopeActive`, `scopeSearch`, `scopeByType`, `scopeByCategory`, `scopeByBrand`, `scopeBySupplier`

**Paso 2.2** — Crear `app/Services/ProductService.php`
- `create(array $data): Product`
- `update(Product $product, array $data): void`
- `toggleActive(Product $product): void`
- `generateSku(): string` — genera el próximo SKU correlativo (`ART-000001`)

**Paso 2.3** — Crear `app/Http/Controllers/ProductController.php`
- Reemplaza `ArticuloController` (que se elimina)
- Delgado: valida → llama service → retorna respuesta
- `index`: filtros por `search` (nombre, SKU, EAN), `active`, `category_id`, `brand_id`, `supplier_id`, `type` — paginación 15 — KPIs
- `store` / `update`: usa `$request->validated()`
- `destroy`: soft delete — no elimina imágenes físicamente si el producto tiene ventas/compras asociadas
- `toggleActive`: inline, retorna `back()`

**Paso 2.4** — Actualizar `app/Http/Controllers/ArticuloImagenController.php`
- Renombrar a `ProductImageController`
- Sin cambios funcionales, solo naming

**Paso 2.5** — Actualizar rutas en `routes/web.php`
- `articulos` → `products`
- `articulos.imagenes.*` → `products.images.*`
- Agregar ruta `products/{product}/toggle-active`
- Mantener rutas de códigos apuntando al nuevo nombre

---

### Fase 3 — Frontend

> Convención: renombrar carpeta `resources/js/pages/Articulos/` → `Products/`

**Paso 3.1** — `Products/Index.tsx`

Estructura:
1. `PageHeader` — título "Productos", descripción, botón "Nuevo Producto" + botón "Imprimir Etiquetas" (condicional si hay seleccionados)
2. KPI cards (4): Total Productos | Activos | Productos | Servicios
3. Filtros: búsqueda (nombre/SKU/EAN) + Select estado + Select categoría + Select marca + Select tipo
4. `DataTable` con columnas:
   - Checkbox selección
   - Imagen (thumbnail 40×40, placeholder si no tiene)
   - Nombre + SKU (dos líneas)
   - Tipo (`Badge` `info` para Producto, `secondary` para Servicio)
   - Precio (tabular-nums)
   - Categoría (`Badge secondary`)
   - Marca (text-muted-foreground)
   - Estado (`Badge success/secondary` con dot)
   - Acciones: Ver | Editar | Toggle activo
5. `Pagination`

**Paso 3.2** — `Products/Create.tsx`

Estructura (layout `lg:grid-cols-3`):
- Header: breadcrumb (`Productos > Nuevo Producto`) + título + botones Cancelar/Guardar
- Columna izquierda (2/3):
  - Card "Datos Generales": nombre*, descripción, SKU* (input + botón "Generar"), tipo (radio/select producto/servicio), estado (Switch + Badge)
  - Card "Datos Comerciales": precio*, costo, alícuota*, unidad*, categoría*, marca*, proveedor, código proveedor
- Columna derecha (1/3):
  - Card "Identificación": EAN/GTIN (opcional, con hint explicativo)
  - Card "Imágenes": dropzone nativo con preview grid, primera imagen = principal
- Botones Cancelar/Guardar repetidos al final del form

**Paso 3.3** — `Products/Edit.tsx`

Igual que Create, más:
- Header: breadcrumb (`Productos > {nombre} > Editar`)
- Galería de imágenes existentes: grid con botón eliminar (×) y botón "Principal" (solo si no es la principal)
- Sección "Agregar imágenes" debajo de la galería

**Paso 3.4** — `Products/Show.tsx`

Estructura:
1. Breadcrumb: `Productos > {nombre}`
2. `PageHeader`: nombre, badge tipo, badge estado, botones Editar + Toggle activo
3. KPI cards (4): Precio | Costo | Stock Actual | Stock Mínimo (stock oculto si `type === 'service'`)
4. `Tabs variant="underline"`:
   - **General**: grid 3 cols — Card "Datos Comerciales" (precio, costo, alícuota, unidad, proveedor, código proveedor) | Card "Clasificación" (categoría, marca) | Card "Descripción"
   - **Identificación**: Card centrada con SKU, EAN, barcode generado (imagen), QR generado (imagen), botones "Imprimir Etiqueta" y "Descargar PDF"
   - **Imágenes**: galería con imagen principal destacada
   - **Movimientos**: `DataTable` de movimientos de stock (oculto si `type === 'service'`)

---

### Fase 4 — Pantallas de referencia (design_system)

**Paso 4.1** — Crear `design_system/products-ui-base/list-products.html`
- Pantalla de listado con KPIs, filtros y tabla — usando tokens del design system real
- Todos los textos visibles usan "Productos" / "Producto" / "Servicio"

**Paso 4.2** — Actualizar `design_system/products-ui-base/create-product.html`
- Ajustar al layout `lg:grid-cols-3` con Cards estándar del design system
- Reemplazar colores custom por tokens (`bg-primary`, `text-muted-foreground`, etc.)

**Paso 4.3** — Actualizar `design_system/products-ui-base/detail-product.html`
- Ajustar al patrón Show del design system (breadcrumb, PageHeader, KPIs, Tabs)

---

## Orden de ejecución

```
1. Fase 1 — Migración (modify + fresh)
2. Fase 2.1 — Modelo Product
3. Fase 2.2 — ProductService
4. Fase 2.3 — ProductController
5. Fase 2.4 — ProductImageController
6. Fase 2.5 — Rutas
7. Fase 3.1 — Products/Index.tsx
8. Fase 3.2 — Products/Create.tsx
9. Fase 3.3 — Products/Edit.tsx
10. Fase 3.4 — Products/Show.tsx
11. Fase 4 — Pantallas de referencia design_system
```

---

## Archivos a crear / modificar / eliminar

### Crear
- `app/Services/ProductService.php`
- `app/Http/Controllers/ProductController.php`
- `app/Http/Controllers/ProductImageController.php`
- `resources/js/pages/Products/Index.tsx`
- `resources/js/pages/Products/Create.tsx`
- `resources/js/pages/Products/Edit.tsx`
- `resources/js/pages/Products/Show.tsx`
- `design_system/products-ui-base/list-products.html`

### Modificar
- `database/migrations/tenant/0001_01_01_000012_create_products_table.php`
- `app/Models/Product.php`
- `routes/web.php`
- `design_system/products-ui-base/create-product.html`
- `design_system/products-ui-base/detail-product.html`

### Eliminar
- `app/Http/Controllers/ArticuloController.php`
- `app/Http/Controllers/ArticuloImagenController.php`
- `resources/js/pages/Articulos/Index.tsx`
- `resources/js/pages/Articulos/Create.tsx`
- `resources/js/pages/Articulos/Edit.tsx`
- `resources/js/pages/Articulos/Show.tsx`

---

## Notas adicionales

### Terminología UI (español visible al usuario)
- El término visible en la UI es siempre **"Productos"** (nunca "Artículos")
- Botones: "Nuevo Producto", "Guardar Producto", "Eliminar Producto"
- Breadcrumbs: `Productos > Nuevo Producto`, `Productos > {nombre}`, `Productos > {nombre} > Editar`
- Mensajes toast: "Producto creado correctamente.", "Producto actualizado correctamente.", "Producto eliminado correctamente.", etc.
- Títulos de sección, placeholders y labels: usar "producto" / "productos"
- La distinción interna `product` / `service` se muestra al usuario como **"Producto"** / **"Servicio"**

### Código (inglés)
- Nombres de archivos, componentes, variables, rutas, columnas de BD: mantienen `product` / `products` en inglés
- El modelo se llama `Product`, el controller `ProductController`, las rutas `products.*`

### Otros
- El módulo de `CodigoController` y `CodigoDisplay` no se toca en esta iteración — solo se actualizan las referencias de rutas
- `Brands/Index` y `Categories/Index` están bien estructurados — no requieren cambios en esta iteración
- `SupplierController` tampoco requiere cambios
- El módulo de Inventario (`Stock`, `StockMovement`) se referencia en el Show pero no se modifica
- Después del `migrate:fresh --seed`, verificar que los seeders no referencien campos eliminados
