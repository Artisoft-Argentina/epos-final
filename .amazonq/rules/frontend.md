# EPOS — Reglas de Frontend

## Idioma
- Todo el texto visible al usuario va en **español**
- Nombres de archivos, componentes, variables, props, funciones y rutas van en **inglés**

---

## Design System

El design system de EPOS está definido en:
- `design_system/DESIGN.md` — tokens, colores, tipografía, spacing, radius, sombras
- `design_system/DESIGN-CONCEPTUAL.md` — principios visuales y guía conceptual
- `design_system/ui-kit.html` — referencia visual HTML de todos los componentes
- `design_system/clients-ui-base/` — ejemplos de pantallas base por módulo

**Antes de implementar cualquier pantalla nueva, consultar estos archivos.**

La implementación de referencia usando los componentes reales está en:
- `resources/js/pages/design-system.tsx` — UI Kit implementado con los componentes del proyecto

---

## Componentes

### Regla principal
**Siempre usar los componentes existentes en `resources/js/components/ui/`.**
Nunca crear estilos custom inline ni clases hardcodeadas que dupliquen lo que ya existe.

### Componentes disponibles
```
resources/js/components/ui/
  alert.tsx         — Alertas semánticas (info, success, warning, destructive)
  badge.tsx         — Badges con variantes (default, success, warning, destructive, info, pending, outline)
  button.tsx        — Botones (default, secondary, outline, ghost, destructive, destructive-soft)
  card.tsx          — Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter
  checkbox.tsx      — Checkbox
  combobox.tsx      — Selector con búsqueda
  dialog.tsx        — Modal/Dialog
  input.tsx         — Input con soporte para startIcon, error, success
  label.tsx         — Label
  select.tsx        — Select, SelectTrigger, SelectContent, SelectItem
  separator.tsx     — Separador visual
  switch.tsx        — Toggle switch
  tabs.tsx          — Tabs con variantes pill y underline
  textarea.tsx      — Textarea
  tooltip.tsx       — Tooltip

resources/js/components/
  action-button.tsx         — Botón de acción con tooltip (para tablas)
  data-table.tsx            — Tabla de datos con Card integrada
  delete-confirmation-dialog.tsx — Dialog de confirmación de eliminación
  form-field.tsx            — Wrapper de campo de formulario con label y error
  page-header.tsx           — Header de página con título, descripción y acciones
  pagination.tsx            — Paginación
```

### Cuándo crear un componente nuevo
Solo si el componente no existe y se va a reutilizar en más de una pantalla.
Debe seguir el mismo patrón de shadcn/ui y usar los tokens del design system.

---

## Tokens y colores

Usar siempre las variables CSS definidas en `resources/css/app.css` a través de las clases de Tailwind.

### ✅ Correcto
```tsx
className="bg-primary text-primary-foreground"
className="bg-success-soft text-success"
className="bg-destructive-soft text-destructive"
className="bg-info-soft text-info"
className="text-muted-foreground"
className="border-border"
```

### ❌ Incorrecto — nunca hardcodear colores
```tsx
className="bg-emerald-50 text-emerald-600"   // ❌
className="bg-blue-100 text-blue-700"         // ❌
className="text-[#0B7D6E]"                    // ❌
className="bg-gray-100"                       // ❌ usar bg-muted
```

---

## Layouts de pantallas

### Pantalla de listado (Index)
Estructura estándar:
1. `PageHeader` con título, descripción y botón de acción principal
2. KPI cards (si aplica) — usar patrón de `design-system.tsx` sección 7
3. Filtros y búsqueda
4. `DataTable` con columnas y paginación

### Pantalla de formulario (Create/Edit)
Estructura estándar:
1. Breadcrumb manual (`Link > ChevronRight > span`)
2. Header con título, descripción y botones Cancelar/Guardar
3. Grid `lg:grid-cols-3` — columna izquierda (2/3) con secciones principales, columna derecha (1/3) con datos secundarios
4. Secciones usando `Card gap-0 py-0` con `CardHeader border-b` y `CardContent`
5. Botones de acción repetidos al final del formulario

### Pantalla de detalle (Show)
Estructura estándar:
1. Breadcrumb
2. `PageHeader` con nombre, badge de estado y acciones
3. Cards de resumen/KPIs
4. `Tabs variant="underline"` con contenido por sección

---

## Cards

Cuando se usan Cards con header y content propio, neutralizar el padding por defecto:
```tsx
<Card className="gap-0 py-0">
    <CardHeader className="border-b border-border px-6 py-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Icon className="size-4 text-primary" />
            Título de sección
        </CardTitle>
    </CardHeader>
    <CardContent className="px-6 py-5">
        {/* contenido */}
    </CardContent>
</Card>
```

---

## Tablas

Usar siempre el componente `DataTable`. No construir tablas HTML custom.

