# EPOS — Guía para Agentes

Notas compactas y de alto impacto para sesiones de OpenCode. Si algo es obvio por el nombre del archivo, se omite.

## Stack y Arquitectura

- **Backend**: Laravel 12, PHP 8.4, PostgreSQL 16, Redis 7, Pest 4.
- **Frontend**: React 19, Inertia.js 2.1, TypeScript, Tailwind CSS 4, Vite 7.
- **Multi-tenant**: `stancl/tenancy` 3.9. Los tenants se identifican por subdominio (`<tenant>.epos.lvh.me:3000`). Cada uno tiene su propia base PostgreSQL (`epos_<id>`).
- **Dominio central**: `epos.lvh.me` — panel de superadministración de tenants.
- **DNS local**: `*.lvh.me` resuelve a `127.0.0.1` automáticamente. No se requiere editar `/etc/hosts`.
- **Assets**: build multi-etapa de Vite dentro del Dockerfile. `FilesystemTenancyBootstrapper` está deshabilitado para que todos los tenants compartan los assets compilados.

## Comandos de Desarrollo

```bash
# Primer setup
make up                    # docker compose up -d; usa las variables de .env
# Si la imagen está desactualizada: make rebuild

# Día a día
make shell                 # sh dentro del contenedor app
make migrate               # php artisan migrate (solo BD central)
make tenant-migrate        # php artisan tenants:migrate (todas las BD de tenant)
make fresh                 # reset destructivo + seeders (pide confirmación)
make tinker                # Laravel Tinker dentro del contenedor
make logs                  # tail de logs del contenedor app
```

**Dentro del contenedor (o `make artisan cmd=...`)**:
- `php artisan tenants:migrate` — obligatorio para cambios de schema en tenants; `php artisan migrate` **no** toca las BD de tenant.
- `php artisan queue:work --tries=3` — ejecutar worker de colas.

## Comandos de Frontend (host o contenedor)

```bash
npm run dev                # servidor de desarrollo Vite (HMR en :5173)
npm run build              # build de producción
npm run types              # tsc --noEmit (typecheck, sin emitir)
npm run format             # prettier --write resources/
npm run lint               # eslint . --fix
```

## Comandos de PHP (host o contenedor)

```bash
composer run dev           # concurrente: php artisan serve + queue:listen + pail + vite
composer run test          # limpia config, luego corre `php artisan test` (Pest)
vendor/bin/pint            # Laravel Pint (estilo PHP)
```

## Testing

- **Framework**: Pest 4. CI ejecuta `./vendor/bin/pest`.
- **BD de tests**: SQLite en memoria (`:memory:`). `phpunit.xml` fuerza `DB_CONNECTION=sqlite`, `CACHE_STORE=array`, `QUEUE_CONNECTION=sync`, `SESSION_DRIVER=array`.
- **Suites**: `tests/Unit/` y `tests/Feature/`.
- Para correr un archivo específico: `vendor/bin/pest tests/Feature/SomeTest.php`.

## Lint / Format / Typecheck

El orden de CI (`lint.yml`) es: **Pint → Prettier → ESLint**.

- **Prettier**: solo `resources/`. Plugins: `prettier-plugin-organize-imports`, `prettier-plugin-tailwindcss`. Config: `printWidth: 150`, `tabWidth: 4`, `singleQuote: true`, `semi: true`. YAML usa `tabWidth: 2`.
- **ESLint**: `eslint.config.js` (flat config). Usa `@eslint/js`, `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`. Ignora `vendor`, `node_modules`, `public`, `bootstrap/ssr`.

## Convenciones y Gotchas Críticos

- **No axios en el frontend** — a pesar de estar en `package.json`, fue removido del uso. Usar siempre `fetch` nativo con header `X-CSRF-TOKEN` (leer de `<meta name="csrf-token">`).
- **Listas de precios**: `listas_precios.default_pos = true` es la que usa el POS. `default_ecommerce = true` es la que usa la tienda online.
- **Certificados ARCA/AFIP**: almacenados por tenant en `storage/app/private/afip/<tenant_id>/`. En modo `homologacion` no se requiere certificado real.
- **OPcache**: después de cambiar archivos PHP dentro del contenedor Docker en ejecución, reiniciar el contenedor (`docker restart epos-app`) o enviar `USR2` a php-fpm: `docker exec epos-app kill -USR2 $(pgrep -o php-fpm)`.
- **Refresco de assets en Docker**: si se buildean assets en el host (`npm run build`) y se necesitan dentro del contenedor, copiarlos: `docker cp public/build/. epos-app:/var/www/html/public/build/`. Si existe `public/hot` en la imagen del contenedor, la app intentará cargar assets desde `:5173` en lugar de los archivos compilados.
- **`make setup` no existe** — la documentación original lo menciona, pero el comando real de primera vez es `make up` (o `docker compose up -d --build`).

## Destacados del Entorno (`.env.example`)

