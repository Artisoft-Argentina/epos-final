<?php

namespace App\Http\Requests;

use App\Models\SalePayment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount'         => ['required', 'numeric', 'gt:0'],
            'payment_method' => ['required', Rule::in(SalePayment::METHODS)],
            'payment_date'   => ['required', 'date'],
            'notes'          => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.gt'         => 'El monto del pago debe ser mayor a 0.',
            'payment_method.in' => 'El método de pago no es válido.',
        ];
    }
}
