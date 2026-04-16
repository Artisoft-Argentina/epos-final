# EPOS Design System

Este documento define la base visual del **panel de administración** de EPOS, una plataforma de gestión empresarial moderna orientada a ventas, artículos, inventario, compras y administración.

El sistema debe transmitir una experiencia clara, liviana, profesional y operativa. La interfaz debe priorizar orden, legibilidad, escaneo rápido de información y consistencia visual entre módulos.

> **Alcance**: Este design system aplica exclusivamente al **panel de administración** (tenant app). El ecommerce público (`shop-layout`) y el panel central (`central-layout`) tienen su propio estilo y no se ven afectados por estos tokens.

> **Implementación**: Se utiliza **shadcn/ui + Tailwind CSS v4** con CSS custom properties. Los colores se mapean a la paleta estándar de Tailwind para mantener consistencia y evitar valores custom innecesarios. Cualquier cambio de color, tipografía o radius se realiza en un único archivo (`app.css`) y se propaga automáticamente a todos los componentes.

> **Futuro**: El ecommerce público se trabajará por separado, con soporte para tematización por tenant (colores configurables desde la BD).

> Nota: este sistema está pensado principalmente para **light mode**, alineado a las pantallas iniciales definidas para EPOS.

---

## 1. Design Principles

La experiencia visual de EPOS debe seguir estos principios:

- **Claridad primero**
  La información debe ser fácil de leer y entender rápidamente.

- **Operativo y profesional**
  Debe sentirse como una herramienta de trabajo moderna, no como una app experimental.

- **Liviano y ordenado**
  Se deben evitar interfaces pesadas, recargadas o con ruido visual excesivo.

- **Consistencia entre módulos**
  Ventas, artículos, inventario, compras y administración deben compartir la misma lógica visual.

- **Jerarquía evidente**
  Acciones, estados, métricas y alertas deben diferenciarse claramente.

---

## 2. Visual Style

EPOS debe sentirse:

- moderno
- limpio
- sobrio
- amigable
- confiable
- enterprise pero accesible

La interfaz debe apoyarse en:

- fondos claros
- superficies suaves
- componentes redondeados
- sombras sutiles
- bordes discretos
- uso medido del color
- tipografía clara y consistente

No debe verse rígido, oscuro ni excesivamente técnico.

---

## 3. Color Mode

La base del sistema está optimizada para **light mode**.

### Base visual
- Fondo general claro
- Superficies blancas o gris muy suave
- Texto principal oscuro
- Texto secundario en tonos desaturados
- Acentos en verde petróleo / teal
- Colores semánticos para estados y alertas

---

## 4. Color Palette

Los colores se mapean a la **paleta estándar de Tailwind CSS** para mantener consistencia y facilitar el mantenimiento. Se indican los valores originales del diseño y su equivalente Tailwind más cercano.

## 4.1 Brand Colors

### Primary
- Diseño: `#0B7D6E` → **Tailwind `teal-700`** (`#0f766e`)
- Variable CSS: `--primary`
- Se utiliza en: botones primarios, navegación activa, métricas destacadas, acciones principales

### Primary Hover
- Diseño: `#09695D` → **Tailwind `teal-800`** (`#115e59`)

### Primary Soft
- Diseño: `#E7F4F1` → **Tailwind `teal-50`** (`#f0fdfa`)

### Secondary
- Diseño: `#3E5F5A` → **Tailwind `teal-900`** (`#134e4a`)
- Variable CSS: `--secondary`
- Color de apoyo para iconografía, texto secundario y detalles visuales.

### Accent
- Diseño: `#5F8F87` → **Tailwind `teal-600`** (`#0d9488`)
- Variable CSS: `--accent`
- Acento auxiliar para resaltar información secundaria o elementos gráficos.

---

## 4.2 Neutral Colors

Se utiliza la escala **gray** de Tailwind (grises neutros puros).

### Surfaces and Backgrounds
- `#FFFFFF` → `white` — Surface principal (`--card`)
- `#F7F8F8` → **`gray-50`** (`#f9fafb`) — Background general (`--background`)
- `#F0F2F2` → **`gray-100`** (`#f3f4f6`) — Hover suave / superficie alternativa
- `#E7EBEA` → **`gray-200`** (`#e5e7eb`) — Fondo sutil complementario

### Borders
- `#E3E7E6` → **`gray-200`** (`#e5e7eb`) — Border subtle (`--border`)
- `#C8CFCD` → **`gray-300`** (`#d1d5db`) — Border medium / disabled

