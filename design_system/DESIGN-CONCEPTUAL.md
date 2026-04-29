# EPOS Design System — Conceptual Guide

This document defines the **visual direction and conceptual foundation** of EPOS: principles, color palette, typography intent, spacing, and component guidelines.

> **For technical implementation** (CSS custom properties, Tailwind mappings, shadcn/ui tokens, scope boundaries) see [`DESIGN.md`](./DESIGN.md).

> Note: this system is primarily designed for **light mode**, aligned with the initial EPOS screens already defined.
---
## 1. Design Principles
The EPOS visual experience should follow these principles:
- **Clarity first**
Information must be easy to read and understand quickly.
- **Operational and professional**
It should feel like a modern work tool, not an experimental app.
- **Lightweight and organized**
Avoid heavy, cluttered, or visually noisy interfaces.
- **Consistency across modules**
Sales, products, inventory, purchasing, and administration should share the same visual logic.
- **Clear hierarchy**
Actions, states, metrics, and alerts must be clearly differentiated.
---
## 2. Visual Style
EPOS should feel:
- modern
- clean
- sober
- approachable
- trustworthy
- enterprise-oriented but accessible
The interface should rely on:
- light backgrounds
- soft surfaces
- rounded components
- subtle shadows
- discreet borders
- restrained use of color
- clear and consistent typography
It should not feel rigid, dark, or overly technical.
---
## 3. Color Mode
The system is optimized for **light mode**.
### Visual foundation
- Light general background
- White or very soft gray surfaces
- Dark primary text
- Secondary text in desaturated tones
- Petroleum green / teal accents
- Semantic colors for states and alerts
---
## 4. Color Palette
## 4.1 Brand Colors
### Primary
- `#0B7D6E`
Main brand color. Used for:
- primary buttons
- active navigation
- highlighted metrics
- primary actions
- key visual identity elements
### Primary Hover
- `#09695D`
### Primary Soft
- `#E7F4F1`
### Secondary
- `#3E5F5A`
Support color for iconography, secondary text, and visual details.
### Accent
- `#5F8F87`
Auxiliary accent for secondary highlights or graphical elements.
---
## 4.2 Neutral Colors
### Surfaces and Backgrounds
- `#FFFFFF` — Main surface
- `#F7F8F8` — General background
- `#F0F2F2` — Soft hover / alternative surface
- `#E7EBEA` — Complementary subtle background
### Borders
- `#E3E7E6` — Subtle border
- `#C8CFCD` — Medium border / disabled
### Text
- `#111111` — Strong heading
- `#1F2A28` — Primary text
- `#48615C` — Secondary text
- `#7B8A87` — Muted text / labels / metadata
---
## 4.3 Semantic Colors
### Success
- Base: `#10B981` (emerald-500)
- Soft: `#D1FAE5` (emerald-100)
### Info
- Base: `#3B82F6` (blue-500)
- Soft: `#DBEAFE` (blue-100)
### Warning
- Base: `#F59E0B` (amber-500)
- Soft: `#FEF3C7` (amber-100)
### Error
- Base: `#EF4444` (red-500)
- Soft: `#FEE2E2` (red-100)
### Destructive
- Base: `#B91C1C` (red-700)
- Soft: `#FEE2E2` (red-100)
### Pending
- Base: `#6366F1` (indigo-500)
- Soft: `#E0E7FF` (indigo-100)
---
## 5. Semantic Usage
Colors should be used by meaning, not only by aesthetics.
### Brand / Primary
Reserved for:
- primary CTA
- active navigation item
- high-priority actions
- progress and brand emphasis
### Neutral
Used for:
- backgrounds
- surfaces
- dividers
- general text
- base visual structure
### Success
Used for:
- completed states
- positive outcomes
- confirmations
- healthy indicators
### Warning
Used for:
- pending items
- warnings
- situations that need review
### Danger
Used for:
- errors
- blockers
- critical alerts
- low or critical stock
### Info
Used for:
- informational state
- in-progress processes
- supporting visual elements
---
## 6. Typography
The main typeface for EPOS is:
- **Instrument Sans**

