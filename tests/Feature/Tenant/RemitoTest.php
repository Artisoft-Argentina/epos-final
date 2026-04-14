<?php

use App\Models\Articulo;
use App\Models\Inventario;
use App\Models\Remito;
use App\Models\Supplier;

// ─────────────────────────────────────────────────────
//  Feature tests — Remito
//  Usan TenantTestCase (MySQL real, tenancy inicializado)
// ─────────────────────────────────────────────────────

test('convertirAInventario incrementa stock en inventario existente', function () {
    $articulo   = Articulo::factory()->create();
    $inventario = Inventario::factory()->conCantidad(10)->create(['articulo_id' => $articulo->id]);

    $remito = Remito::factory()->create();
    $remito->detalles()->create([
        'articulo_id'    => $articulo->id,
        'articulo'       => $articulo->articulo,
        'codarticulo'    => $articulo->codarticulo,
        'codprov'        => $articulo->codprov ?? '',
        'medida'         => $articulo->medida ?? '',
        'cantidad'       => 5,
        'bonificacion'   => 0,
        'alicuota'       => 0,
        'preciounitario' => 100,
        'subtotal'       => 500,
    ]);

    $this->actingAs($this->adminUser)
        ->post(route('remitos.convertir-inventario', $remito));

    expect($inventario->fresh()->cantidad)->toBe(15);
    expect($remito->fresh()->convertido_inventario)->toBeTrue();
});

test('convertirAInventario crea inventario si no existia', function () {
    $articulo = Articulo::factory()->create();

    $remito = Remito::factory()->create();
    $remito->detalles()->create([
        'articulo_id'    => $articulo->id,
        'articulo'       => $articulo->articulo,
        'codarticulo'    => $articulo->codarticulo,
        'codprov'        => $articulo->codprov ?? '',
        'medida'         => $articulo->medida ?? '',
        'cantidad'       => 8,
        'bonificacion'   => 0,
        'alicuota'       => 0,
        'preciounitario' => 50,
        'subtotal'       => 400,
    ]);

    $this->actingAs($this->adminUser)
        ->post(route('remitos.convertir-inventario', $remito));

    $this->assertDatabaseHas('inventarios', [
        'articulo_id' => $articulo->id,
        'cantidad'    => 8,
    ]);
});

test('no puede convertir el mismo remito dos veces', function () {
    $remito = Remito::factory()->convertido()->create();

    $response = $this->actingAs($this->adminUser)
        ->post(route('remitos.convertir-inventario', $remito));

    $response->assertSessionHas('error');
});

test('store calcula subtotal correctamente', function () {
    $supplier = Supplier::factory()->create();
    $articulo = Articulo::factory()->create(['supplier_id' => $supplier->id]);

    $response = $this->actingAs($this->adminUser)
        ->post(route('remitos.store'), [
            'ptoventa'    => 1,
            'numremito'   => 99901,
            'fecha'       => now()->toDateString(),
            'supplier_id' => $supplier->id,
            'detalles'    => [
                ['articulo_id' => $articulo->id, 'cantidad' => 3, 'preciounitario' => 200],
                ['articulo_id' => $articulo->id, 'cantidad' => 2, 'preciounitario' => 150],
            ],
        ]);

    $response->assertRedirect(route('remitos.index'));

    // subtotal = 3×200 + 2×150 = 600 + 300 = 900
    $this->assertDatabaseHas('remitos', [
        'numremito' => 99901,
        'subtotal'  => 900,
        'total'     => 900,
    ]);
});
