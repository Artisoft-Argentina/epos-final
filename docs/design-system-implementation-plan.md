# Plan de Implementación — EPOS Design System (Admin)

## Objetivo

Aplicar el design system definido en `DESIGN.md` al panel de administración, usando CSS custom properties como única fuente de verdad. Sin recodificar componentes. Sin afectar ecommerce ni panel central.

---

## Prerequisito

Ninguno. La font **Instrument Sans** ya está instalada y configurada.

---

## Paso 1 — Actualizar CSS custom properties en `app.css`

**Archivo**: `resources/css/app.css`

### 1.1 Font

Sin cambios. Se mantiene **Instrument Sans** (ya configurada en `--font-sans`).

### 1.2 Actualizar `:root` (light mode)

Mapear las variables shadcn a los equivalentes Tailwind del DESIGN.md:

| Variable | Valor actual (neutral) | Nuevo valor (teal) | Equivalente Tailwind |
|---|---|---|---|
| `--primary` | `oklch(0.205 0 0)` (negro) | oklch de `#0f766e` | `teal-700` |
| `--primary-foreground` | `oklch(0.985 0 0)` | blanco (sin cambio) | — |
| `--secondary` | `oklch(0.97 0 0)` | oklch de `teal-50` | `teal-50` |
| `--secondary-foreground` | `oklch(0.205 0 0)` | oklch de `teal-900` | `teal-900` |
| `--accent` | `oklch(0.97 0 0)` | oklch de `teal-50` | `teal-50` |
| `--accent-foreground` | `oklch(0.205 0 0)` | oklch de `teal-900` | `teal-900` |
| `--background` | `oklch(1 0 0)` (blanco) | oklch de `gray-50` | `gray-50` |
| `--card` | `oklch(1 0 0)` | blanco (sin cambio) | — |
| `--muted` | `oklch(0.97 0 0)` | oklch de `gray-100` | `gray-100` |
| `--muted-foreground` | `oklch(0.556 0 0)` | oklch de `gray-500` | `gray-500` |
| `--border` | `oklch(0.922 0 0)` | oklch de `gray-200` | `gray-200` |
| `--input` | `oklch(0.922 0 0)` | oklch de `gray-200` | `gray-200` |
| `--ring` | `oklch(0.87 0 0)` | oklch de `teal-700` | `teal-700` |
| `--destructive` | actual | oklch de `red-600` | `red-600` |
| `--sidebar-primary` | negro | oklch de `teal-700` | `teal-700` |
| `--sidebar-accent` | gris | oklch de `teal-50` | `teal-50` |

### 1.3 Actualizar radius

Cambiar `--radius` de `0.625rem` (10px) a `0.75rem` (12px) para alinearse al DESIGN.md (Medium = 12px como base).

### 1.4 Agregar variables semánticas nuevas

Agregar en `:root`:

```css
--success: /* oklch de emerald-600 */;
--success-foreground: /* oklch blanco */;
--success-soft: /* oklch de emerald-50 */;
--warning: /* oklch de amber-600 */;
--warning-foreground: /* oklch blanco */;
--warning-soft: /* oklch de amber-50 */;
--info: /* oklch de blue-500 */;
--info-foreground: /* oklch blanco */;
--info-soft: /* oklch de blue-50 */;
```

### 1.5 Registrar variables semánticas en `@theme`

Agregar en el bloque `@theme`:

```css
--color-success: var(--success);
--color-success-foreground: var(--success-foreground);
--color-success-soft: var(--success-soft);
--color-warning: var(--warning);
--color-warning-foreground: var(--warning-foreground);
--color-warning-soft: var(--warning-soft);
--color-info: var(--info);
--color-info-foreground: var(--info-foreground);
--color-info-soft: var(--info-soft);
```

Esto habilita clases como `bg-success`, `text-warning`, `bg-info-soft`, etc.

**Resultado**: Todos los componentes shadcn (`Button`, `Card`, `Badge`, `Sidebar`, etc.) cambian de tema automáticamente sin tocar su código.

---

## Paso 2 — Agregar variantes semánticas a Badge y Alert

**Archivos**: `resources/js/components/ui/badge.tsx`, `resources/js/components/ui/alert.tsx`

Agregar variantes `success`, `warning`, `info` que usen las nuevas variables:

```tsx
// badge.tsx — agregar variantes
success: "border-transparent bg-success-soft text-success",
warning: "border-transparent bg-warning-soft text-warning",
info: "border-transparent bg-info-soft text-info",
```

```tsx
// alert.tsx — agregar variantes similares
```

**Impacto**: Solo se agregan variantes nuevas. Las existentes (`default`, `secondary`, `destructive`, `outline`) no se tocan.

---

## Paso 3 — Actualizar dark mode (opcional, baja prioridad)

**Archivo**: `resources/css/app.css` — bloque `.dark`

Actualizar las variables del dark mode con equivalentes teal oscuros. Esto es opcional ya que el DESIGN.md prioriza light mode.

---

## Archivos afectados (resumen)

| Archivo | Tipo de cambio |
|---|---|
| `resources/css/app.css` | Valores de variables CSS + nuevas variables semánticas (font sin cambios) |
| `resources/js/components/ui/badge.tsx` | Agregar 3 variantes |
| `resources/js/components/ui/alert.tsx` | Agregar 3 variantes |

**Total: 3 archivos. 0 páginas. 0 layouts. 0 lógica de negocio.**

---

## Archivos NO afectados

| Archivo | Razón |
|---|---|
| `shop-layout.tsx` | Ecommerce — fuera de alcance |
| `central-layout.tsx` | Panel central — fuera de alcance |
| `components/ui/button.tsx` | Hereda tema via `bg-primary` |
| `components/ui/card.tsx` | Hereda tema via `bg-card` |
| `components/ui/input.tsx` | Hereda tema via `border-input` |
| `components/ui/sidebar.tsx` | Hereda tema via `--sidebar-*` |
| Todas las páginas en `pages/` | Usan componentes shadcn que heredan el tema |
| `tailwind.config.js` | No necesita cambios (Tailwind v4 usa `@theme`) |
| `components.json` | Configuración shadcn — sin cambios |

---

## Validación

Después de implementar, verificar:

1. **Admin** — Botones, sidebar, cards, badges muestran paleta teal
2. **Ecommerce** (`/shop`) — Sigue con su estilo violet/indigo sin cambios
3. **Central** (`/central`) — Sigue con su estilo propio sin cambios
4. **Font** — Instrument Sans se mantiene sin cambios
5. **Colores semánticos** — `bg-success`, `bg-warning`, `bg-info` funcionan como clases Tailwind

---

## Orden de ejecución recomendado

1. Paso 1 completo (app.css) — cambio más impactante, 0 riesgo
2. Verificar visualmente el admin
3. Paso 2 (badge + alert) — solo si se necesitan las variantes semánticas
4. Paso 3 (dark mode) — cuando se decida soportarlo
