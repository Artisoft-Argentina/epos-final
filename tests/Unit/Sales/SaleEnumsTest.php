<?php

use App\Enums\PaymentStatus;
use App\Enums\SaleCondition;
use App\Enums\SaleType;
use App\Models\SalePayment;

/**
 * Contratos de los enums del circuito de venta y de los métodos de pago.
 * Lógica pura: no toca base de datos.
 */

it('define los cuatro estados de pago con sus valores de BD', function () {
    expect(array_map(fn ($case) => $case->value, PaymentStatus::cases()))
        ->toBe(['pending', 'partial', 'paid', 'cancelled']);
});

it('etiqueta cada estado de pago en español', function (PaymentStatus $status, string $label) {
    expect($status->label())->toBe($label);
})->with([
    [PaymentStatus::Pending, 'Pendiente'],
    [PaymentStatus::Partial, 'Parcial'],
    [PaymentStatus::Paid, 'Pagada'],
    [PaymentStatus::Cancelled, 'Cancelada'],
]);

it('asigna una variante de badge distinta a cada estado', function () {
    $variants = array_map(fn (PaymentStatus $s) => $s->badgeVariant(), PaymentStatus::cases());

    expect($variants)->toBe(['warning', 'info', 'success', 'destructive'])
        ->and($variants)->toHaveCount(count(array_unique($variants)));
});

it('considera con saldo pendiente solo a pendiente y parcial', function () {
    expect(PaymentStatus::owingCases())->toBe(['pending', 'partial']);
});

it('mapea los valores de condición de venta y origen', function () {
    expect(SaleCondition::Cash->label())->toBe('Contado')
        ->and(SaleCondition::Credit->label())->toBe('Cuenta corriente')
        ->and(SaleType::Pos->label())->toBe('POS')
        ->and(SaleType::Ecommerce->label())->toBe('Ecommerce');
});

it('acepta todos los métodos de pago que ofrece la UI', function (string $method) {
    expect(SalePayment::METHODS)->toContain($method);
})->with(['efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'mercadopago', 'cheque']);
