---
name: e2e-tester
description: Escribe o extiende tests E2E Playwright para EPOS cubriendo funcional, UX, UI, lógica y performance. Toma una historia de Jira (SCRUM-XX) o una descripción libre. Usa MCPs (jira, playwright, db) para acelerar y verificar. Invocar cuando el usuario pida testear un módulo, una feature o validar una historia, p. ej. "/e2e-tester SCRUM-22", "/e2e-tester transferencias", "agregale tests al flujo de ventas".
---

# E2E Tester (Playwright) para EPOS

Tu trabajo: producir tests Playwright reproducibles, checkeados al repo, que prueben **funcional + UX/UI + lógica + performance** sobre el suite ya existente (`tests/e2e/`).

**No reinventes el suite.** Hay un README extenso en [tests/e2e/README.md](../../../tests/e2e/README.md) con stack, arquitectura, convenciones y CI. Leelo antes de escribir cualquier cosa. Tu valor está en seguir esas convenciones y agregar las dimensiones de prueba que el README no especifica.

**Catálogo de flujos**: [tests/e2e/CATALOG.md](../../../tests/e2e/CATALOG.md) lista todos los flujos del sistema agrupados por módulo, con estado de cobertura, bugs conocidos y sugerencias UX/UI por módulo. Antes de planear, **leer el módulo correspondiente** del catálogo para saber qué ya está cubierto, qué bugs hay flageados y qué sugerencias aplican. Cuando cierres una historia, actualizá el estado del flujo en el catálogo en el mismo PR.

---

## 1. Cuándo usar este skill — y cuándo NO

**Usar cuando**:
- El usuario pide testear una historia (SCRUM-XX), un módulo, un endpoint, o un bug específico.
- El usuario quiere ampliar cobertura de un módulo existente.
- Hay un bug recién fixeado y se quiere prevenir regresión.

**NO usar cuando**:
- Es un test unitario o de Feature (Pest) — esos viven en `tests/Unit/` y `tests/Feature/`. Redirigir.
- El usuario solo quiere correr el suite, no escribir tests. Para eso: `pnpm test:e2e`.
- El "test" pedido es manual o exploratorio sin intención de quedar en CI. Para exploración usar directamente el MCP `playwright` sin pasar por este skill.

---

## 2. Loop de trabajo

Seguir estos pasos en orden. **No saltearse el reconocimiento** — duplicar Page Objects existentes es el error más común.

### Paso 1 — Input
- Si recibiste `SCRUM-XX`: traer la historia con `mcp__jira__get_issue` y extraer:
  - Título, descripción, criterios de aceptación (AC).
  - Comentarios recientes (a menudo aclaran scope).
  - Issues linkeados (bugs hijos, dependencias).
- Si recibiste descripción libre: pedile al usuario que confirme el alcance antes de avanzar.
- Si no hay nada claro: preguntar específicamente qué módulo / qué flujo. **Una pregunta concreta** ("¿Querés cubrir la creación o también la edición de transferencias?"), no una abierta.

### Paso 2 — Reconocer el suite existente
Sin esto vas a duplicar trabajo. Hacer en paralelo:
- `Read tests/e2e/README.md` — convenciones autoritativas del proyecto.
- `ls tests/e2e/pages/` y `ls tests/e2e/specs/` — qué ya existe.
- `grep -rn "<Modulo>" tests/e2e/` — ver si ya hay cobertura parcial.
- `Read tests/e2e/fixtures/api.ts` — helpers de setup por API.

Si un Page Object existe pero le falta un método, **extendelo**. No crees un PO paralelo.

### Paso 3 — Planear escenarios (multi-dimensional)
Para cada AC de Jira (o subflujo del módulo), generar al menos:

1. **Happy path funcional** — el camino feliz, asserción en UI **y** en DB.
2. **1-2 edge cases** — datos inválidos, límites, concurrencia, estado previo distinto. Si el ticket linkea bugs, esos son edge cases gratis.
3. **Cobertura UX** — ver Checklist UX abajo. No es un test aparte: son aserciones extra dentro del happy path o un test corto adicional.
4. **Cobertura UI / Design System** — ver Checklist UI abajo.
5. **Verificación de lógica** — ver Checklist Lógica abajo. A veces requiere una query a DB con `mcp__db__mysql_query` para confirmar el estado.
6. **Smoke de performance** — ver Checklist Perf abajo. No es benchmark: es detectar regresiones groseras.

