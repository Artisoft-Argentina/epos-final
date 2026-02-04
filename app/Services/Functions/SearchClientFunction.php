<?php

namespace App\Services\Functions;

use App\Models\Cliente;

class SearchClientFunction
{
    public static function execute(array $params): array
    {
        $query = $params['query'] ?? '';

        // Buscar sin acentos para mayor flexibilidad
        $clientes = Cliente::where('razonsocial', 'like', "%{$query}%")
            ->orWhere('documentounico', 'like', "%{$query}%")
            ->orWhereRaw('LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(razonsocial, "á", "a"), "é", "e"), "í", "i"), "ó", "o"), "ú", "u")) LIKE ?', ["%" . strtolower($query) . "%"])
            ->limit(5)
            ->get(['id', 'razonsocial', 'documentounico', 'email']);

        if ($clientes->isEmpty()) {
            return [
                'success' => false,
                'message' => "No se encontraron clientes con '{$query}'",
            ];
        }

        return [
            'success' => true,
            'clientes' => $clientes->map(fn($c) => [
                'id' => $c->id,
                'nombre' => $c->razonsocial,
                'documento' => $c->documentounico,
                'email' => $c->email,
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
