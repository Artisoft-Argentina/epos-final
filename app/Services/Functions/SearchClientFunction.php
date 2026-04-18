<?php

namespace App\Services\Functions;

use App\Models\Customer;

class SearchClientFunction
{
    public static function execute(array $params): array
    {
        $query = $params['query'] ?? '';

        // Buscar sin acentos para mayor flexibilidad
        $customers = Customer::where('business_name', 'like', "%{$query}%")
            ->orWhere('tax_id', 'like', "%{$query}%")
            ->orWhereRaw('LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(business_name, "á", "a"), "é", "e"), "í", "i"), "ó", "o"), "ú", "u")) LIKE ?', ["%" . strtolower($query) . "%"])
            ->limit(5)
            ->get(['id', 'business_name', 'tax_id', 'email']);

        if ($customers->isEmpty()) {
            return [
                'success' => false,
                'message' => "No se encontraron clientes con '{$query}'",
            ];
        }

        return [
            'success' => true,
            'clientes' => $customers->map(fn($c) => [
                'id'        => $c->id,
                'nombre'    => $c->business_name,
                'documento' => $c->tax_id,
                'email'     => $c->email,
            ])->toArray(),
        ];
    }

    public static function definition(): array
    {
        return [
            'type' => 'function',
            'function' => [
                'name' => 'search_client',
                'description' => 'Busca clientes por nombre o documento único',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'query' => [
                            'type' => 'string',
                            'description' => 'Nombre o documento del cliente a buscar',
                        ],
                    ],
                    'required' => ['query'],
                ],
            ],
        ];
    }
}