**Antes de escribir código**, presentale al usuario el plan en 5-10 líneas (qué tests vas a crear, qué dimensiones cubrís). Esperá confirmación o ajuste.

### Paso 4 — Implementar
Reglas duras (heredadas del README y de incidentes recientes):
- Spec en `tests/e2e/specs/<modulo>.spec.ts`. Si el módulo no existe, crear el archivo nuevo.
- Page Object en `tests/e2e/pages/<Modulo>Page.ts`. Un archivo por pantalla, no por test.
- Datos vía `fixtures/api.ts` (artisan commands ya existentes: `e2e:create-sale`, `e2e:set-stock`, etc.). Solo crear datos por UI cuando **ese** sea el flujo que estás testeando.
- Selectores: `data-testid` siempre que sea posible. Texto user-facing solo si es estable. Si te falta un `data-testid` en el componente React, agregalo en el mismo PR. Convención: `data-testid="<modulo>-<accion>"`, ej `transferencias-search-input`.
- Idempotencia: cada test crea sus propios datos con generadores de `utils/testData.ts` (`generateTaxId`, `generateSku`, `generateBusinessName`). Nunca CUIT hardcodeado.
- Aserciones: `expect(...).toBeVisible()`, `expect(...).toHaveText(...)`. **Nunca** `waitForTimeout`. Si necesitás esperar, hay un bug de UX (loading state ausente) — reportalo en el resumen final.
- Tags: `@smoke` para flujos críticos (login, venta básica, checkout), `@regression` para el resto.

### Paso 5 — Verificar con MCPs antes de cerrar
- **UX**: usar `mcp__playwright__browser_navigate` + `mcp__playwright__browser_snapshot` para validar a ojo. ¿El toast aparece? ¿El form preserva input ante error? ¿La pantalla en 375px se rompe?
- **Lógica**: `mcp__db__mysql_query` contra `epos_e2e` para confirmar que la DB quedó en el estado esperado tras el test.
- **Logs**: `mcp__logs__read_text_file` sobre `storage/logs/laravel.log` si hubo errores backend silenciosos.

### Paso 6 — Correr y reportar
```bash
pnpm test:e2e specs/<modulo>.spec.ts
```
Si falla: leer el trace HTML (`pnpm test:e2e:report`), reproducir con `--debug`, arreglar el test **o** reportar como bug (ver formato de reporte abajo).

Si pasa: comentar la historia de Jira con el path del spec (`mcp__jira__add_comment`) cuando aplique.

---

## 3. Contexto del stack (resumen — para detalle ver README)

| Capa | Tech |
|---|---|
| Backend | Laravel 12, PHP 8.4, PostgreSQL 16, Redis 7, multi-tenant (`stancl/tenancy`) |
| Frontend | React 19 + Inertia.js 2.1, TypeScript, Tailwind 4, shadcn/ui, sonner toasts |
| Tenant E2E | `e2e.epos.lvh.me:5433` con DB `epos_e2e` efímera |
| Auth | `storageState` por rol (`admin`, `vendedor`, `cliente`) en `tests/e2e/.auth/` |
| Runner | Playwright 1.59, Chromium only, un worker en local |

**Lo que esto implica para testing**:
- Inertia.js: la nav entre páginas es 1 request, no full page reload. Asserciones de URL deben usar `await expect(page).toHaveURL(...)`, no `waitForNavigation`.
- shadcn/Radix: errores conocidos — `<SelectItem value="">` rompe el render; `Select` controlado con `value={undefined}` también. Si un componente rompe, sospechá de esto primero.
- sonner: los toasts se renderizan en `<Toaster />` del layout. Selector estable: `[data-sonner-toast]`. El texto del toast viene de flash `success`/`error` del controller.
- Multi-tenant: no compartir datos entre runs. El `global-setup.ts` resetea el tenant `e2e` al inicio.

---

## 4. Checklist UX (qué assertear en cada test funcional)

Estos checks no requieren tests separados — se inyectan en el happy path o como microtest adicional.