### Text
- `#111111` → **`gray-900`** (`#111827`) — Heading strong (`--foreground`)
- `#1F2A28` → **`gray-800`** (`#1f2937`) — Text primary
- `#48615C` → **`gray-500`** (`#6b7280`) — Text secondary
- `#7B8A87` → **`gray-400`** (`#9ca3af`) — Text muted (`--muted-foreground`)

---

## 4.3 Semantic Colors

Estos colores **no existen por defecto en shadcn/ui** y se agregan como variables CSS custom con sus clases Tailwind correspondientes.

### Success
- Base: `#1F8F63` → **Tailwind `emerald-600`** (`#059669`) — `--success`
- Soft: `#E7F6EE` → **Tailwind `emerald-50`** (`#ecfdf5`) — `--success-soft`

### Warning
- Base: `#D48A1F` → **Tailwind `amber-600`** (`#d97706`) — `--warning`
- Soft: `#FFF4E2` → **Tailwind `amber-50`** (`#fffbeb`) — `--warning-soft`

### Danger / Destructive
- Base: `#D14343` → **Tailwind `red-600`** (`#dc2626`) — `--destructive`
- Soft: `#FCECEC` → **Tailwind `red-50`** (`#fef2f2`) — `--destructive-soft`

### Info
- Base: `#3C7BBF` → **Tailwind `blue-500`** (`#3b82f6`) — `--info`
- Soft: `#EAF3FC` → **Tailwind `blue-50`** (`#eff6ff`) — `--info-soft`

---

## 5. Semantic Usage

Los colores deben usarse por significado, no solo por estética.

### Brand / Primary
Reservado para:
- CTA principal
- item activo de navegación
- acciones de alta prioridad
- progreso y foco de marca

### Neutral
Usado para:
- fondos
- superficies
- divisores
- texto general
- estructura visual base

### Success
Usado para:
- estados completados
- resultados positivos
- confirmaciones
- indicadores saludables

### Warning
Usado para:
- pendientes
- advertencias
- situaciones a revisar

### Danger
Usado para:
- errores
- bloqueos
- alertas críticas
- stock bajo o crítico

### Info
Usado para:
- estado informativo
- procesos en curso
- elementos de apoyo visual

---

## 6. Typography

La tipografía principal de EPOS es:

- **Instrument Sans**

Se utiliza en toda la interfaz. Es una fuente geométrica moderna con excelente legibilidad en tamaños pequeños (tablas, labels, formularios), que aporta identidad visual sin perder profesionalismo.

---

## 6.1 Type Scale

### Display
- Size: `48px`
- Weight: `700`
- Use: portadas, dashboards destacados, mensajes principales

### H1
- Size: `40px`
- Weight: `700`
- Use: título principal de módulo

### H2
- Size: `32px`
- Weight: `700`
- Use: secciones importantes

### H3
- Size: `24px`
- Weight: `600`
- Use: subtítulos destacados

### Title
- Size: `18px`
- Weight: `600`
- Use: títulos de cards, widgets y paneles

### Body
- Size: `16px`
- Weight: `400`
- Use: texto general de interfaz

### Body Small
- Size: `14px`
- Weight: `400`
- Use: texto secundario, tablas, descripciones

### Label
- Size: `12px`
- Weight: `600`
- Use: labels, headers de tabla, chips, metadata visual

### Caption
- Size: `11px - 12px`
- Weight: `500`
- Use: timestamps, notas, información auxiliar

---

## 6.2 Typography Guidelines

- Los títulos deben ser firmes y limpios.
- El texto secundario debe seguir siendo legible.
- Los labels pueden usar mayúsculas discretas para reforzar estructura.
- Evitar pesos excesivos fuera de títulos o métricas.
- Mantener una jerarquía clara entre título, subtítulo y dato.

---

## 7. Spacing

El sistema utiliza una escala base de espaciado múltiplo de 4.

### Spacing Scale
- `4`
- `8`
- `12`
- `16`
- `20`
- `24`
- `32`
- `40`
- `48`
- `64`

### Usage Guidelines
- Gap entre acciones: `8 - 12`
- Título y subtítulo: `6 - 10`
- Padding de cards: `20 - 24`
- Separación entre secciones principales: `24 - 32`
- Layouts amplios: `32 - 48`

La interfaz debe respirar. No se deben comprimir componentes ni densificar tablas innecesariamente.

---

## 8. Border Radius

La redondez debe sentirse moderna y amable, sin exageración.

