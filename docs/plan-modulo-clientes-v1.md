# Plan de Implementación — Módulo de Clientes V1

## Resumen

Implementar el módulo de clientes completo para V1 siguiendo el requerimiento de Confluence, con foco en operatividad, alta simple y diseño visual alineado al design system de EPOS.

**Decisiones clave:**
- Todo en inglés: rutas, controller, modelo, vistas, nombres de ruta
- Todos los campos se agregan a la BD como **nullable** (preparados para futuro)
- Campos obligatorios en formulario: `business_name`, `tax_id`, `tax_status`
- Lo fiscal/AFIP queda preparado en BD pero **no se implementa en UI** en esta versión
- El diseño visual sigue el layout definido en `design_system/clients-ui-base/`
- `email` en `customers` es dato de contacto comercial, no identificador — **no obligatorio**
- Compatible con migración futura a **laravel-permission** (no afecta la estructura de `customers`)
- Vinculación `Customer ↔ User` (ecommerce) queda **fuera de scope**, se retoma en feature separado

---

## Fase 1 — Base de Datos

### 1.1 Modificar migración existente `0001_01_01_000011_create_customers_table.php`

> Estamos en desarrollo sin producción — se edita la migración directamente y se ejecuta `php artisan migrate:fresh --seed`.

Columnas a agregar:

| Campo | Tipo | Notas |
|---|---|---|
| `fantasy_name` | string(255), nullable | Nombre de fantasía / comercial |
| `person_type` | string(20), NOT NULL, default "fisica" | "fisica" / "juridica" |
| `dni` | string(8), nullable | DNI — personas físicas |
| `cellphone` | string(50), nullable | Celular |
| `notes` | text, nullable | Observaciones internas |
| `fiscal_name` | string(255), nullable | Razón social fiscal — para V2 AFIP |
| `fiscal_address` | string(255), nullable | Domicilio fiscal — para V2 AFIP |

Columnas a modificar:

- `address`: NOT NULL → **nullable**
- `tax_id`: NOT NULL → **nullable** (CUIT/CUIL — requerido solo si `person_type = juridica`)
- `tax_status`: nullable → **NOT NULL**

### 1.3 Resultado final de la tabla `customers`

```
id
business_name        — string, NOT NULL
fantasy_name         — string, nullable
person_type          — string, NOT NULL, default "fisica"  ("fisica" / "juridica")
tax_id               — string(13), nullable                (CUIT/CUIL — requerido si juridica)
dni                  — string(8), nullable                 (DNI — requerido si fisica)
phone                — string, nullable
cellphone            — string, nullable
email                — string, nullable       (contacto comercial, no identificador)
address              — string, nullable
city_id              — FK, nullable
state_id             — FK, nullable
zip_code             — string(10), nullable
tax_status           — string, NOT NULL       (condición IVA)
fiscal_name          — string, nullable       (V2 AFIP)
fiscal_address       — string, nullable       (V2 AFIP)
notes                — text, nullable
credit               — decimal(12,2), default 0
active               — boolean, default true
soft_deletes
timestamps
```

### 1.4 Nota sobre vinculación con ecommerce

> Fuera de scope en V1. Se retoma en feature separado.

La tabla no incluye `user_id` por ahora. Cuando se implemente la vinculación `Customer ↔ User`, se agregará mediante una nueva migración con la lógica de matching por `tax_id` / `dni` definida en ese momento.

---

## Fase 2 — Backend (Model + Controller + Rutas)

### 2.1 Renombrar / Refactorizar

| Antes | Después |
|---|---|
| `ClienteController` | `CustomerController` |
| Rutas `clientes.*` | `customers.*` |
| Vistas `pages/Clientes/*` | `pages/Customers/*` |
| Parámetro `$cliente` | `$customer` |

### 2.2 Actualizar modelo `Customer`

- Agregar nuevos campos a `$fillable`
- Agregar casts necesarios
- Mantener relaciones existentes (city, state, sales, quotes)

### 2.3 `CustomerController` — Validaciones

| Campo | Regla |
|---|---|
| `business_name` | required, string, max:255 |
| `person_type` | required, in:fisica,juridica |
| `tax_id` | required si `person_type = juridica`, nullable si física |
| `dni` | required si `person_type = fisica`, nullable si jurídica |
| `tax_status` | required, string, max:50 |
| Todo lo demás | nullable + tipo correspondiente |

### 2.4 `CustomerController` — Funcionalidades

- **index:** búsqueda por nombre/documento/email/teléfono + filtros (active, tax_status)
- **store / update:** con validaciones V1
- **toggleActive:** endpoint PATCH para cambiar estado
- **accountStatement:** estado de cuenta básico
- **exportExcel / exportPdf:** exportaciones
- **destroy:** se elimina o se convierte en inactivación

### 2.5 Rutas

```php
// routes/web.php (tenant)
Route::resource('customers', CustomerController::class)->except(['show', 'destroy']);
Route::patch('customers/{customer}/toggle-active', [CustomerController::class, 'toggleActive'])->name('customers.toggle-active');
Route::get('customers/{customer}/account-statement', [CustomerController::class, 'accountStatement'])->name('customers.account-statement');
Route::get('customers/{customer}/account-statement/export-excel', [CustomerController::class, 'exportExcel'])->name('customers.account-statement.export-excel');
Route::get('customers/{customer}/account-statement/export-pdf', [CustomerController::class, 'exportPdf'])->name('customers.account-statement.export-pdf');
```