| Comportamiento | Cómo asserterar |
|---|---|
| **Toast de éxito tras acción** | `await expect(page.locator('[data-sonner-toast]')).toContainText('exitosamente')` |
| **Toast de error** | Mismo selector, texto del flash error. Verifica que el mensaje **no contenga IDs crudos** ("producto ID 1") — eso es un bug a reportar. |
| **Errores inline en form** | Inertia los expone como `errors.<field>`. En UI: `await expect(page.locator('text=El nombre es obligatorio')).toBeVisible()`. |
| **Form preserva input ante error** | Submit con datos inválidos → assertear que los campos válidos siguen llenos (`expect(input).toHaveValue(...)`). Esto valida que el controller usa `back()->withInput()`. |
| **Loading state durante async** | Botón deshabilitado / spinner durante el request. Selector: `[data-busy="true"]` o `:disabled`. |
| **Empty state con mensaje** | Listados sin datos: assertear que hay un texto claro ("No hay X registrados"), no una tabla vacía sin contexto. |
| **Confirmación antes de borrar** | Acciones destructivas usan `<DeleteConfirmationDialog>`. Assertear que aparece el dialog antes del DELETE. |
| **Foco al abrir modal/dialog** | Después de abrir, el primer input recibe foco. `await expect(page.locator(':focus')).toHaveAttribute('name', 'X')`. |
| **Mobile viewport (375x812)** | Una corrida del happy path con `await page.setViewportSize({ width: 375, height: 812 })`. Sidebar colapsado, sin overflow horizontal. |

---

## 5. Checklist UI / Design System

| Check | Cómo |
|---|---|
| **No colores hardcodeados** | Grep en el componente React tocado: `grep -E "bg-(red\|green\|blue\|yellow\|emerald)-[0-9]" resources/js/pages/<Modulo>/`. Si aparece, no es un bug del test pero sí algo a flagear en el reporte. |
| **Usa componentes del design system** | El componente debe importar de `@/components/ui/` para Button, Input, Select, etc. Si usa `<button className="...">` custom, flagear. |
| **Sin overflow horizontal en mobile** | `await expect(page.locator('body')).toHaveCSS('overflow-x', /hidden\|clip\|visible/)` + scrollWidth check. |
| **Sin layout shift visible** | Tras cargar la página, esperar `networkidle` y screenshot. Si el segundo screenshot (1s después) difiere significativamente, hay reflow. |

Estos checks **no fallan el build** por defecto — son señales. El reporte final debe mencionarlos.

---

## 6. Checklist Lógica / Datos

| Check | Cómo |
|---|---|
| **Roles**: vendedor no puede entrar a `/users`, `/empresa`, ni borrar | Spec con `vendedorPage` + `await expect(page).toHaveURL(/dashboard/)` tras intentar entrar a ruta admin. |
| **Aislamiento multi-tenant** | El test corre en `e2e.epos.lvh.me`. Datos creados no deben verse en `gepetto.epos.lvh.me` (no se prueba activamente — confiar en stancl/tenancy — pero si el test parece "compartir estado" entre runs, es un bug serio). |
| **Transacciones consistentes** | Ej: una venta con error de stock debe NO crear `Sale` ni `Delivery` ni descontar stock. Verificar vía `mcp__db__mysql_query` que las 3 tablas quedaron sin filas nuevas. |
| **Idempotencia** | Acciones como "marcar entregada" pueden recibir doble click — assertear que el segundo intento no descuenta stock de nuevo. |
| **Concurrencia (numeración de factura)** | No se prueba en E2E unitario fácilmente. Si la historia toca `invoice_number`, agregar nota: "verificar Pest tests SCRUM-23". |
| **Soft delete coherente** | Borrar y volver a crear con mismo dato único (sku, tax_id) debe funcionar. |

---

## 7. Checklist Performance (smoke, no benchmark)

| Check | Cómo |
|---|---|
| **Requests por navegación Inertia ≤ 1** | `page.on('request', r => ...)` durante un goto. Si hay > 5 requests (HTML + assets contados), probablemente hay un waterfall innecesario. |
| **Payload Inertia razonable** | Interceptar response del navigate (`X-Inertia: true`). Si > 1 MB para una vista de listado, hay un eager-load innecesario. Ej: `Venta::with('articulos.imagenes')` cuando la lista no necesita imágenes. |
| **TTI bajo en pantallas críticas** | `const start = Date.now(); await page.goto(...); await page.locator('[data-testid="page-ready"]').waitFor(); expect(Date.now() - start).toBeLessThan(2000)`. Aplicar solo a Dashboard, POS, Listado de Ventas. |
| **No N+1 visible** | En network panel: si hay > 1 request al mismo endpoint con distintos `?id=`, es N+1. Casi nunca pasa en Inertia (server-side), pero sí en endpoints JSON internos como `articulos/{id}/stock-by-warehouse`. |

Estos checks son señales — no fallar el build a menos que sea catastrófico (> 5s TTI, > 5 MB payload).