- `DB_CONNECTION=pgsql` (no MySQL; la config de MySQL está comentada en `docker-compose.yml`).
- `CENTRAL_DOMAIN=epos.lvh.me`
- `TENANCY_DB_PREFIX=epos_`
- `SESSION_DOMAIN=.epos.lvh.me` (punto inicial para cookies de subdominio).
- `AFIP_ENVIRONMENT=homologacion`
- `AI_PROVIDER=ollama` (o `groq` en algunos entornos).

## CI / CD

- `.github/workflows/tests.yml` — Node 22, PHP 8.4, `npm ci`, `npm run build`, `composer install`, copiar `.env.example` → `.env`, generar key, luego `./vendor/bin/pest`.
- `.github/workflows/lint.yml` — corre `vendor/bin/pint`, `npm run format`, `npm run lint`.
- Workflows de deploy (`deploy-dev.yml`, `deploy-qa.yml`, `deploy-prod.yml`) existen pero son específicos por ambiente.

## Ubicaciones Clave de Archivos

- Rutas tenant: `routes/web.php` (agrupadas por `role:admin,superadmin`).
- Rutas centrales: `routes/central.php`.
- Páginas React: `resources/js/pages/<Modulo>/Index.tsx` (también `Create.tsx`, `Edit.tsx`, `Show.tsx`).
- Componentes React: `resources/js/components/`.
- Migraciones de tenant: `database/migrations/tenant/` — deben correrse vía `tenants:migrate`.
- Servicios de lógica de negocio: `app/Services/`.

## Credenciales Locales (seeders)

- Central superadmin: `admin@epos.com` / `password`.
- Tenant demo: `gepetto@mail.com` / `asdf1234`.

---

## Convenciones de Código — Backend

> Fuente primaria: `.amazonq/rules/backend.md`

### Idioma
- **Código** (clases, métodos, variables, rutas, columnas, relaciones): **inglés**.
- **Mensajes al usuario** (toasts, errores de validación): **español**.
- Comentarios: pueden ir en español.

### Naming
- **Modelos**: singular, PascalCase, inglés: `Customer`, `Sale`, `PriceList`.
- **Controladores**: singular, PascalCase, sufijo `Controller`: `CustomerController`.
- **Métodos de controllers**: estándar `index/create/store/show/edit/update/destroy` o camelCase descriptivo (`toggleActive`, `exportExcel`).
- **Rutas**: plural, kebab-case, inglés: `/customers`, `/customers/{customer}/account-statement`. Nombres con punto: `customers.index`.
- **Tablas**: plural, snake_case, inglés: `customers`, `sale_payments`.
- **Columnas**: snake_case, inglés: `business_name`, `tax_id`.
- **Foreign keys**: `{model}_id` → `customer_id`.
- **Booleans**: prefijo descriptivo (`active`, `is_authorized`). Nunca `flag` ni `status_bool`.

### Arquitectura
- **Controllers delgados**: solo recibir request, validar, llamar al Service, retornar respuesta. **Nunca lógica de negocio en el controller**.
- **Services**: lógica de negocio en `app/Services/`. Nombre `{Model}Service` → `CustomerService`.
- **Validaciones**: método privado `rules()` dentro del controller, o `FormRequest` si son complejas/reutilizables.
- **Inyección de dependencias**: siempre via constructor. Nunca `new` dentro de métodos.
- **Policies**: lógica de autorización va en Policies, no en controllers (`$this->authorize('update', $customer)`).
- **Events/Listeners**: acciones secundarias (emails, notificaciones, logs externos) van en Events/Listeners, no inline.
- **Route Model Binding**: usar siempre (`public function show(Customer $customer)`), nunca buscar manualmente por ID.

### Modelos
- `$fillable` explícito siempre. **Nunca `$guarded = []`**.
- `$casts` para tipos no string: booleans, decimals, dates.
- Relaciones siempre en inglés.
- Usar `SoftDeletes` donde no se deba eliminar físicamente.

### Migraciones
- **En desarrollo sin producción**: modificar migración existente + `migrate:fresh --seed`.
- **En producción**: crear migración incremental, **nunca modificar migraciones existentes**.
- Columnas nuevas siempre `nullable()` salvo que sean estrictamente requeridas.

### Buenas prácticas Laravel
- Siempre usar `$request->validated()`. **Nunca `$request->all()`** al crear o actualizar modelos.
- **Eager loading obligatorio** para evitar N+1 (`Customer::with(['city', 'state'])->paginate(15)`).
- **Paginación obligatoria** en listados. Nunca `->get()` sin límite.
- **Query Scopes** para filtros reutilizables, no repetir lógica en controllers.
- **Type hints** obligatorios en parámetros y retornos.
- **Accessors** en el modelo para transformaciones de datos, no en controllers o vistas.

---

## Convenciones de Código — Frontend

> Fuente primaria: `.amazonq/rules/frontend.md`

