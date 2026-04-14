<?php

use App\Models\Articulo;
use App\Models\Inventario;

// ─────────────────────────────────────────────────────
//  Feature tests — Inventario
//  Usan TenantTestCase (MySQL real, tenancy inicializado)
// ─────────────────────────────────────────────────────

test('puede crear inventario con cantidad positiva', function () {
    $articulo = Articulo::factory()->create();

    $response = $this->actingAs($this->adminUser)
        ->post(route('inventarios.store'), [
            'articulo_id' => $articulo->id,
            'cantidad'    => 50,
        ]);

    $response->assertRedirect(route('inventarios.index'));

    $this->assertDatabaseHas('inventarios', [
        'articulo_id' => $articulo->id,
        'cantidad'    => 50,
    ]);
});

test('no puede crear inventario con cantidad negativa', function () {
    $articulo = Articulo::factory()->create();

    $response = $this->actingAs($this->adminUser)
        ->post(route('inventarios.store'), [
            'articulo_id' => $articulo->id,
            'cantidad'    => -5,
        ]);

    $response->assertSessionHasErrors('cantidad');
});

test('puede actualizar la cantidad de un inventario existente', function () {
    $inventario = Inventario::factory()->conCantidad(20)->create();

    $response = $this->actingAs($this->adminUser)
        ->put(route('inventarios.update', $inventario), [
            'articulo_id' => $inventario->articulo_id,
            'cantidad'    => 35,
        ]);

    $response->assertRedirect(route('inventarios.index'));

    $this->assertDatabaseHas('inventarios', [
        'id'       => $inventario->id,
        'cantidad' => 35,
    ]);
});

test('puede eliminar un inventario', function () {
    $inventario = Inventario::factory()->create();

    $this->actingAs($this->adminUser)
        ->delete(route('inventarios.destroy', $inventario));

    $this->assertDatabaseMissing('inventarios', ['id' => $inventario->id]);
});
