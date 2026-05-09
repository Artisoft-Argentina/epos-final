# Guía de Contribución — EPOS

Este documento define los estándares, convenciones y buenas prácticas que deben seguirse al contribuir al proyecto EPOS.
Aplica tanto para desarrollo humano como para asistentes de IA (Amazon Q, Copilot, Cursor, etc.).

> Los archivos fuente de estas reglas están en `.amazonq/rules/` y son leídos automáticamente por Amazon Q.

---

## Índice

- [Idioma](#idioma)
- [Backend — Convenciones](#backend--convenciones)
- [Backend — Arquitectura](#backend--arquitectura)
- [Backend — Buenas prácticas Laravel](#backend--buenas-prácticas-laravel)
- [Frontend — Design System](#frontend--design-system)
- [Frontend — Componentes](#frontend--componentes)
- [Frontend — Layouts](#frontend--layouts)
- [Frontend — TypeScript](#frontend--typescript)
- [Frontend — Modales vs. Páginas](#frontend--modales-vs-páginas)

---

## Idioma

| Contexto | Idioma |
|---|---|
| Código (clases, métodos, variables, rutas, columnas BD) | **Inglés** |
| Texto visible al usuario (toasts, labels, mensajes de error) | **Español** |
| Comentarios en el código | Español o inglés |
| Nombres de archivos y componentes React | **Inglés** |

---

## Backend — Convenciones

### Modelos
- Singular, PascalCase: `Customer`, `Sale`, `Product`, `SalePayment`
- Relaciones en inglés: `customer()`, `sales()`, `payments()`

### Controllers
- Singular, PascalCase, sufijo `Controller`: `CustomerController`, `SaleController`
- Métodos estándar: `index`, `create`, `store`, `show`, `edit`, `update`, `destroy`
- Métodos adicionales en camelCase: `toggleActive`, `accountStatement`, `exportExcel`

### Rutas
- Plural, kebab-case: `/customers`, `/customers/{customer}/account-statement`
- Nombres de ruta con punto: `customers.index`, `customers.toggle-active`
- Parámetros en singular: `{customer}`, `{sale}`, `{product}`

### Base de datos
- Tablas en plural, snake_case: `customers`, `sale_payments`, `price_lists`
- Columnas en snake_case: `business_name`, `tax_id`, `created_at`
- Foreign keys: `{model}_id` → `customer_id`, `state_id`

---

## Backend — Arquitectura

### Controllers delgados
Los controllers solo deben: recibir el request, validar, llamar al Service y retornar la respuesta.
**No deben contener lógica de negocio.**

```php
// ✅ Correcto
public function store(Request $request)
{
    $request->validate($this->rules($request));
    $this->customerService->create($request->validated());
    return redirect()->route('customers.index')->with('success', 'Cliente creado correctamente.');
}
```

### Services
La lógica de negocio va en `app/Services/`. Nombre: `{Model}Service`.

```php
class CustomerService
{
    public function create(array $data): Customer { ... }
    public function toggleActive(Customer $customer): void { ... }
}
```

### Validaciones
Reglas en método privado `rules()` en el controller, o en un `FormRequest` si son complejas.

```php
private function rules(Request $request): array
{
    return [
        'business_name' => 'required|string|max:255',
        'tax_id' => $request->person_type === 'juridica' ? 'required' : 'nullable',
    ];
}
```

### Modelos
- Siempre definir `$fillable` explícitamente. Nunca `$guarded = []`
- Definir `$casts` para booleans, decimals y dates
- Usar `SoftDeletes` en modelos que no deben eliminarse físicamente

### Migraciones
- **Desarrollo:** modificar migración existente + `migrate:fresh --seed`
- **Producción:** crear nueva migración incremental, nunca modificar existentes

---

## Backend — Buenas prácticas Laravel

### `$request->validated()` — siempre
```php
// ✅ Correcto
Customer::create($request->validated());

// ❌ Incorrecto
Customer::create($request->all());
```

### Eager loading — evitar N+1
```php
// ✅ Correcto
$customers = Customer::with(['city', 'state'])->paginate(15);
```

### Paginación obligatoria en index
```php
// ✅ Correcto
$query->orderBy('business_name')->paginate(15)->withQueryString();

// ❌ Incorrecto
$query->get();
```

### Query Scopes para filtros reutilizables
```php
// En el modelo
public function scopeActive(Builder $query): Builder
{
    return $query->where('active', true);
}

// En el controller
$query->active()->search($request->search);
```

### Inyección de dependencias via constructor
```php
// ✅ Correcto
class CustomerController extends Controller
{
    public function __construct(
        private readonly CustomerService $customerService
    ) {}
}
```

### Type hints siempre
```php
public function create(array $data): Customer { ... }
public function toggleActive(Customer $customer): void { ... }
public function findByTaxId(string $taxId): ?Customer { ... }
```

### Route Model Binding
```php
// ✅ Correcto
public function show(Customer $customer): Response { ... }

// ❌ Incorrecto
public function show(int $id): Response
{
    $customer = Customer::findOrFail($id);
}
```

### Policies para autorización
```php
// ✅ Correcto
$this->authorize('update', $customer);

// ❌ Incorrecto
if (auth()->user()->role !== 'admin') abort(403);
```

### Events/Listeners para acciones secundarias
Emails, notificaciones y logs externos van en Events/Listeners, no inline en controllers o services.

---

## Frontend — Design System

Antes de implementar cualquier pantalla nueva, consultar:

- `design_system/DESIGN.md` — tokens, colores, tipografía, spacing, radius
- `design_system/DESIGN-CONCEPTUAL.md` — principios visuales
- `design_system/ui-kit.html` — referencia visual HTML
- `resources/js/pages/design-system.tsx` — UI Kit implementado con los componentes reales

---

## Frontend — Componentes

**Siempre usar los componentes existentes en `resources/js/components/ui/`.**
Nunca crear estilos custom inline ni clases hardcodeadas que dupliquen lo que ya existe.

### Componentes disponibles
```
resources/js/components/ui/
  alert, badge, button, card, checkbox, combobox, dialog,
  input, label, select, separator, switch, tabs, textarea, tooltip

resources/js/components/
  action-button, data-table, delete-confirmation-dialog,
  form-field, page-header, pagination
```

### Tokens — nunca hardcodear colores
```tsx
// ✅ Correcto
className="bg-primary text-primary-foreground"
className="bg-success-soft text-success"
className="bg-destructive-soft text-destructive"
className="text-muted-foreground"

// ❌ Incorrecto
className="bg-emerald-50 text-emerald-600"
className="text-[#0B7D6E]"
className="bg-gray-100"   // usar bg-muted
```

### Cards con header propio
```tsx
<Card className="gap-0 py-0">
    <CardHeader className="border-b border-border px-6 py-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Icon className="size-4 text-primary" />
            Título
        </CardTitle>
    </CardHeader>
    <CardContent className="px-6 py-5">
        {/* contenido */}
    </CardContent>
</Card>
```

---

## Frontend — Layouts

### Index (listado)
1. `PageHeader` con título y botón de acción principal
2. KPI cards (si aplica)
3. Filtros y búsqueda
4. `DataTable` con paginación

### Create / Edit (formulario)
1. Breadcrumb
2. Header con título y botones Cancelar/Guardar
3. Grid `lg:grid-cols-3` — columna izquierda (2/3) principal, derecha (1/3) secundaria
4. Secciones con `Card gap-0 py-0`
5. Botones de acción repetidos al final

### Show (detalle)
1. Breadcrumb
2. `PageHeader` con nombre, badge de estado y acciones
3. Cards de resumen/KPIs
4. `Tabs variant="underline"` con contenido por sección

### Breadcrumb — obligatorio en Create, Edit y Show
```tsx
<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
    <Link href={route('module.index')} className="hover:text-primary transition-colors">
        Módulo
    </Link>
    <ChevronRight className="size-3.5" />
    <span className="text-foreground font-medium">Página actual</span>
</div>
```

---

## Frontend — TypeScript

### Siempre tipar props con interface
```tsx
// ✅ Correcto
interface Customer {
    id: number;
    business_name: string;
    tax_id: string | null;
    active: boolean;
}

interface Props {
    customers: {
        data: Customer[];
        links: any[];  // paginación Laravel — excepción aceptada
        meta: { total: number };
    };
}

export default function Index({ customers }: Props) { ... }

// ❌ Incorrecto
export default function Index({ customers }: any) { ... }
```

### interface vs type
- `interface` — objetos de dominio y props de componentes
- `type` — uniones y aliases: `type PersonType = 'fisica' | 'juridica'`

### Nullabilidad explícita
```tsx
interface Customer {
    fantasy_name: string | null;  // siempre declarar si puede ser null
}

{customer.fantasy_name && <p>{customer.fantasy_name}</p>}
```

### Evitar
- `any` — usar `unknown` con narrowing
- `as any` — indica problema de diseño
- `// @ts-ignore` — resolver el problema real

---

## Frontend — Modales vs. Páginas

### Usar Modal cuando:
- Formulario de **hasta 5 campos simples**
- Acción rápida y contextual (el usuario no pierde el contexto)
- Entidades secundarias: categorías, marcas, pagos, imágenes
- Confirmación de acción: eliminar, activar, cambiar estado

### Usar Página completa cuando:
- Formulario con **más de 5 campos** o múltiples secciones
- Entidad principal: clientes, productos, ventas, compras
- Lógica condicional o relaciones complejas

### Referencia rápida

| Caso | Recomendación |
|---|---|
| Crear categoría, marca, rol | Modal |
| Crear/editar cliente, producto, venta | Página completa |
| Registrar un pago | Modal |
| Confirmar eliminación | Modal (`DeleteConfirmationDialog`) |
| Toggle activo/inactivo | Inline (sin modal) |

### Implementación
- Usar siempre `Dialog` de `components/ui/dialog.tsx`
- Todo modal debe tener `DialogTitle` y botones Cancelar/Confirmar
- No anidar modales
- Botón de confirmación descriptivo: "Guardar", "Eliminar" — nunca "OK"

```tsx
<Dialog open={open} onOpenChange={setOpen}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
        </DialogHeader>
        {/* campos */}
        <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={processing}>Guardar</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```