### 2.6 Nombres de ruta resultantes

| Nombre | Método | URI |
|---|---|---|
| `customers.index` | GET | `/customers` |
| `customers.create` | GET | `/customers/create` |
| `customers.store` | POST | `/customers` |
| `customers.edit` | GET | `/customers/{customer}/edit` |
| `customers.update` | PUT | `/customers/{customer}` |
| `customers.toggle-active` | PATCH | `/customers/{customer}/toggle-active` |
| `customers.account-statement` | GET | `/customers/{customer}/account-statement` |
| `customers.account-statement.export-excel` | GET | `/customers/{customer}/account-statement/export-excel` |
| `customers.account-statement.export-pdf` | GET | `/customers/{customer}/account-statement/export-pdf` |

---

## Fase 3 — Frontend (React + Design System)

> `design_system/clients-ui-base/create-clients.html` es **solo referencia visual** (estructura, layout, secciones, jerarquía). La implementación usa exclusivamente los componentes existentes en `components/ui/`. No se agregan estilos custom inline ni clases fuera del sistema de diseño. Si falta algún componente, se crea siguiendo el patrón shadcn existente.

### 3.1 Estructura de archivos (React)

```
resources/js/pages/Customers/
├── Index.tsx
├── Create.tsx
├── Edit.tsx
└── AccountStatement.tsx
```

> Se eliminan los archivos viejos de `pages/Clientes/` una vez migrado.

### 3.2 Pantalla: Index (Listado)

Siguiendo el pattern "List View" del design system:
- Header con título + botón "Nuevo Cliente"
- Barra de búsqueda + filtros (estado, condición IVA)
- Tabla con columnas: Nombre, Documento, Contacto, Condición IVA, Estado, Acciones
- Badge de estado (activo/inactivo)
- Paginación
- Acciones: ver estado de cuenta, editar, toggle activo

### 3.3 Pantalla: Create / Edit

Layout basado en `design_system/clients-ui-base/create-clients.html`:

**Estructura 2 columnas (lg:grid-cols-3):**

**Col izquierda (2/3):**
- Sección "Datos Identificatorios"
  - Tipo de persona (radio: Física/Jurídica)
  - Nombre / Razón Social *
  - Nombre Fantasía
  - Tipo Documento (select)
  - Número de Documento *
- Sección "Datos de Contacto"
  - Teléfono
  - Celular
  - Email
  - Domicilio
  - Localidad (combobox)
  - Provincia (combobox) + C.P.

**Col derecha (1/3):**
- Sección "Comerciales"
  - Condición frente al IVA * (select)
  - Estado del cliente (toggle)
  - Observaciones internas (textarea)

**Header:**
- Breadcrumb: Customers > New Customer
- Título: "New Customer" / "Edit Customer"
- Botones: Cancel + Save Customer

### 3.4 Pantalla: Account Statement (mejora básica)

- Datos del cliente (card resumen)
- Métricas: total vendido, total cobrado, saldo pendiente, saldo a favor
- Tabla de últimas ventas/pagos
- Exportar PDF / Excel (ya existe)

---

## Fase 4 — Ajustes de estilo visual

### 4.1 Verificar consistencia con design system

- Colores: primary `#0B7D6E`, backgrounds, borders
- Tipografía: Instrument Sans (o Inter como fallback actual)
- Border radius: inputs 12px, cards 16-20px
- Shadows: sutiles (shadow-shadcn)
- Spacing: padding cards 20-24, gap entre secciones 24

### 4.2 Componentes a usar

- `Card` / secciones con border
- `Input`, `Select`, `Combobox` (ya existen en shadcn)
- `Badge` para estados
- `Switch` para toggle activo
- `FormField` para labels + error
- `PageHeader` para header de página
- `DataTable` para listado

---

## Orden de ejecución

| # | Tarea | Dependencia |
|---|---|---|
| 1 | Modificar migración existente + `migrate:fresh --seed` | — |
| 2 | Actualizar modelo Customer ($fillable, casts) | 1 |
| 3 | Renombrar `ClienteController` → `CustomerController` | 2 |
| 4 | Actualizar rutas (inglés, nuevos endpoints) | 3 |
| 5 | Crear `pages/Customers/Index.tsx` (nuevo, con filtros) | 4 |
| 6 | Crear `pages/Customers/Create.tsx` (nuevo layout) | 4 |
| 7 | Crear `pages/Customers/Edit.tsx` (nuevo layout) | 4 |
| 8 | Crear `pages/Customers/AccountStatement.tsx` | 4 |
| 9 | Eliminar archivos viejos `pages/Clientes/*` | 5, 6, 7, 8 |
| 10 | Revisión visual / ajustes design system | 5, 6, 7, 8 |

---

## Fuera de alcance V1

- Consulta AFIP/ARCA (se deja el botón preparado pero deshabilitado)
- Datos fiscales avanzados (fiscal_name, fiscal_address quedan en BD pero no en UI)
- Historial comercial completo (solo estado de cuenta básico)
- Exportaciones avanzadas
- Múltiples domicilios
- Scoring o segmentación
