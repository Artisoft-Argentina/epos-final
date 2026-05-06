# EPOS — Reglas de Backend

## Idioma
- Todo el código (clases, métodos, variables, rutas, columnas de BD, relaciones) va en **inglés**
- Los mensajes de respuesta al usuario (toasts, errores de validación) van en **español**
- Comentarios en el código pueden ir en español

---

## Naming conventions

### Modelos
- Singular, PascalCase: `Customer`, `Sale`, `Product`, `SalePayment`
- Relaciones en inglés: `customer()`, `sales()`, `payments()`

### Controllers
- Singular, PascalCase, sufijo `Controller`: `CustomerController`, `SaleController`
- Métodos estándar: `index`, `create`, `store`, `show`, `edit`, `update`, `destroy`
- Métodos adicionales descriptivos en camelCase: `toggleActive`, `accountStatement`, `exportExcel`

### Rutas
- Plural, kebab-case, en inglés: `/customers`, `/customers/{customer}/account-statement`
- Nombres de ruta con punto: `customers.index`, `customers.toggle-active`
- Parámetros en singular: `{customer}`, `{sale}`, `{product}`

### Base de datos
- Tablas en plural, snake_case, inglés: `customers`, `sale_payments`, `price_lists`
- Columnas en snake_case, inglés: `business_name`, `tax_id`, `created_at`
- Foreign keys: `{model}_id` → `customer_id`, `state_id`
- Booleanos con prefijo descriptivo: `active`, `is_authorized` (no `flag`, `status_bool`)

### Variables y métodos PHP
- camelCase: `$businessName`, `$totalSales`, `$filteredCities`
- Arrays y colecciones descriptivos: `$customers`, `$salesByMonth`

---

## Arquitectura

### Controllers
Los controllers son **delgados**. Solo deben:
1. Recibir el request
2. Validar la entrada
3. Llamar al Service correspondiente
4. Retornar la respuesta (Inertia render o redirect)

**No deben contener lógica de negocio.**

```php
// ✅ Correcto
public function store(Request $request)
{
    $request->validate($this->rules($request));
    $this->customerService->create($request->validated());
    return redirect()->route('customers.index')->with('success', 'Cliente creado correctamente.');
}

// ❌ Incorrecto — lógica de negocio en el controller
public function store(Request $request)
{
    $customer = Customer::create($request->all());
    $customer->sendWelcomeEmail();
    $customer->createDefaultPriceList();
    // ...
}
```

### Services
La lógica de negocio va en `app/Services/`.
Nombre: `{Model}Service` → `CustomerService`, `SaleService`

```php
// app/Services/CustomerService.php
class CustomerService
{
    public function create(array $data): Customer { ... }
    public function toggleActive(Customer $customer): void { ... }
}
```

### Validaciones
Las reglas de validación van en un método privado `rules()` dentro del controller,
o en un `FormRequest` si son complejas o reutilizables.

```php
private function rules(Request $request): array
{
    return [
        'business_name' => 'required|string|max:255',
        'tax_id' => $request->person_type === 'juridica' ? 'required' : 'nullable',
    ];
}
```

---

## Modelos

- Definir siempre `$fillable` explícitamente. Nunca usar `$guarded = []`
- Definir `$casts` para tipos no string: booleans, decimals, dates
- Relaciones siempre en inglés y con tipo de retorno implícito
- Usar `SoftDeletes` en modelos que no deben eliminarse físicamente

```php
protected $fillable = ['business_name', 'tax_id', 'active'];

protected $casts = [
    'active' => 'boolean',
    'credit' => 'decimal:2',
    'created_at' => 'datetime',
];
```

---

## Migraciones

- En desarrollo sin producción: modificar la migración existente + `migrate:fresh --seed`
- En producción: crear nueva migración incremental, nunca modificar migraciones existentes
- Columnas nuevas siempre `nullable()` salvo que sean estrictamente requeridas
- Comentar el propósito de columnas no obvias

```php
$table->string('tax_id', 13)->nullable();   // CUIT/CUIL — requerido si juridica
$table->string('fiscal_name')->nullable();  // V2 AFIP
```

---

## Rutas

Usar `Route::resource()` cuando aplique. Agregar rutas adicionales por separado:

```php
Route::resource('customers', CustomerController::class)->except(['destroy']);
Route::patch('customers/{customer}/toggle-active', [CustomerController::class, 'toggleActive'])
    ->name('customers.toggle-active');
```