### Radius Scale
- `8px` — Small
- `12px` — Medium
- `16px` — Large
- `20px` — XL
- `999px` — Pill / Full

### Usage
- Inputs: `12px`
- Buttons: `12px`
- Cards: `16px - 20px`
- Main panels: `20px`
- Chips / badges: `999px`

---

## 9. Elevation and Shadows

La elevación debe ser muy sutil.

### Shadow Principles
- Usar sombras suaves y limpias
- Priorizar contraste de superficie antes que sombras fuertes
- Evitar sensación pesada o "material design" excesiva

### Levels
- **Shadow 0**: superficie plana con borde sutil
- **Shadow 1**: card estándar
- **Shadow 2**: panel flotante, CTA destacado, barra flotante

---

## 10. Borders and Dividers

Los bordes deben ser discretos y funcionales.

### Guidelines
- Bordes suaves para separar contenido
- Divisores sutiles en tablas y paneles
- No usar bordes oscuros o muy marcados
- El borde no debe competir con el contenido

### Recommended Border Color
- `gray-200` (`#e5e7eb`) via `--border`

---

## 11. Iconography

La iconografía debe ser:

- simple
- moderna
- outline preferentemente
- consistente en peso visual
- secundaria al contenido

### Guidelines
- Usar tamaños consistentes
- Acompañar la interfaz, no dominarla
- Mantener coherencia entre sidebar, cards, botones y tablas
- Reservar color fuerte para estados o acciones importantes

---

## 12. Core Components

## 12.1 Navigation

### Sidebar
La navegación lateral debe:
- ser clara y estable
- usar ícono + label
- marcar el item activo con color de marca o fondo suave
- sentirse limpia y fácil de recorrer

### Topbar
Debe incluir:
- búsqueda global
- accesos rápidos
- notificaciones o utilidades
- CTA principal cuando aplique

---

## 12.2 Buttons

### Primary Button
Uso:
- acción principal de pantalla

Estilo:
- fondo primary
- texto blanco
- radio medio
- sombra mínima opcional

### Secondary Button
Uso:
- acción secundaria visible

Estilo:
- fondo neutro claro
- texto oscuro
- borde opcional suave

### Ghost Button
Uso:
- acciones terciarias
- acciones dentro de tablas o toolbars

Estilo:
- bajo peso visual
- sin fondo fuerte

### Icon Button
Uso:
- vistas
- acciones rápidas
- filtros
- utilidades

---

## 12.3 Inputs

### Search Input
Debe ser:
- ancho
- claro
- simple
- con ícono visible
- cómodo para uso frecuente

### Text Input
Debe incluir:
- label
- placeholder claro
- foco visible
- estado error
- estado disabled

### Select / Filter
Debe seguir la misma lógica visual que los inputs:
- claro
- redondeado
- sobrio
- consistente con toolbar y tablas

---

## 12.4 Cards

Las cards son un patrón clave en EPOS.

### Card Principles
- superficies claras
- padding generoso
- títulos breves
- dato principal destacado
- texto secundario tenue pero legible
- sombra sutil o borde suave

### KPI Cards
Deben mostrar:
- nombre de métrica
- valor principal
- apoyo contextual
- icono opcional
- estado o variación cuando corresponda

---

## 12.5 Badges and Chips

Se usan para estados, categorías o indicadores rápidos.

### Guidelines
- compactos
- redondeados
- legibles
- con fondo suave semántico
- texto con suficiente contraste

### Examples
- completado → success soft
- procesando → info soft
- pendiente → warning soft
- crítico → danger soft

---

## 12.6 Tables

Las tablas deben ser uno de los componentes más cuidados del sistema.

### Principles
- lectura clara
- buen espaciado vertical
- encabezados visibles
- acciones discretas
- datos numéricos alineados correctamente
- uso de chips para estados
- jerarquía tipográfica limpia

### Table Guidance
- Headers: label style
- Rows: cómodas, no comprimidas
- Dividers: suaves
- Actions: compactas y consistentes
- Totales: con mayor énfasis visual

---

## 12.7 Alerts and Notifications

Las alertas deben comunicar prioridad de forma inmediata.

### Guidelines
- incluir ícono + texto
- no depender solo del color
- usar fondo suave cuando estén dentro de cards o paneles
- diferenciar claramente lo crítico de lo informativo

---

## 13. Layout Patterns

## 13.1 Dashboard Pattern

El dashboard debe permitir comprender el estado del negocio rápidamente.