---

## 8. Convenciones del proyecto a respetar

Resumen de lo que ya está en CLAUDE.md, AGENTS.md y `.amazonq/rules/` — leer esos archivos si dudás de algo:

- **Idioma**: nombres de archivo, componentes, variables, atributos de modelo → **inglés**. Texto user-facing → **español**. Por eso los `data-testid` van en inglés (`sales-create-button`) pero las aserciones de texto en español (`'Venta creada exitosamente'`).
- **Nombres canónicos**: usar `Customer.business_name`, `Customer.tax_id`, `Product.sku`, `Sale.invoice_number`. No `razonsocial`, `cuit`, `codarticulo`. Si tocás un componente con nombres viejos, NO los renombres en este PR — flagealo en el reporte.
- **Sin axios**: si necesitás llamar al backend desde el frontend en un componente nuevo, `fetch` con header `X-CSRF-TOKEN`.

---

## 9. Anti-patrones (no hacer)

- `await page.waitForTimeout(1000)` — siempre indica una espera por UX deficiente. Reemplazar por `expect(locator).toBeVisible()`.
- Hardcodear `tax_id: '20123456789'` — colisiona en paralelo. Usar `generateTaxId()`.
- Hacer login por UI en cada test — eso es lo que evita el `storageState`. Usar la fixture `adminPage`/`vendedorPage`/`clientePage`.
- Mockear el backend de EPOS — perdés la integración real. Solo mockear servicios externos (ARCA, MercadoPago, Groq) con `page.route()`.
- Tests dependientes del orden — cada test debe correr aislado. Si necesita datos previos, los crea él.
- Asertar contra detalles del DOM frágiles (`page.locator('div > div:nth-child(2) > span')`). Si no hay `data-testid`, agregarlo al React.
- Confiar solo en la UI. Una venta "exitosa" en la UI puede no haber descontado stock — verificar también con `mcp__db__mysql_query`.

---

## 10. Uso de MCPs

| MCP | Para qué | Ejemplo |
|---|---|---|
| `jira` | Leer historia, sus AC, sus links, comentar el spec creado | `mcp__jira__get_issue { issueKey: "SCRUM-22" }` al inicio; `mcp__jira__add_comment` al final |
| `playwright` | Exploración interactiva: navegar, snapshot, descubrir selectores faltantes | `mcp__playwright__browser_navigate` → `browser_snapshot` para mapear la pantalla |
| `db` | Verificar estado backend después de un test, debugging | `mcp__db__mysql_query { database: "epos_e2e", sql: "select * from sales order by id desc limit 5" }` (ajustar a postgres si aplica) |
| `logs` | Leer `storage/logs/laravel.log` si algo falla silenciosamente backend | `mcp__logs__read_text_file` |
| `sentry` | Correlacionar fallas de E2E con errores reales de prod | `mcp__sentry__list_issues` filtrado por release |
| `testsprite` | Sugerir edge cases que no se te ocurrieron — **revisar antes de adoptar**, no copiar y pegar | `mcp__TestSprite__testsprite_generate_frontend_test_plan` |

---

## 11. Formato del reporte final

Al cerrar la tarea, devolver siempre este resumen al usuario:

```
## Resumen — <SCRUM-XX o feature>

### Specs
- `tests/e2e/specs/<...>.spec.ts` (nuevo / modificado) — N tests

### Page Objects / flows
- `tests/e2e/pages/<...>Page.ts` (nuevo / extendido)

### data-testid agregados al React
- `resources/js/pages/<...>.tsx`: <lista de testids>

### Resultado de la corrida
✓ N/N en verde · X ms

### Hallazgos por dimensión
**Funcional** — <bugs o "ninguno">
**UX** — <ej: "toast no aparece al borrar cliente — flash error en CustomerController.destroy">
**UI / Design System** — <ej: "Almacenes/Index usa bg-emerald-50 hardcodeado">
**Lógica** — <ej: "transferencia en estado in_transit permite borrar — debería 403">
**Performance** — <ej: "GET /ventas trae imagenes de 800KB innecesarias">

### Próximo paso sugerido
<una línea: qué falta cubrir o qué bug arreglar primero>
```

Si encontrás bugs, **no los arregles automáticamente** salvo que el usuario lo pida — tu trabajo es testear y reportar. La excepción: si el bug es un `data-testid` faltante en un componente React, agregálo en el mismo PR del test (es habilitador del test, no scope creep).
