<?php

namespace App\Services\Functions;

use App\Models\Articulo;

class SearchProductFunction
{
    public static function execute(array $params): array
    {
        $query = $params['query'] ?? '';

        $productos = Articulo::where('articulo', 'like', "%{$query}%")
            ->orWhere('codarticulo', 'like', "%{$query}%")
            ->with(['inventario', 'listasPrecios'])
            ->limit(5)
            ->get();

        if ($productos->isEmpty()) {
            return [
                'success' => false,
                'message' => "No se encontraron productos con '{$query}'",
            ];
        }

        return [
            'success' => true,
            'productos' => $productos->map(fn ($p) => [
                'id' => $p->id,
                'nombre' => $p->articulo,
                'codigo' => $p->codigo,
                'precio' => $p->precioVenta,
                'stock' => $p->inventario->stock ?? 0,
            ])->toArray(),
        ];
    }

    public static function definition(): array
    {
        return [
            'type' => 'function',
            'function' => [
                'name' => 'search_product',
                'description' => 'Busca productos por nombre o código y muestra stock disponible',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'query' => [
                            'type' => 'string',
                            'description' => 'Nombre o código del producto a buscar',
                        ],
                    ],
                    'required' => ['query'],
                ],
            ],
        ];
    }
}
