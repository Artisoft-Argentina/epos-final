# Prompt para generar tests a partir de las especificaciones EPOS

## Instrucciones para Claude Code

Sos un generador de tests automatizados para el proyecto EPOS (Laravel 12 + Pest).

A partir del archivo `tests/specs/reglas-negocio.yml`, generá tests en Pest PHP siguiendo estas reglas:

---

### Contexto técnico

- **Framework**: Laravel 12 + Pest PHP
- **Clase base para Feature tests**: `Tests\TenantTestCase`
  - Provee `$this->adminUser` (usuario admin autenticado)
  - Provee `$this->tenant` (tenant activo)
  - Usa SQLite en memoria, con migraciones corridas
- **Clase base para Unit tests**: `Tests\TestCase` (o `PHPUnit\Framework\TestCase` para tests sin DB)
- **Ubicación de tests feature**: `tests/Feature/Tenant/<Modulo>Test.php`
- **Ubicación de tests unit**: `tests/Unit/<Modulo>Test.php`
- **No usar axios**: fetch nativo con CSRF token
- **Autenticación en tests**: `$this->actingAs($this->adminUser)`

---

### Reglas de generación

Por cada **regla** en el YAML generá:

1. **Al menos 1 test positivo** (escenario happy path)
2. **Al menos 1 test negativo por cada campo inválido** (validation errors)
3. **Edge cases explícitos** (valores límite: 0, null, string vacío, max+1)
4. **Tests de acceso** (usuario no autenticado → redirect al login)

Por cada **escenario** en el YAML generá exactamente 1 función `test()`.

---

### Convenciones de nombrado

```
test('<accion> <contexto> <resultado esperado>', function () { ... });
```

Ejemplos:
- `test('puede crear marca con nombre valido', ...)`
- `test('falla si marca esta vacia', ...)`
- `test('usuario no autenticado es redirigido al login', ...)`
- `test('crear venta POS con auto_delivery descuenta stock inmediatamente', ...)`

---

### Factories necesarias

Antes de generar los tests, verificá si existen factories en `database/factories/`.
Si no existen, generá también los archivos de factory necesarios.

Los modelos que necesitan factory son los que aparecen en las cláusulas `given` del YAML:
- `Marca`, `Categoria`, `Articulo`, `Inventario`, `Supplier`, `Remito`, `Entrega`, `Cliente`

Cada factory debe:
- Extender `Illuminate\Database\Eloquent\Factories\Factory`
- El modelo debe usar el trait `HasFactory`
- Usar `fake()` para datos realistas
- Incluir estados (`state()`) donde el YAML mencione variantes (ej: `conCantidad(n)`, `convertido()`)

---

### Estructura de un test Feature típico

```php
test('descripcion del test', function () {
    // Arrange — preparar datos
    $marca = Marca::factory()->create();

    // Act — ejecutar la acción
    $response = $this->actingAs($this->adminUser)
        ->post(route('marcas.store'), ['marca' => 'Nike']);

    // Assert — verificar resultado
    $response->assertRedirect();
    $this->assertDatabaseHas('marcas', ['marca' => 'Nike']);
});
```

---

### Estructura de un test Unit típico

```php
test('isPendiente devuelve true cuando estado es pendiente', function () {
    $entrega = new Entrega(['estado' => 'pendiente']);
    expect($entrega->isPendiente())->toBeTrue();
});
```

---

### Output esperado

Para cada módulo del YAML generá:
1. El archivo de test en `tests/Feature/Tenant/<Modulo>Test.php`
2. Los factories faltantes en `database/factories/<Modelo>Factory.php`
3. Si el modelo no tiene `HasFactory`, agregalo

No modifiques código existente que no sea necesario para los tests.
No agregues docblocks ni comentarios salvo los del YAML.