Columnas estándar:
- Texto principal: `font-medium text-foreground`
- Texto secundario: `text-muted-foreground`
- Números: `tabular-nums`
- Estados: `Badge` con variante semántica
- Acciones: `ActionButton` con `Tooltip`

---

## Formularios

- Usar `FormField` para cada campo (incluye label, error y hint)
- Usar `Input`, `Select`, `Combobox`, `Textarea`, `Switch`, `Checkbox` de `components/ui/`
- Campos obligatorios: prop `required` en `FormField`
- Errores de validación: prop `error` en `FormField` e `Input`

---

## Breadcrumb

Todas las pantallas de detalle, creación y edición deben tener breadcrumb:
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

## Iconografía

Usar exclusivamente **Lucide React** (`lucide-react`).
Tamaños estándar: `size-4` en formularios/texto, `size-3.5` en acciones de tabla, `size-5` en KPIs.

---

## TypeScript

### Tipado de props
Siempre definir una `interface` para las props de cada página y componente.

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
        links: any[];  // paginación de Laravel — excepción aceptada
        meta: { total: number };
    };
    filters: {
        search?: string;
        active?: string;
    };
}

export default function Index({ customers, filters }: Props) { ... }

// ❌ Incorrecto
export default function Index({ customers, filters }: any) { ... }
```

### `interface` vs `type`
- Usar `interface` para props de componentes y objetos de dominio (`Customer`, `Sale`, `Product`)
- Usar `type` para uniones, aliases simples o tipos utilitarios

```tsx
// interface — objetos de dominio y props
interface Customer { id: number; business_name: string; }

// type — uniones y aliases
type PersonType = 'fisica' | 'juridica';
type BadgeVariant = 'success' | 'warning' | 'destructive';
```

### Nullabilidad explícita
Siempre indicar cuando un campo puede ser nulo. Nunca asumir que existe.

```tsx
// ✅ Correcto
interface Customer {
    fantasy_name: string | null;
    city: { id: number; name: string } | null;
}

// Verificar antes de usar
{customer.fantasy_name && <p>{customer.fantasy_name}</p>}
```

### Evitar
- `any` — usar `unknown` con narrowing si el tipo es realmente desconocido
- `as any` para forzar tipos — indica un problema de diseño
- `// @ts-ignore` — resolver el problema real
- Tipos inline complejos en JSX — extraerlos a una `interface`

```tsx
// ❌ Incorrecto
const data = response as any;
const value = (row as any).total;

// ✅ Correcto — tipar bien desde el origen
const value = row.total;
```

### Tipado de retorno de funciones
Tipar el retorno cuando no es obvio por inferencia.

```tsx
// ✅ Correcto
const fmt = (n: number): string =>
    `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

function getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}
```

---

## Consistencia visual

- Border radius: definido por `--radius` en app.css (12px base)
- Sombras: `shadow-sm` en cards, nunca sombras custom
- Spacing: múltiplos de 4 (gap-4, gap-6, p-4, p-6)
- Tipografía: Instrument Sans (definida en app.css, no importar manualmente)

---

## Modales vs. Páginas completas

### Usar Modal (`Dialog`) cuando:
- El formulario tiene **hasta 5 campos simples**
- La acción es **rápida y contextual** — el usuario no debe perder el contexto de la pantalla actual
- Son entidades **secundarias o auxiliares**: categorías, marcas, roles, pagos, imágenes
- Se requiere **confirmación de una acción**: eliminar, activar, cambiar estado

### Usar Página completa (Create/Edit) cuando:
- El formulario tiene **más de 5 campos** o múltiples secciones
- La entidad es **principal del sistema**: clientes, productos, ventas, compras, proveedores
- El formulario tiene **lógica condicional** o relaciones complejas
- El usuario necesita **concentración total** en la tarea

### Referencia rápida

| Caso | Recomendación |
|---|---|
| Crear categoría, marca, rol | Modal |
| Crear/editar cliente, producto, venta | Página completa |
| Registrar un pago | Modal |
| Confirmar eliminación | Modal (`DeleteConfirmationDialog`) |
| Agregar imagen a producto | Modal |
| Toggle de estado activo/inactivo | Inline (sin modal) |

### Reglas de implementación
- Usar siempre el componente `Dialog` de `components/ui/dialog.tsx`
- Todo modal debe tener: `DialogTitle`, botones Cancelar y Confirmar/Guardar
- `DialogDescription` es opcional pero recomendado para acciones destructivas
- **No anidar modales**
- El botón de confirmación debe reflejar la acción: "Guardar", "Eliminar", "Confirmar" — nunca "OK"

```tsx
// ✅ Estructura correcta de un modal de formulario
<Dialog open={open} onOpenChange={setOpen}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
            <DialogDescription>Completá los datos para crear la categoría.</DialogDescription>
        </DialogHeader>
        {/* campos del formulario */}
        <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={processing}>Guardar</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```
