<?php

use App\Models\Marca;

// ─────────────────────────────────────────────────────
//  Feature tests — Marca
//  Usan TenantTestCase (MySQL real, tenancy inicializado)
// ─────────────────────────────────────────────────────

test('puede crear marca con nombre valido', function () {
    $response = $this->actingAs($this->adminUser)
        ->post(route('marcas.store'), ['marca' => 'Samsung']);

    $response->assertRedirect();
    $this->assertDatabaseHas('marcas', ['marca' => 'Samsung']);
});

test('falla si marca esta vacia', function () {
    $response = $this->actingAs($this->adminUser)
        ->post(route('marcas.store'), ['marca' => '']);

    $response->assertSessionHasErrors('marca');
    $this->assertDatabaseCount('marcas', 0);
});

test('falla si marca supera 255 caracteres', function () {
    $response = $this->actingAs($this->adminUser)
        ->post(route('marcas.store'), ['marca' => str_repeat('A', 256)]);

    $response->assertSessionHasErrors('marca');
});

test('usuario no autenticado es redirigido al login al intentar crear marca', function () {
    $response = $this->post(route('marcas.store'), ['marca' => 'Sony']);

    $response->assertRedirect(route('login'));
});

test('puede actualizar el nombre de una marca', function () {
    $marca = Marca::factory()->create(['marca' => 'Original']);

    $response = $this->actingAs($this->adminUser)
        ->put(route('marcas.update', $marca), ['marca' => 'Actualizada']);

    $response->assertRedirect();
    $this->assertDatabaseHas('marcas', ['id' => $marca->id, 'marca' => 'Actualizada']);
});

test('falla al actualizar marca con nombre vacio', function () {
    $marca = Marca::factory()->create(['marca' => 'Original']);

    $response = $this->actingAs($this->adminUser)
        ->put(route('marcas.update', $marca), ['marca' => '']);

    $response->assertSessionHasErrors('marca');
    $this->assertDatabaseHas('marcas', ['id' => $marca->id, 'marca' => 'Original']);
});

test('puede eliminar una marca', function () {
    $marca = Marca::factory()->create();

    $this->actingAs($this->adminUser)
        ->delete(route('marcas.destroy', $marca));

    $this->assertDatabaseMissing('marcas', ['id' => $marca->id]);
});
