<?php

use App\Models\Articulo;
use App\Models\Cliente;
use App\Models\Factura;
use App\Models\Inventario;

// ─────────────────────────────────────────────────────
//  Feature tests — Venta (POS)
//  Usan TenantTestCase (MySQL real, tenancy inicializado)
// ─────────────────────────────────────────────────────

test('crear venta POS con auto_delivery descuenta stock inmediatamente', function () {
    $articulo   = Articulo::factory()->create();
    $inventario = Inventario::factory()->conCantidad(10)->create(['articulo_id' => $articulo->id]);
    $cliente    = Cliente::factory()->create();

    $this->actingAs($this->adminUser)
        ->post(route('ventas.store'), [
            'cliente_id'    => $cliente->id,
            'tipo_venta'    => 'pos',
            'auto_delivery' => true,
            'metodo_pago'   => 'efectivo',
            'monto_pago'    => 300,
            'articulos'     => [
                ['articulo_id' => $articulo->id, 'cantidad' => 3, 'precio' => 100],
            ],
        ]);

    expect($inventario->fresh()->cantidad)->toBe(7);
});

test('crear venta POS sin auto_delivery crea entrega pendiente sin descontar stock', function () {
    $articulo   = Articulo::factory()->create();
    $inventario = Inventario::factory()->conCantidad(10)->create(['articulo_id' => $articulo->id]);
    $cliente    = Cliente::factory()->create();

    $this->actingAs($this->adminUser)
        ->post(route('ventas.store'), [
            'cliente_id'    => $cliente->id,
            'tipo_venta'    => 'pos',
            'auto_delivery' => false,
            'metodo_pago'   => 'efectivo',
            'monto_pago'    => 300,
            'articulos'     => [
                ['articulo_id' => $articulo->id, 'cantidad' => 3, 'precio' => 100],
            ],
        ]);

    // Stock no cambia
    expect($inventario->fresh()->cantidad)->toBe(10);

    // Hay una entrega pendiente
    $this->assertDatabaseHas('entregas', [
        'articulo_id' => $articulo->id,
        'estado'      => 'pendiente',
        'cantidad'    => 3,
    ]);
});

test('crear venta ecommerce crea entrega pendiente sin descontar stock', function () {
    $articulo   = Articulo::factory()->create();
    $inventario = Inventario::factory()->conCantidad(10)->create(['articulo_id' => $articulo->id]);
    $cliente    = Cliente::factory()->create();

    $this->actingAs($this->adminUser)
        ->post(route('ventas.store'), [
            'cliente_id'  => $cliente->id,
            'tipo_venta'  => 'ecommerce',
            'metodo_pago' => 'mercadopago',
            'monto_pago'  => 200,
            'articulos'   => [
                ['articulo_id' => $articulo->id, 'cantidad' => 2, 'precio' => 100],
            ],
        ]);

    expect($inventario->fresh()->cantidad)->toBe(10);

    $this->assertDatabaseHas('entregas', [
        'articulo_id' => $articulo->id,
        'estado'      => 'pendiente',
    ]);
});

test('el total se calcula correctamente con recargo', function () {
    $articulo = Articulo::factory()->create();
    $cliente  = Cliente::factory()->create();

    $this->actingAs($this->adminUser)
        ->post(route('ventas.store'), [
            'cliente_id'  => $cliente->id,
            'tipo_venta'  => 'pos',
            'metodo_pago' => 'efectivo',
            'monto_pago'  => 230,
            'recargo'     => 30,
            'descuento'   => 0,
            'articulos'   => [
                ['articulo_id' => $articulo->id, 'cantidad' => 2, 'precio' => 100],
            ],
        ]);

    // subtotal = 200, recargo = 30 → total = 230
    $this->assertDatabaseHas('facturas', [
        'subtotal' => 200,
        'recargo'  => 30,
        'total'    => 230,
    ]);
});

test('eliminar venta restaura el stock de los articulos', function () {
    $articulo   = Articulo::factory()->create();
    $inventario = Inventario::factory()->conCantidad(10)->create(['articulo_id' => $articulo->id]);
    $cliente    = Cliente::factory()->create();

    // Venta con auto_delivery para que descuente stock
    $this->actingAs($this->adminUser)
        ->post(route('ventas.store'), [
            'cliente_id'    => $cliente->id,
            'tipo_venta'    => 'pos',
            'auto_delivery' => true,
            'metodo_pago'   => 'efectivo',
            'monto_pago'    => 200,
            'articulos'     => [
                ['articulo_id' => $articulo->id, 'cantidad' => 4, 'precio' => 50],
            ],
        ]);

    expect($inventario->fresh()->cantidad)->toBe(6);

    $factura = Factura::latest()->first();

    $this->actingAs($this->adminUser)
        ->delete(route('ventas.destroy', $factura));

    expect($inventario->fresh()->cantidad)->toBe(10);
});
