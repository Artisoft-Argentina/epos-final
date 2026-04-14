<?php

use App\Models\Articulo;
use App\Models\Categoria;
use App\Models\Marca;
use App\Models\Supplier;

// ─────────────────────────────────────────────────────
//  Feature tests — Artículo
//  Usan TenantTestCase (MySQL real, tenancy inicializado)
// ─────────────────────────────────────────────────────

/**
 * Genera un payload válido completo para crear un artículo.
 * Cada test puede sobreescribir el campo que quiere invalidar.
 */
function payloadArticuloValido(): array
{
    return [
        'codarticulo'  => 'ART-001',
        'articulo'     => 'Martillo',
        'descripcion'  => 'Martillo de acero forjado',
        'medida'       => 'unidad',
        'precio'       => 1500,
        'alicuota'     => 21,
        'stockminimo'  => 5,
        'marca_id'     => Marca::factory()->create()->id,
        'categoria_id' => Categoria::factory()->create()->id,
    ];
}

// ── Alta exitosa ─────────────────────────────────────

test('puede crear articulo con todos los campos requeridos', function () {
    $response = $this->actingAs($this->adminUser)
        ->post(route('articulos.store'), payloadArticuloValido());

    $response->assertRedirect();
    $this->assertDatabaseHas('articulos', [
        'codarticulo' => 'ART-001',
        'articulo'    => 'Martillo',
    ]);
});

test('puede crear articulo con supplier_id opcional', function () {
    $supplier = Supplier::factory()->create();
    $payload  = array_merge(payloadArticuloValido(), [
        'codarticulo' => 'ART-002',
        'supplier_id' => $supplier->id,
    ]);

    $response = $this->actingAs($this->adminUser)
        ->post(route('articulos.store'), $payload);

    $response->assertRedirect();
    $this->assertDatabaseHas('articulos', [
        'codarticulo' => 'ART-002',
        'supplier_id' => $supplier->id,
    ]);
});

// ── Campos de texto requeridos ───────────────────────

test('falla si codarticulo esta vacio', function () {
    $payload = array_merge(payloadArticuloValido(), ['codarticulo' => '']);

    $this->actingAs($this->adminUser)
        ->post(route('articulos.store'), $payload)
        ->assertSessionHasErrors('codarticulo');
});

test('falla si nombre del articulo esta vacio', function () {
    $payload = array_merge(payloadArticuloValido(), ['articulo' => '']);

    $this->actingAs($this->adminUser)
        ->post(route('articulos.store'), $payload)
        ->assertSessionHasErrors('articulo');
});

test('falla si descripcion esta vacia', function () {
    $payload = array_merge(payloadArticuloValido(), ['descripcion' => '']);

    $this->actingAs($this->adminUser)
        ->post(route('articulos.store'), $payload)
        ->assertSessionHasErrors('descripcion');
});

test('falla si medida esta vacia', function () {
    $payload = array_merge(payloadArticuloValido(), ['medida' => '']);

    $this->actingAs($this->adminUser)
        ->post(route('articulos.store'), $payload)
        ->assertSessionHasErrors('medida');
});

// ── Validaciones numéricas ───────────────────────────

test('falla si precio es negativo', function () {
    $payload = array_merge(payloadArticuloValido(), ['precio' => -1]);

    $this->actingAs($this->adminUser)
        ->post(route('articulos.store'), $payload)
        ->assertSessionHasErrors('precio');
});

test('falla si precio no es numerico', function () {
    $payload = array_merge(payloadArticuloValido(), ['precio' => 'abc']);

    $this->actingAs($this->adminUser)
        ->post(route('articulos.store'), $payload)
        ->assertSessionHasErrors('precio');
});

test('falla si alicuota es negativa', function () {
    $payload = array_merge(payloadArticuloValido(), ['alicuota' => -5]);

    $this->actingAs($this->adminUser)
        ->post(route('articulos.store'), $payload)
        ->assertSessionHasErrors('alicuota');
});

test('falla si stockminimo es negativo', function () {
    $payload = array_merge(payloadArticuloValido(), ['stockminimo' => -1]);

    $this->actingAs($this->adminUser)
        ->post(route('articulos.store'), $payload)
        ->assertSessionHasErrors('stockminimo');
});

test('acepta stockminimo igual a cero como valor limite valido', function () {
    $payload = array_merge(payloadArticuloValido(), [
        'codarticulo' => 'ART-ZERO',
        'stockminimo' => 0,
    ]);

    $this->actingAs($this->adminUser)
        ->post(route('articulos.store'), $payload)
        ->assertSessionMissingErrors('stockminimo');

    $this->assertDatabaseHas('articulos', ['codarticulo' => 'ART-ZERO', 'stockminimo' => 0]);
});

// ── Validaciones de claves foráneas ─────────────────

test('falla si marca_id no existe en la BD', function () {
    $payload = array_merge(payloadArticuloValido(), ['marca_id' => 99999]);

    $this->actingAs($this->adminUser)
        ->post(route('articulos.store'), $payload)
        ->assertSessionHasErrors('marca_id');
});

test('falla si categoria_id no existe en la BD', function () {
    $payload = array_merge(payloadArticuloValido(), ['categoria_id' => 99999]);

    $this->actingAs($this->adminUser)
        ->post(route('articulos.store'), $payload)
        ->assertSessionHasErrors('categoria_id');
});

// ── Eliminación ──────────────────────────────────────

test('destroy hace soft-delete y el registro persiste con deleted_at', function () {
    $articulo = Articulo::factory()->create();

    $this->actingAs($this->adminUser)
        ->delete(route('articulos.destroy', $articulo));

    $this->assertSoftDeleted('articulos', ['id' => $articulo->id]);
});