A modern geometric typeface with excellent legibility at small sizes (tables, labels, forms), providing visual identity without sacrificing professionalism.
---
## 6.1 Type Scale
### Display
- Size: `48px`
- Weight: `700`
- Use: landing areas, highlighted dashboards, major messages
### H1
- Size: `40px`
- Weight: `700`
- Use: main module title
### H2
- Size: `32px`
- Weight: `700`
- Use: important sections
### H3
- Size: `24px`
- Weight: `600`
- Use: prominent subtitles
### Title
- Size: `18px`
- Weight: `600`
- Use: card, widget, and panel titles
### Body
- Size: `16px`
- Weight: `400`
- Use: general interface text
### Body Small
- Size: `14px`
- Weight: `400`
- Use: secondary text, tables, descriptions
### Label
- Size: `12px`
- Weight: `600`
- Use: labels, table headers, chips, visual metadata
### Caption
- Size: `11px - 12px`
- Weight: `500`
- Use: timestamps, notes, supporting information
---
## 6.2 Typography Guidelines
- Titles should feel strong and clean.
- Secondary text must remain legible.
- Labels may use subtle uppercase styling to reinforce structure.
- Avoid excessive font weights outside titles or metrics.
- Maintain a clear hierarchy between title, subtitle, and data.
---
## 7. Spacing
The system uses a base spacing scale built on multiples of 4.
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
- Gap between actions: `8 - 12`
- Title and subtitle: `6 - 10`
- Card padding: `20 - 24`
- Spacing between main sections: `24 - 32`
- Large layouts: `32 - 48`
The interface should breathe. Components should not feel compressed, and tables should not be unnecessarily dense.
---
## 8. Border Radius
Roundedness should feel modern and approachable, without being exaggerated.
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
Elevation should be very subtle.
### Shadow Principles
- Use soft, clean shadows
- Prioritize surface contrast before strong shadows
- Avoid a heavy or overly “material design” feel
### Levels
- **Shadow 0**: flat surface with subtle border
- **Shadow 1**: standard card
- **Shadow 2**: floating panel, highlighted CTA, floating action bar
---
## 10. Borders and Dividers
Borders should be discreet and functional.
### Guidelines
- Use soft borders to separate content
- Use subtle dividers in tables and panels
- Avoid dark or highly visible borders
- Borders should not compete with content
### Recommended Border Color
- `#E3E7E6`
---
## 11. Iconography
Iconography should be:
- simple
- modern
- preferably outline-based
- consistent in visual weight
- secondary to content
### Guidelines
- Use consistent sizes
- Support the interface, do not dominate it
- Maintain consistency across sidebar, cards, buttons, and tables
- Reserve strong color for states or important actions
---
## 12. Core Components
## 12.1 Navigation
### Sidebar
The side navigation should:
- be clear and stable
- use icon + label
- indicate the active item with brand color or soft background
- feel clean and easy to scan
### Topbar
Should include:
- global search
- quick access actions
- notifications or utilities
- main CTA when needed
---
## 12.2 Buttons
### Primary Button
Use:
- primary action on the screen
Style:
- primary background
- white text
- medium radius
- optional minimal shadow
### Secondary Button
Use:
- visible secondary action
Style:
- light neutral background
- dark text
- optional soft border
### Ghost Button
Use:
- tertiary actions
- actions inside tables or toolbars
Style:
- low visual weight
- no strong background
### Icon Button
Use:
- view toggles
- quick actions
- filters
- utilities
---
## 12.3 Inputs
### Search Input
Should be:
- wide
- clear
- simple
- with visible icon
- comfortable for frequent use
### Text Input
Should include:
- label
- clear placeholder
- visible focus state
- error state
- disabled state
### Select / Filter
Should follow the same visual logic as inputs:
- clear
- rounded
- sober
- consistent with toolbar and tables
---
## 12.4 Cards
Cards are a key pattern in EPOS.
### Card Principles
- light surfaces
- generous padding
- short titles
- highlighted main value
- secondary text subtle but legible
- subtle shadow or soft border
### KPI Cards
Should display:
- metric name
- main value
- supporting context
- optional icon
- state or variation when relevant
---
## 12.5 Badges and Chips
Used for states, categories, or quick indicators.
### Guidelines
- compact
- rounded
- legible
- with soft semantic background
- with enough text contrast
### Examples
- completed → success soft
- processing → info soft
- pending → warning soft
- critical → danger soft
---
## 12.6 Tables
Tables should be one of the most carefully crafted components in the system.
### Principles
- clear reading
- hippocampal vertical spacing
- visible headers
- discreet actions
- correctly aligned numeric data
- use chips for states
- clean typographic hierarchy
### Table Guidance
- Headers: label style
- Rows: comfortable, not compressed
- Dividers: soft
- Actions: compact and consistent
- Totals: with stronger visual emphasis
---
## 12.7 Alerts and Notifications
Alerts should communicate priority immediately.
### Guidelines
- include icon + text
- do not rely only on color
- use soft background when inside cards or panels
- clearly distinguish critical from informational items
---
## 13. Layout Patterns
## 13.1 Dashboard Pattern
The dashboard should allow users to understand business status quickly.
### Recommended Structure
- greeting or contextual header
- visible main actions
- KPI cards
- trends or charts
- recent alerts
- activity or latest operations
- goal or side summary
It should feel scannable in just a few seconds.
---
## 13.2 List View Pattern
Applies to modules such as:
- products
- customers
- sales
- purchasing
- inventory
### Recommended Structure
- module title
- short subtitle
- top toolbar
- summary metrics
- main table or grid
- optional bulk or quick actions
- pagination or “load more”
---
## 13.3 Management Screens
Operational screens should prioritize:
- functional clarity
- visible common actions
- simple filters
- easy-to-identify states
- consistency across modules
---
## 14. Interaction States
All interactive components must support at least:
- default
- hover
- active
- focus
- disabled
- selected
- loading
### Focus
Must be visible and accessible.
### Hover
Should be subtle, not aggressive.
### Disabled
Should remain legible while clearly non-interactive.
---
## 15. Accessibility
EPOS should include accessibility from the foundation.
### Guidelines
- sufficient contrast between text and background
- visible focus states
- comfortable clickable targets
- do not rely only on color to indicate state
- clear labels
- secondary text should still be legible
- alerts should use both text and icon
---
## 16. Motion
Animation should be functional and discreet.
### Use Motion For
- hover states
- opening filters
- modals or drawers
- action feedback
- view transitions
### Avoid
- long animations
- decorative movement
- excessive transitions
---
## 17. Tone of the UI
The EPOS interface should communicate:
- control
- clarity
- calm
- efficiency
- order
- professionalism
It should feel like a modern tool for real business operations.
---
## 18. Dos and Don’ts
### Do
- use plenty of visual breathing room
- maintain a clear hierarchy
- clearly highlight the primary action
- use consistent visual semantics
- keep tables and cards clean
- reinforce operational clarity
### Don’t
- oversaturate with color
- use too many shadows
- mix component styles
- make tables overly dense
- rely only on color for states
- add unnecessary visual noise
---
## 19. Stitch Generation Keywords
These keywords help preserve the visual direction during generation:
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
## 20. Initial Scope
This document defines an **initial foundation** for the visual system.
In future iterations, it should be expanded with:
- formal design tokens
- individually documented components
- detailed component states
- forms
- modals and drawers
- advanced tables
- responsive behavior
- optional dark mode
- chart and data visualization guidelines
---
## 21. Summary
EPOS should build a modern, clear, and consistent visual experience for business management.
The system foundation is based on:
- light mode
- teal / petroleum green identity
- Instrument Sans typography
- soft surfaces
- clean cards
- elegant tables
- clear navigation
- simple hierarchy
- rounded components
- functional visual semantics
The priority is not only to “look good”, but to support fast, trustworthy, and easy-to-understand daily operations.