### Recommended Structure
- saludo o encabezado contextual
- acciones principales visibles
- KPI cards
- tendencias o gráficos
- alertas recientes
- actividad o últimas operaciones
- objetivo o resumen lateral

Debe sentirse escaneable en pocos segundos.

---

## 13.2 List View Pattern

Aplica a módulos como:
- artículos
- clientes
- ventas
- compras
- inventario

### Recommended Structure
- título del módulo
- subtítulo breve
- toolbar superior
- métricas resumidas
- tabla o grilla
- acciones masivas o rápidas
- paginación o "cargar más"

---

## 13.3 Management Screens

Las pantallas operativas deben priorizar:
- claridad funcional
- acciones comunes visibles
- filtros simples
- estados fáciles de identificar
- consistencia entre módulos

---

## 14. Interaction States

Todos los componentes interactivos deben contemplar como mínimo:

- default
- hover
- active
- focus
- disabled
- selected
- loading

### Focus
Debe ser visible y accesible.

### Hover
Debe ser sutil, no agresivo.

### Disabled
Debe seguir siendo legible pero claramente no interactivo.

---

## 15. Accessibility

EPOS debe contemplar accesibilidad desde la base.

### Guidelines
- contraste suficiente entre texto y fondo
- foco visible
- targets clickeables cómodos
- no usar solo color para indicar estado
- labels claros
- textos secundarios todavía legibles
- alertas con texto e ícono

---

## 16. Motion

La animación debe ser funcional y discreta.

### Use Motion For
- hover states
- apertura de filtros
- modales o drawers
- feedback de acciones
- cambios de vista

### Avoid
- animaciones largas
- movimientos decorativos
- exceso de transiciones

---

## 17. Tone of the UI

La interfaz de EPOS debe comunicar:

- control
- claridad
- calma
- eficiencia
- orden
- profesionalismo

Debe sentirse como una herramienta moderna para operaciones reales del negocio.

---

## 18. Dos and Don'ts

### Do
- usar mucho aire visual
- mantener la jerarquía clara
- destacar bien la acción principal
- usar semántica visual consistente
- mantener tablas y cards limpias
- reforzar la claridad operativa

### Don't
- saturar de color
- usar demasiadas sombras
- mezclar estilos de componentes
- densificar excesivamente tablas
- depender solo del color para estados
- agregar ruido visual innecesario

---

## 19. Stitch Generation Keywords

Estas keywords ayudan a conservar la dirección visual en generación:

- modern enterprise dashboard
- light mode admin panel
- clean retail management system
- professional SaaS backoffice
- soft cards
- teal petroleum accent
- elegant tables
- spacious layout
- subtle shadows
- rounded UI
- operational clarity
- modern ERP interface
- friendly enterprise software

---

## 20. Scope and Architecture

### Alcance actual
Este design system aplica al **panel de administración** (tenant app).

### Contextos del sistema
| Contexto | Layout | Usa tokens shadcn | Afectado por este design |
|---|---|---|---|
| Admin (tenant) | `app-layout.tsx` | ✅ Sí | ✅ Sí |
| Ecommerce (shop) | `shop-layout.tsx` | ❌ No (colores hardcodeados) | ❌ No |
| Central (superadmin) | `central-layout.tsx` | ❌ No (clases directas) | ❌ No |

### Implementación técnica
- Los tokens se definen como **CSS custom properties** en `resources/css/app.css`
- shadcn/ui consume las variables via `@theme` de Tailwind v4
- Los componentes de `components/ui/` no se modifican — heredan el tema automáticamente
- Un cambio de color/font/radius = 1 línea en `app.css` → se propaga a todo el admin

### Próximas iteraciones
- Tematización por tenant en ecommerce (colores desde BD)
- Dark mode opcional para admin
- Componentes documentados uno por uno
- Estados detallados de formularios
- Responsive behavior
- Guidelines de gráficos y data visualization

---

## 21. Summary

EPOS debe construir una experiencia visual moderna, clara y consistente para gestión empresarial.

El sistema base se apoya en:
- light mode
- identidad teal / verde petróleo (paleta `teal` de Tailwind)
- tipografía Instrument Sans
- superficies suaves
- cards limpias
- tablas elegantes
- navegación clara
- jerarquía simple
- componentes redondeados
- semántica visual funcional
- shadcn/ui como base de componentes
- CSS custom properties como única fuente de verdad

La prioridad no es solo "verse bien", sino permitir una operación diaria ágil, confiable y fácil de entender.
