<?php

namespace App\Http\Requests;

use App\Models\SalePayment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        // La autorización por permiso la aplica el middleware can:ventas.store en la ruta.
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id'            => ['required', 'exists:customers,id'],
            'items'                  => ['required', 'array', 'min:1'],
            'items.*.product_id'     => ['required', 'exists:products,id'],
            'items.*.quantity'       => ['required', 'integer', 'min:1'],
            'items.*.price'          => ['required', 'numeric', 'gt:0'],
            'items.*.warehouse_id'   => ['nullable', 'exists:warehouses,id'],
            'items.*.delivery_mode'  => ['nullable', 'in:immediate,pending,transfer_request'],
            'surcharge'              => ['nullable', 'numeric', 'min:0'],
            'additional_discount'    => ['nullable', 'numeric', 'min:0'],
            'payment_method'         => ['required', Rule::in(SalePayment::METHODS)],
            'payment_amount'         => ['required', 'numeric', 'min:0'],
            'auto_payment'           => ['boolean'],
            'auto_delivery'          => ['boolean'],
            // El precio de cada línea sale de una lista: sin lista no se factura.
            // `exists` a secas aceptaría una lista dada de baja (no mira deleted_at).
            'price_list_id'          => ['required', Rule::exists('price_lists', 'id')->whereNull('deleted_at')],
            'sale_type'              => ['nullable', 'in:pos,ecommerce'],
            'point_of_sale_id'       => ['nullable', 'exists:points_of_sale,id'],
        ];
    }

    /** Regla adicional: el pago no puede superar el total de la venta. */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $items = $this->input('items', []);
            if (! is_array($items)) {
                return;
            }

            $subtotal = 0.0;
            foreach ($items as $item) {
                $subtotal += (float) ($item['quantity'] ?? 0) * (float) ($item['price'] ?? 0);
            }

            $total = round($subtotal + (float) $this->input('surcharge', 0) - (float) $this->input('additional_discount', 0), 2);
            $paymentAmount = round((float) $this->input('payment_amount', 0), 2);

            if ($paymentAmount > $total) {
                $validator->errors()->add('payment_amount', 'El pago no puede superar el total de la venta.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'customer_id.required'         => 'Seleccioná un cliente.',
            'customer_id.exists'           => 'El cliente seleccionado no existe.',
            'items.required'               => 'Agregá al menos un artículo.',
            'items.min'                    => 'Agregá al menos un artículo.',
            'items.*.product_id.required'  => 'Seleccioná un artículo en cada línea.',
            'items.*.product_id.exists'    => 'Uno de los artículos no existe.',
            'items.*.quantity.min'         => 'La cantidad debe ser al menos 1.',
            'items.*.price.gt'             => 'El precio debe ser mayor a 0.',
            'payment_method.in'            => 'El método de pago no es válido.',
            'price_list_id.required'       => 'Seleccioná una lista de precios.',
            'price_list_id.exists'         => 'La lista de precios seleccionada no existe.',
        ];
    }
}