### Idioma
- **Texto visible al usuario**: **español**.
- **Nombres de archivos, componentes, variables, props, funciones, rutas**: **inglés**.

### Design System
- Antes de implementar cualquier pantalla nueva, consultar:
  - `design_system/DESIGN.md` — tokens, colores, tipografía, spacing.
  - `design_system/DESIGN-CONCEPTUAL.md` — principios visuales.
  - `design_system/ui-kit.html` — referencia visual HTML.
- Implementación de referencia: `resources/js/pages/design-system.tsx`.

### Componentes
- **Siempre usar los componentes existentes** en `resources/js/components/ui/`. Nunca crear estilos custom inline ni clases hardcodeadas que dupliquen lo existente.
- Solo crear un componente nuevo si no existe y se va a reutilizar en más de una pantalla.

### Tokens y Colores
- Usar siempre variables CSS de `resources/css/app.css` a través de Tailwind:
  - `bg-primary text-primary-foreground`
  - `bg-success-soft text-success`
  - `bg-destructive-soft text-destructive`
  - `text-muted-foreground`
  - `border-border`
- **Nunca hardcodear colores**: evitar `bg-emerald-50`, `text-blue-700`, `text-[#0B7D6E]`, `bg-gray-100`.

### Layouts de Pantallas
- **Listado (Index)**: `PageHeader` → KPI cards (si aplica) → filtros/búsqueda → `DataTable` con paginación.
- **Formulario (Create/Edit)**: Breadcrumb → Header con título y botones Cancelar/Guardar → Grid `lg:grid-cols-3` (2/3 secciones principales, 1/3 datos secundarios) → Secciones con `Card gap-0 py-0` y `CardHeader border-b` → Botones de acción al final.
- **Detalle (Show)**: Breadcrumb → `PageHeader` con badge de estado y acciones → Cards de resumen/KPIs → `Tabs variant="underline"`.

### Cards
- Cuando una Card tiene header y content propio, neutralizar padding por defecto:
  ```tsx
  <Card className="gap-0 py-0">
      <CardHeader className="border-b border-border px-6 py-4">...</CardHeader>
      <CardContent className="px-6 py-5">...</CardContent>
  </Card>
  ```

### Tablas
- Usar siempre `DataTable`. No construir tablas HTML custom.
- Estándares de columnas:
  - Texto principal: `font-medium text-foreground`
  - Texto secundario: `text-muted-foreground`
  - Números: `tabular-nums`
  - Estados: `Badge` con variante semántica
  - Acciones: `ActionButton` con `Tooltip`

### Formularios
- Usar `FormField` para cada campo (incluye label, error y hint).
- Usar `Input`, `Select`, `Combobox`, `Textarea`, `Switch`, `Checkbox` de `components/ui/`.
- Campos obligatorios: prop `required` en `FormField`.
- Errores de validación: prop `error` en `FormField` e `Input`.

### Breadcrumb
- Obligatorio en pantallas de detalle, creación y edición:
  ```tsx
  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link href={route('module.index')}>Módulo</Link>
      <ChevronRight className="size-3.5" />
      <span className="text-foreground font-medium">Página actual</span>
  </div>
  ```

### Iconografía
- Exclusivamente **Lucide React**.
- Tamaños estándar: `size-4` en formularios/texto, `size-3.5` en acciones de tabla, `size-5` en KPIs.

### TypeScript
- Siempre definir `interface` para props de cada página y componente.
- Usar `interface` para objetos de dominio y props; `type` para uniones y aliases.
- **Nullabilidad explícita**: indicar siempre cuando un campo puede ser nulo. Nunca asumir que existe.
- Evitar: `any`, `as any`, `// @ts-ignore`, tipos inline complejos en JSX.
- Tipar retorno de funciones cuando no es obvio por inferencia.

### Modales vs. Páginas Completas
- **Modal (`Dialog`)**: formularios de hasta 5 campos simples, acciones rápidas/contextuales, entidades secundarias (categorías, marcas, roles, pagos), confirmaciones de eliminación.
- **Página completa (Create/Edit)**: más de 5 campos, entidades principales (clientes, productos, ventas, compras, proveedores), lógica condicional o relaciones complejas.
- **Reglas de modales**:
  - Usar siempre `Dialog` de `components/ui/dialog.tsx`.
  - Todo modal debe tener `DialogTitle`, botones Cancelar y Confirmar/Guardar.
  - `DialogDescription` recomendado para acciones destructivas.
  - **No anidar modales**.
  - El botón de confirmación debe reflejar la acción: "Guardar", "Eliminar", "Confirmar" — nunca "OK".

### Consistencia Visual
- Border radius: definido por `--radius` en `app.css` (12px base).
- Sombras: `shadow-sm` en cards, nunca sombras custom.
- Spacing: múltiplos de 4 (`gap-4`, `gap-6`, `p-4`, `p-6`).
- Tipografía: Instrument Sans (definida en `app.css`, no importar manualmente).
