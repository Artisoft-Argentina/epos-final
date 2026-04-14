<?php

use App\Models\Articulo;
use App\Models\Entrega;
use App\Models\Inventario;

// ─────────────────────────────────────────────────────
//  Feature tests — Entrega
//  Usan TenantTestCase (MySQL real, tenancy inicializado)
// ─────────────────────────────────────────────────────

test('marcarEntregada descuenta stock del inventario', function () {
    $articulo   = Articulo::factory()->create();
    $inventario = Inventario::factory()->conCantidad(10)->create(['articulo_id' => $articulo->id]);
    $entrega    = Entrega::factory()->pendiente()->create([
        'articulo_id' => $articulo->id,
        'cantidad'    => 3,
    ]);

    $this->actingAs($this->adminUser)
        ->post(route('entregas.marcar-entregada', $entrega));

    expect($inventario->fresh()->cantidad)->toBe(7);
    expect($entrega->fresh()->estado)->toBe('entregada');
});

test('marcarEntregada falla si stock insuficiente', function () {
    $articulo   = Articulo::factory()->create();
    Inventario::factory()->conCantidad(2)->create(['articulo_id' => $articulo->id]);
    $entrega = Entrega::factory()->pendiente()->create([
        'articulo_id' => $articulo->id,
        'cantidad'    => 5,
    ]);

    $this->actingAs($this->adminUser)
        ->post(route('entregas.marcar-entregada', $entrega));

    // El estado no cambió
    expect($entrega->fresh()->estado)->toBe('pendiente');
});

test('no puede marcar como entregada una entrega ya entregada', function () {
    $entrega = Entrega::factory()->entregada()->create();

    $response = $this->actingAs($this->adminUser)
        ->post(route('entregas.marcar-entregada', $entrega));

    $response->assertSessionHas('error');
});

test('no puede cancelar una entrega ya entregada', function () {
    $entrega = Entrega::factory()->entregada()->create();

    $response = $this->actingAs($this->adminUser)
        ->post(route('entregas.cancelar', $entrega));

    $response->assertSessionHas('error');
    expect($entrega->fresh()->estado)->toBe('entregada');
});

test('eliminar entrega entregada restaura stock', function () {
    $articulo   = Articulo::factory()->create();
    $inventario = Inventario::factory()->conCantidad(5)->create(['articulo_id' => $articulo->id]);
    $entrega    = Entrega::factory()->entregada()->create([
        'articulo_id' => $articulo->id,
        'cantidad'    => 3,
    ]);

    $this->actingAs($this->adminUser)
        ->delete(route('entregas.destroy', $entrega));

    expect($inventario->fresh()->cantidad)->toBe(8);
    $this->assertDatabaseMissing('entregas', ['id' => $entrega->id]);
});

test('eliminar entrega pendiente no modifica stock', function () {
    $articulo   = Articulo::factory()->create();
    $inventario = Inventario::factory()->conCantidad(10)->create(['articulo_id' => $articulo->id]);
    $entrega    = Entrega::factory()->pendiente()->create([
        'articulo_id' => $articulo->id,
        'cantidad'    => 4,
    ]);

    $this->actingAs($this->adminUser)
        ->delete(route('entregas.destroy', $entrega));

    expect($inventario->fresh()->cantidad)->toBe(10);
});