---

## Respuestas

### Inertia
```php
return Inertia::render('Customers/Index', [
    'customers' => $customers,
    'filters'   => $request->only(['search', 'active']),
]);
```

### Redirects con toast
```php
return redirect()->route('customers.index')
    ->with('success', 'Cliente creado correctamente.');

return back()->with('success', 'Cliente activado.');
```

### JSON (APIs)
```php
return response()->json(['data' => $result]);
return response()->json(['error' => 'Mensaje de error'], 422);
```

---

## Multitenant

El proyecto usa `stancl/tenancy`. Tener en cuenta:
- Las migraciones de tenant van en `database/migrations/tenant/`
- Las migraciones centrales van en `database/migrations/`
- No mezclar modelos centrales con modelos de tenant
- Al crear extensiones de PostgreSQL, hacerlo en `docker/postgres-init.sql` o via migración

---

## Exports

Los exportadores van en `app/Exports/`.
Usar `maatwebsite/excel` para Excel y `barryvdh/laravel-dompdf` para PDF.

---

## Logs y actividad

Usar `spatie/laravel-activitylog` para registrar operaciones importantes.
No usar `Log::info()` para lógica de negocio — solo para debugging temporal.

---

## Buenas prácticas Laravel

### Siempre usar `$request->validated()`
Nunca usar `$request->all()` al crear o actualizar modelos.

```php
// ✅ Correcto
Customer::create($request->validated());

// ❌ Incorrecto
Customer::create($request->all());
```

### Eager loading — evitar N+1
Siempre usar `with()` cuando se acceden relaciones en colecciones.

```php
// ✅ Correcto
$customers = Customer::with(['city', 'state'])->paginate(15);

// ❌ Incorrecto — genera N+1 queries
$customers = Customer::paginate(15);
// luego en la vista: $customer->city->name
```

### Paginación obligatoria en index
Nunca usar `->get()` sin límite en listados. Siempre paginar.

```php
// ✅ Correcto
$query->orderBy('business_name')->paginate(15)->withQueryString();

// ❌ Incorrecto
$query->get();
```

### Query Scopes para filtros reutilizables
Filtros comunes van como scopes en el modelo, no repetidos en cada controller.

```php
// En el modelo
public function scopeActive(Builder $query): Builder
{
    return $query->where('active', true);
}

public function scopeSearch(Builder $query, string $term): Builder
{
    return $query->where('business_name', 'ILIKE', "%{$term}%");
}

// En el controller
$query->active()->search($request->search);
```

### Inyección de dependencias
Inyectar servicios y dependencias via constructor. Nunca instanciar con `new` dentro de métodos.

```php
// ✅ Correcto
class CustomerController extends Controller
{
    public function __construct(
        private readonly CustomerService $customerService
    ) {}
}

// ❌ Incorrecto
public function store(Request $request)
{
    $service = new CustomerService(); // ❌
}
```

### Type hints
Siempre tipar parámetros y retornos en métodos PHP.

```php
// ✅ Correcto
public function create(array $data): Customer { ... }
public function toggleActive(Customer $customer): void { ... }
public function findByTaxId(string $taxId): ?Customer { ... }
```

### Accessors para transformaciones de datos
Transformaciones de atributos van en el modelo como accessors, no en controllers o vistas.

```php
// En el modelo
protected function fullDocument(): Attribute
{
    return Attribute::make(
        get: fn () => $this->tax_id ?? $this->dni ?? '—'
    );
}
```

### Policies para autorización
La lógica de autorización va en Policies, no en controllers.

```php
// ✅ Correcto
$this->authorize('update', $customer);

// ❌ Incorrecto
if (auth()->user()->role !== 'admin') abort(403);
```

### Events y Listeners para acciones secundarias
Acciones secundarias al flujo principal (emails, notificaciones, logs externos)
van en Events/Listeners, no inline en el controller o service.

```php
// En el Service
event(new CustomerCreated($customer));

// En el Listener
class SendWelcomeEmail
{
    public function handle(CustomerCreated $event): void
    {
        // enviar email
    }
}
```

### Route Model Binding
Usar siempre Route Model Binding en lugar de buscar manualmente.

```php
// ✅ Correcto
public function show(Customer $customer): Response { ... }

// ❌ Incorrecto
public function show(int $id): Response
{
    $customer = Customer::findOrFail($id);
}
```
