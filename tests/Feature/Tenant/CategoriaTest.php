<?php

use App\Models\Categoria;

// ─────────────────────────────────────────────────────
//  Feature tests — Categoría
//  Usan TenantTestCase (MySQL real, tenancy inicializado)
// ─────────────────────────────────────────────────────

test('puede crear categoria con nombre valido', function () {
    $response = $this->actingAs($this->adminUser)
        ->post(route('categorias.store'), ['categoria' => 'Electrónica']);

    $response->assertRedirect();
    $this->assertDatabaseHas('categorias', ['categoria' => 'Electrónica']);
});

test('falla si categoria esta vacia', function () {
    $response = $this->actingAs($this->adminUser)
        ->post(route('categorias.store'), ['categoria' => '']);

    $response->assertSessionHasErrors('categoria');
    $this->assertDatabaseCount('categorias', 0);
});

test('falla si categoria supera 255 caracteres', function () {
    $response = $this->actingAs($this->adminUser)
        ->post(route('categorias.store'), ['categoria' => str_repeat('A', 256)]);

    $response->assertSessionHasErrors('categoria');
});

test('usuario no autenticado es redirigido al login al intentar crear categoria', function () {
    $response = $this->post(route('categorias.store'), ['categoria' => 'Herramientas']);

    $response->assertRedirect(route('login'));
});

test('el modelo capitaliza automaticamente la primera letra al crear', function () {
    $this->actingAs($this->adminUser)
        ->post(route('categorias.store'), ['categoria' => 'herramientas']);

    $this->assertDatabaseHas('categorias', ['categoria' => 'Herramientas']);
});

test('el modelo capitaliza automaticamente la primera letra al actualizar', function () {
    $categoria = Categoria::factory()->create(['categoria' => 'Herramientas']);

    $this->actingAs($this->adminUser)
        ->put(route('categorias.update', $categoria), ['categoria' => 'accesorios']);

    $this->assertDatabaseHas('categorias', ['id' => $categoria->id, 'categoria' => 'Accesorios']);
});

test('puede actualizar el nombre de una categoria', function () {
    $categoria = Categoria::factory()->create(['categoria' => 'Original']);

    $response = $this->actingAs($this->adminUser)
        ->put(route('categorias.update', $categoria), ['categoria' => 'Actualizada']);

    $response->assertRedirect();
    $this->assertDatabaseHas('categorias', ['id' => $categoria->id, 'categoria' => 'Actualizada']);
});

test('puede eliminar una categoria', function () {
    $categoria = Categoria::factory()->create();

    $this->actingAs($this->adminUser)
        ->delete(route('categorias.destroy', $categoria));

    $this->assertDatabaseMissing('categorias', ['id' => $categoria->id]);
});
