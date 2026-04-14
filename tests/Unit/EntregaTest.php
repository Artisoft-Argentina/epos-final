<?php

use App\Models\Entrega;

// ─────────────────────────────────────────────────────
//  Unit tests del modelo Entrega
//  No usan BD — sólo prueban métodos del modelo en RAM
// ─────────────────────────────────────────────────────

test('isPendiente devuelve true cuando estado es pendiente', function () {
    $entrega = new Entrega(['estado' => 'pendiente']);

    expect($entrega->isPendiente())->toBeTrue();
});

test('isPendiente devuelve false cuando estado es entregada', function () {
    $entrega = new Entrega(['estado' => 'entregada']);

    expect($entrega->isPendiente())->toBeFalse();
});

test('isEntregada devuelve true cuando estado es entregada', function () {
    $entrega = new Entrega(['estado' => 'entregada']);

    expect($entrega->isEntregada())->toBeTrue();
});

test('isEntregada devuelve false cuando estado es pendiente', function () {
    $entrega = new Entrega(['estado' => 'pendiente']);

    expect($entrega->isEntregada())->toBeFalse();
});

test('isEntregada devuelve false cuando estado es cancelada', function () {
    $entrega = new Entrega(['estado' => 'cancelada']);

    expect($entrega->isEntregada())->toBeFalse();
});
