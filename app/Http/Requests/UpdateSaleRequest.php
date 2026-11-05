<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'surcharge'           => ['nullable', 'numeric', 'min:0'],
            'additional_discount' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
