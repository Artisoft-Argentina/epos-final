<?php

use App\Models\Customer;
use App\Models\Sale;

/**
 * Derivación de la letra de comprobante a partir de la condición IVA del cliente.
 * Lógica pura: no toca base de datos.
 */

function customerWithTaxStatus(?string $taxStatus): Customer
{
    return new Customer(['business_name' => 'Test', 'tax_status' => $taxStatus]);
}

it('factura A a responsable inscripto y monotributo por código', function (string $code) {
    expect(Sale::resolveVoucherLetter(customerWithTaxStatus($code)))->toBe('A');
})->with(['RI', 'MO', 'ri', ' RI ']);

it('factura B a consumidor final y exento por código', function (string $code) {
    expect(Sale::resolveVoucherLetter(customerWithTaxStatus($code)))->toBe('B');
})->with(['CF', 'EX', 'cf']);

it('factura A cuando la condición viene como texto largo', function (string $status) {
    expect(Sale::resolveVoucherLetter(customerWithTaxStatus($status)))->toBe('A');
})->with(['Responsable Inscripto', 'responsable inscripto', 'Monotributo']);

it('factura B ante texto largo de consumidor final o exento', function (string $status) {
    expect(Sale::resolveVoucherLetter(customerWithTaxStatus($status)))->toBe('B');
})->with(['Consumidor Final', 'Exento']);

it('cae en factura B si no hay cliente o condición IVA', function () {
    expect(Sale::resolveVoucherLetter(null))->toBe('B')
        ->and(Sale::resolveVoucherLetter(customerWithTaxStatus(null)))->toBe('B')
        ->and(Sale::resolveVoucherLetter(customerWithTaxStatus('')))->toBe('B');
});

it('cae en factura B ante una condición desconocida', function () {
    expect(Sale::resolveVoucherLetter(customerWithTaxStatus('CUALQUIER COSA')))->toBe('B');
});
