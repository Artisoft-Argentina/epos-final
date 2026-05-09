# Pruebas End-to-End de EPOS

Plan completo para automatizar los flujos de negocio críticos del sistema (alta de cliente, venta, entrega, compra, inventario, ecommerce) y detectar regresiones antes de que lleguen a producción.

> Audiencia: cualquier persona del equipo (humano o IA) que necesite escribir, correr o mantener pruebas E2E. Si sos Claude o Q leyendo esto, las secciones [Cómo escribir un test nuevo](#cómo-escribir-un-test-nuevo) y [Uso de MCPs para acelerar](#uso-de-mcps-para-acelerar) están pensadas para vos.

---

## 1. Objetivo y alcance

**Objetivo**: tener un suite que se corra en CI y en local, que ejecute los flujos completos del negocio contra la app real (Laravel + Inertia + React, multi-tenant), y que falle de forma clara cuando algo se rompa.

**No-objetivos**:
- No reemplaza tests unitarios ni de Feature (Pest) — esos siguen viviendo en `tests/Unit` y `tests/Feature`.
- No prueba Telegram, MercadoPago en vivo, ARCA en producción. Esos se mockean o usan ambientes de homologación.
- No mide performance. Para eso usar otra herramienta.

**Flujos cubiertos en la primera entrega**:
1. Login por rol (admin, vendedor, cliente)
2. Alta de cliente (con y sin CUIT)
3. Alta de artículo + asignación a lista de precios
4. Venta POS completa (factura B con cliente consumidor final, sin ARCA real)
5. Entrega parcial y total de una venta
6. Compra/remito → ingreso a inventario
7. Smoke test ecommerce (navegar tienda + agregar al carrito)
8. **Smoke E2E integrado**: alta de cliente → alta de artículo → venta → entrega total. Este es el "canario": si rompe, hay un problema serio.

---

## 2. Decisión de stack

| Componente | Elección | Por qué |
|---|---|---|
| Runner | **Playwright** + TypeScript | Maduro, rápido, cross-browser, traces visuales para debug, gran integración con CI. Ya tenemos el MCP instalado (`playwright`). |
| Lenguaje | TypeScript | Coherente con el frontend. |
| Patrón | Page Object Model + flow helpers | Aísla selectores de los tests; reutiliza secuencias comunes (login, alta cliente). |
| Aislamiento de datos | Tenant dedicado `e2e.epos.lvh.me` con DB efímera (`epos_e2e`) | Multi-tenant ya nos lo regala: una DB completa de test sin tocar la del dev. |
| Auth caching | `storage_state` por rol | Login una vez por rol, reutilizar cookies en cada test. |
| CI | GitHub Actions | Ya está configurado para el repo. |
| Asistencia IA | MCP `playwright` para grabar/explorar; MCP `testsprite` para sugerir casos límite | El MCP no reemplaza el suite, pero acelera escribirlo. |

**Por qué no Laravel Dusk**: requiere Selenium, más lento, peor DX para Inertia/React, sin traces decentes. Hoy Playwright es estado del arte.

**Por qué no solo el MCP**: el MCP de Playwright es excelente para exploración interactiva, pero no es un suite reproducible que corra en CI. Necesitamos tests checkeados al repo. El MCP queda como herramienta de **producción de tests**, no de **ejecución de regresión**.

---

## 3. Arquitectura del suite

```
tests/e2e/
├── README.md                 # este archivo
├── playwright.config.ts      # configuración global, baseURL, proyectos por rol
├── global-setup.ts           # crea/migra el tenant e2e, hace login y guarda storageState
├── global-teardown.ts        # limpia el tenant e2e (opcional)
├── fixtures/
│   ├── auth.ts               # fixture que inyecta usuarios autenticados
│   ├── tenant.ts             # helpers para resetear DB del tenant entre suites
│   └── api.ts                # llamadas directas al backend para setup veloz (saltea UI)
├── pages/                    # Page Objects (un archivo por pantalla)
│   ├── LoginPage.ts
│   ├── CustomersPage.ts
│   ├── ProductsPage.ts
│   ├── SalesPage.ts
│   ├── DeliveriesPage.ts
│   ├── PurchasesPage.ts
│   └── EcommercePage.ts
├── flows/                    # secuencias reutilizables compuestas de varias páginas
│   ├── createCustomer.ts
│   ├── createProduct.ts
│   ├── createSale.ts
│   └── completeDelivery.ts
├── specs/                    # los tests propiamente dichos
│   ├── auth.spec.ts
│   ├── customers.spec.ts
│   ├── products.spec.ts
│   ├── sales.spec.ts
│   ├── deliveries.spec.ts
│   ├── purchases.spec.ts
│   ├── ecommerce.spec.ts
│   └── smoke-full-flow.spec.ts   # el canario
├── utils/
│   ├── testData.ts           # generadores: CUIT válido, EAN aleatorio, nombres
│   ├── selectors.ts          # data-testid centralizados
│   └── db.ts                 # `php artisan tenants:migrate --fresh` para el tenant e2e
└── .auth/                    # storage states por rol (gitignored)
    ├── admin.json
    ├── vendedor.json
    └── cliente.json
```

**Reglas de ubicación**:
- Si un selector se usa en >1 test, va en un Page Object.
- Si una secuencia (ej: "crear cliente") se usa en >1 test, va en `flows/`.
- Si un test necesita datos preexistentes, que los cree vía `fixtures/api.ts` — no por UI. La UI se prueba en el spec que la cubre, no como setup.

---

## 4. Plan de implementación por fases

Cada fase es accionable de forma independiente y deja el suite en un estado funcional.

### Fase 0 — Decisión y prerrequisitos (½ día)
- [ ] Confirmar este plan con el equipo y mergear este README.
- [ ] Confirmar que `lvh.me` resuelve a `127.0.0.1` en la máquina de cada dev y en el runner de CI.
- [ ] Asegurar que `make up` deja la app respondiendo en `http://epos.lvh.me:3000`.

### Fase 1 — Bootstrap (1 día)
- [ ] `pnpm add -D @playwright/test`
- [ ] `npx playwright install --with-deps chromium` (en local y CI)
- [ ] Crear `playwright.config.ts` con:
  - `baseURL: 'http://e2e.epos.lvh.me:3000'`
  - `webServer`: opcional — si no está la app levantada, hacer `make up`. Para CI, mejor levantar manual antes y dejar `webServer` solo en local.
  - 3 projects: `admin`, `vendedor`, `cliente` — cada uno con su `storageState`.
  - `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`.
  - `retries: process.env.CI ? 2 : 0`.
  - `reporter: [['html'], ['list']]`.
- [ ] Agregar a `package.json`:
  ```json
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "playwright test --debug",
  "test:e2e:report": "playwright show-report"
  ```
- [ ] `.gitignore` para `tests/e2e/.auth/`, `playwright-report/`, `test-results/`.

### Fase 2 — Tenant de pruebas y `global-setup` (1 día)
- [ ] Crear comando artisan `tenants:e2e-reset` que:
  1. Borra el tenant `e2e` si existe.
  2. Lo crea de cero con dominio `e2e.epos.lvh.me`.
  3. Corre `tenants:migrate --tenants=e2e --fresh`.
  4. Corre un seeder mínimo (`E2ESeeder`) que crea: 1 admin, 1 vendedor, 1 cliente, 1 lista de precios default POS, 1 punto de venta, 1 almacén.
- [ ] `global-setup.ts`:
  1. Ejecuta `php artisan tenants:e2e-reset` (vía `child_process`).
  2. Hace login programático de cada rol y guarda `storageState` en `.auth/<rol>.json`.
- [ ] `global-teardown.ts`: opcional — solo en CI, borra el tenant para no dejar basura.

> **Por qué un tenant entero por test run y no por test**: levantar un tenant nuevo cuesta segundos. Hacerlo por test multiplicaría el tiempo del suite. La estrategia es: un tenant por **run**, y entre tests usar transacciones del lado del backend o limpieza dirigida (truncate de las tablas tocadas).

### Fase 3 — Page Objects mínimos (1 día)
- [ ] `LoginPage`: `goto()`, `loginAs(email, password)`.
- [ ] `CustomersPage`: `goto()`, `openCreateForm()`, `fillForm(data)`, `submit()`, `findRow(taxId)`, `expectInList(taxId)`.
- [ ] `ProductsPage`: `goto()`, `createProduct(data)`, `assignToList(name, listName, price)`.
- [ ] `SalesPage`: `goto()`, `startNewSale()`, `selectCustomer(taxId)`, `addItem(sku, qty)`, `confirmSale()`, `expectInvoiceCreated()`.
- [ ] `DeliveriesPage`: `goto(saleId)`, `deliverFull()`, `deliverPartial(itemId, qty)`.

> **Convención de selectores**: usar `data-testid` en los componentes React críticos. Es 10× más estable que selectores por texto o clases. Si encontrás un componente sin testid, agregalo en el mismo PR del test.

### Fase 4 — Specs por módulo (2 días)
Implementar en este orden — cada uno bloquea al siguiente:
- [ ] `auth.spec.ts`: login admin/vendedor/cliente, redirecciones por rol, logout.
- [ ] `customers.spec.ts`: alta con CUIT, alta sin CUIT, validación de CUIT duplicado (cubre SCRUM-31).
- [ ] `products.spec.ts`: alta de artículo, asignación a lista de precios, edición de precio.
- [ ] `sales.spec.ts`: presupuesto, factura B sin ARCA real, cancelación de factura, restauración de stock al eliminar (SCRUM-25).
- [ ] `deliveries.spec.ts`: entrega parcial, entrega total, cambio de estado de venta.
- [ ] `purchases.spec.ts`: alta de remito, conversión a inventario, verificar stock actualizado.
- [ ] `ecommerce.spec.ts`: visitar tienda, agregar al carrito, checkout hasta el redirect a MercadoPago (mock).

### Fase 5 — Smoke test integrado (½ día)
- [ ] `smoke-full-flow.spec.ts`: un único test largo que:
  1. Crea un cliente nuevo.
  2. Crea un artículo nuevo en una lista de precios.
  3. Hace una venta a ese cliente con ese artículo.
  4. Marca entrega total.
  5. Verifica que el stock bajó, el saldo del cliente reflejó la venta, y la factura quedó en estado correcto.
- Este test es el indicador de salud principal — si pasa, el corazón del sistema funciona.

### Fase 6 — CI/CD (½ día)
- [ ] Workflow `.github/workflows/e2e.yml`:
  - Trigger: PR a `dev` y `main`, push a `main`.
  - Servicios: MySQL 8, Redis 7.
  - Steps: checkout → setup PHP/Node → `composer install` → `pnpm install` → migrar central → `pnpm build` → levantar `php artisan serve` en background con `e2e.epos.lvh.me` resolviendo a localhost → `npx playwright install` → `pnpm test:e2e`.
  - Artefactos: subir `playwright-report/` y `test-results/` siempre, no solo en falla.
- [ ] Badge en el README principal del repo.
- [ ] Notificación a Slack/Telegram en falla en `main`.

### Fase 7 — Mantenimiento y mejoras (continuo)
- [ ] Tags por criticidad: `@smoke`, `@regression`, `@flaky`. Permitir correr solo smoke en cada PR y full en nightly.
- [ ] Visual regression con `expect(page).toHaveScreenshot()` en pantallas críticas (POS, checkout).
- [ ] Paralelización: `workers: 4` y aislamiento por usuario/cliente generado dinámicamente con timestamp + random suffix.
- [ ] Mock de servicios externos:
  - **ARCA**: ya tenemos modo homologación; en E2E usar un fake que devuelva CAE dummy.
  - **MercadoPago**: interceptar con `page.route()` y devolver respuestas canned.
  - **Groq**: idem para asistente de compras y precios — mockear la respuesta del LLM.
- [ ] Dashboard de flakiness mensual (Playwright lo trae en el HTML report).

---

## 5. Cómo correr el suite

Prerrequisitos: el contenedor `local-epos-app` debe estar arriba (`make up`). El suite habla con el tenant `e2e.epos.lvh.me:5433`.

```bash
# Reset del tenant de pruebas (DB limpia + seeders mínimos).
# Se ejecuta automáticamente al inicio de cada `pnpm test:e2e`,
# pero también podés correrlo a mano:
pnpm test:e2e:reset

# Correr todo
pnpm test:e2e

# Saltear el reset (más rápido cuando ya está limpio)
E2E_SKIP_RESET=1 pnpm test:e2e

# Sembrar también el catálogo demo (productos, stock, clientes)
E2E_WITH_DEMO=1 pnpm test:e2e

# Correr un solo spec
pnpm test:e2e specs/auth.spec.ts

# Modo UI interactivo (recomendado mientras desarrollás un test)
pnpm test:e2e:ui

# Modo debug paso a paso
pnpm test:e2e:debug

# Ver el último reporte HTML
pnpm test:e2e:report
```

**Variables de entorno relevantes** (todas opcionales — leen de `.env`):
- `APP_PORT` — puerto del app container (default `5433`).
- `CENTRAL_DOMAIN` — dominio central (default `epos.lvh.me`).
- `E2E_TENANT` — id/subdominio del tenant de pruebas (default `e2e`).
- `E2E_SKIP_RESET=1` — saltea el reset del tenant (útil para iterar rápido).
- `E2E_WITH_DEMO=1` — siembra el catálogo demo después del reset.

---

## 6. Cómo escribir un test nuevo

1. **Identificá el flujo** y mirá si ya existe un Page Object o flow que lo cubra parcialmente.
2. **Si necesitás datos previos** (un cliente, un artículo), creálos por API en un `beforeEach` usando `fixtures/api.ts`. No por UI.
3. **Agregá `data-testid`** a los elementos React que vas a tocar. Convención: `data-testid="<modulo>-<accion>"`, ej: `customers-create-button`, `sales-customer-input`.
4. **Escribí el test** en `specs/<modulo>.spec.ts` usando el Page Object. El test debería ser legible como una historia de negocio.
5. **Corré con `--ui`** para iterar.
6. **Tag** el test (`@smoke` si es flujo crítico).

Ejemplo mínimo:

```ts
// specs/customers.spec.ts
import { test, expect } from '../fixtures/auth';
import { CustomersPage } from '../pages/CustomersPage';
import { generateTaxId } from '../utils/testData';

test.describe('Customers @regression', () => {
  test('admin puede dar de alta un cliente con CUIT', async ({ adminPage }) => {
    const customers = new CustomersPage(adminPage);
    const taxId = generateTaxId();

    await customers.goto();
    await customers.createCustomer({
      businessName: 'Acme SA',
      taxId,
      email: 'acme@test.com',
    });

    await expect(customers.row(taxId)).toBeVisible();
  });
});
```

---

## 7. Convenciones

- **Selectores**: `data-testid` siempre que sea posible. Texto solo cuando es estable y user-facing.
- **Esperas**: nunca `waitForTimeout`. Siempre `expect(...).toBeVisible()` o `waitForResponse`. Si hace falta `waitForTimeout`, hay un bug de UX que arreglar.
- **Datos**: usar generadores en `utils/testData.ts`. Nunca CUIT hardcodeado — falla por colisión cuando los tests corren en paralelo.
- **Aserciones**: que cada test asserte el efecto observable (UI _y_ DB cuando aplica). Usar `fixtures/api.ts` para confirmar el estado backend.
- **Naming**: describe en español del dominio, igual que la UI. `test.describe('Ventas — facturación')`, `test('genera factura B para consumidor final')`.
- **Idempotencia**: cada test debe correr aislado. Si necesita datos, los crea él. No depende del orden.
- **No mockear lo nuestro**: mockeamos servicios externos (ARCA, MercadoPago, Groq) — nunca nuestro propio backend. La gracia del E2E es probar la integración real.

---

## 8. Uso de MCPs para acelerar

Tenemos varios MCPs configurados que aceleran escribir y mantener pruebas. **Los MCPs no reemplazan el suite checkeado al repo**: se usan como herramientas de autoría.

### `playwright` MCP
**Cuándo usarlo**: para explorar una pantalla nueva, descubrir selectores, o grabar una secuencia que después conviertas en spec.

Flujo recomendado:
1. Decile a Claude: "navegá a `http://e2e.epos.lvh.me:3000/clientes`, hacé login con admin, y dame los selectores estables del formulario de alta".
2. Claude usa `mcp__playwright__browser_*` para abrir, hacer snapshot, y devolverte los `data-testid` faltantes.
3. Te genera el Page Object y el spec basado en lo que vio.
4. Vos lo revisás, agregás `data-testid` que falten al componente React, y comiteás.

### `testsprite` MCP
**Cuándo usarlo**: para que la IA genere casos de prueba que vos no pensaste (edge cases, validaciones, flujos invertidos).

Flujo recomendado:
1. `mcp__TestSprite__testsprite_generate_frontend_test_plan` con el módulo de Ventas.
2. Revisás el plan, descartás lo que no aplica, convertís lo que queda en specs Playwright.
3. **No** ejecutes los tests autogenerados directamente como suite de regresión — son sugerencias, no código de producción.

### `db` MCP
**Cuándo usarlo**: para verificar el estado de la DB después de un test cuando algo no cierra. Útil en debugging.

Ejemplo: "después del test de venta, querés saber si la fila de `entregas` quedó con `status='pendiente'` o `'entregada'`". Le pedís a Claude que haga `mcp__db__mysql_query` contra `epos_e2e`.

### `jira` MCP
**Cuándo usarlo**: para vincular tests con historias. Cuando agregás un test que cubre SCRUM-XX, comentás en la historia con el path del spec. Útil para reporting.

### `sentry` MCP
**Cuándo usarlo**: si un test falla en CI, mirar Sentry de prod por errores correlacionados. Si lo que rompió en E2E ya está pasando en prod, es un incidente, no un bug nuevo.

---

## 9. Roadmap de cobertura — alineado con Jira

Mapping inicial de specs ↔ historias del backlog:

| Spec | Historias que cubre |
|---|---|
| `auth.spec.ts` | SCRUM-54 (middleware de roles) |
| `customers.spec.ts` | SCRUM-30, 31, 32, 35 |
| `products.spec.ts` | SCRUM-39 |
| `sales.spec.ts` | SCRUM-22, 23, 25, 26, 29 |
| `deliveries.spec.ts` | SCRUM-26, 29 |
| `purchases.spec.ts` | SCRUM-40, 43 |
| `ecommerce.spec.ts` | SCRUM-44, 45, 46, 48, 52 |
| `smoke-full-flow.spec.ts` | canario general |

Cuando una historia entre en curso, agregar/extender el spec correspondiente en el mismo PR de la implementación. Regla: ningún PR de feature mergea sin su test E2E asociado.

---

## 10. Métricas de éxito

A los 30 días de tener el suite vivo:
- [ ] >80% de los flujos del catálogo cubiertos.
- [ ] Smoke test corre en <5 min en CI.
- [ ] Suite full corre en <20 min en CI.
- [ ] <2% de flakiness mensual (medido por el HTML report).
- [ ] Cero PRs mergeados a `main` con E2E rojo.
- [ ] Al menos un bug detectado por E2E que no fue capturado por Pest.

---

## 11. Estado actual — Fases 1-6 completas

✅ El suite corre de punta a punta y está integrado a CI.

**Verificación local**: `pnpm test:e2e` → **17/17 tests en verde (~30s)** con reset incluido.

### Cobertura actual (specs implementados)

| Spec | Tests | Cubre |
|---|---|---|
| [auth.spec.ts](specs/auth.spec.ts) | 4 | Login admin/vendedor/cliente, redirect por rol, credenciales inválidas |
| [customers.spec.ts](specs/customers.spec.ts) | 3 | Alta jurídica con CUIT, alta física con DNI, validación faltante |
| [products.spec.ts](specs/products.spec.ts) | 1 | Alta de artículo con marca y categoría |
| [sales.spec.ts](specs/sales.spec.ts) | 2 | POS carga datos; venta vía helper visible en /ventas |
| [deliveries.spec.ts](specs/deliveries.spec.ts) | 2 | Auto-generación de entrega pendiente; marcar como entregada con stock |
| [purchases.spec.ts](specs/purchases.spec.ts) | 2 | Listado de órdenes; formulario de creación renderiza |
| [ecommerce.spec.ts](specs/ecommerce.spec.ts) | 2 | Shop público lista productos; agregar al carrito retorna 200 |
| [smoke-full-flow.spec.ts](specs/smoke-full-flow.spec.ts) | 1 | **Canario**: cliente → artículo → stock → venta → entrega total |

### Componentes del andamiaje

| Componente | Path |
|---|---|
| Reset del tenant | [app/Console/Commands/ResetE2ETenant.php](../../app/Console/Commands/ResetE2ETenant.php) |
| Helper crear venta | [app/Console/Commands/E2ECreateSale.php](../../app/Console/Commands/E2ECreateSale.php) |
| Helper setear stock | [app/Console/Commands/E2ESetStock.php](../../app/Console/Commands/E2ESetStock.php) |
| Seeder mínimo | [database/seeders/E2ESeeder.php](../../database/seeders/E2ESeeder.php) |
| Config Playwright | [playwright.config.ts](../../playwright.config.ts) |
| Global setup | [tests/e2e/global-setup.ts](global-setup.ts) |
| Fixtures auth | [tests/e2e/fixtures/auth.ts](fixtures/auth.ts) |
| Helpers API | [tests/e2e/fixtures/api.ts](fixtures/api.ts) |
| Page Objects | [tests/e2e/pages/](pages/) — Login, Customers, Products, Sales, Deliveries |
| Generadores de datos | [tests/e2e/utils/testData.ts](utils/testData.ts) |
| Workflow CI | [.github/workflows/e2e.yml](../../.github/workflows/e2e.yml) |

### Trade-offs aceptados en esta primera entrega

Cosas que el suite **no** prueba todavía (deuda explícita, no olvidos):

1. **Creación de venta vía POS UI**. El POS tiene un flujo complejo (búsqueda con dropdown async, selector de cliente, lista de precios). Hoy testeamos que la pantalla carga y que la venta funciona vía `e2e:create-sale`. Convertir esto a UI completa es una mejora valiosa pero opcional — agregar `data-testid` a la search box y al item de dropdown lo desbloquea.
2. **Creación de orden de compra (purchases) vía UI**. Hoy solo verifica render del formulario.
3. **Carrito cross-context**. El test de "agregar al carrito" verifica el response 200 pero no navega a `/cart` para validar el item — había un race condition con el `window.location.reload()` del componente. Para fortalecerlo: emitir un evento Inertia o reemplazar el reload por un `router.reload()` partial.
4. **Mocks de servicios externos**. ARCA, MercadoPago y Groq no se invocan en el suite actual. Cuando se agreguen tests que dependen de ellos, mockear con `page.route()` o un fake driver.
5. **Tests por rol**. Solo corremos en project `admin`. Sumar projects `vendedor` y `cliente` para validar autorización por rol cuando se completen las historias relacionadas.

## 12. CI

El workflow [`.github/workflows/e2e.yml`](../../.github/workflows/e2e.yml):

- Trigger: PR a `main`/`dev` y push a esas ramas.
- Servicios: PostgreSQL 16 + Redis 7.
- Setup: PHP 8.4, Node 22, pnpm 10, composer + pnpm install, build de assets, migración + seed central.
- Levanta `php artisan serve` en background sobre puerto 8000.
- Corre `pnpm test:e2e` — el global-setup reusa el comando `tenants:e2e-reset` con `E2E_ARTISAN_CMD="php artisan"` (sin Docker en CI).
- Sube `playwright-report/` siempre y `test-results/` solo en falla, ambos como artefactos durante 14 días.

> **lvh.me en CI**: el dominio público `*.lvh.me` resuelve a `127.0.0.1`, así que `e2e.epos.lvh.me:8000` funciona sin tocar `/etc/hosts`.

## 13. Próximos pasos

- Agregar `data-testid` al search input del POS y al dropdown de items para poder testear la creación de venta UI completa.
- Sumar projects `vendedor` y `cliente` en `playwright.config.ts` y duplicar specs de auth+autorización por rol.
- Mock de MercadoPago (`page.route('**/checkout/payment**', ...)`) y test del checkout completo.
- Activar Sentry release reporting desde el workflow E2E para correlacionar fallas.
