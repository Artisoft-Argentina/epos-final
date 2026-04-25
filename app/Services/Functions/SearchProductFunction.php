<?php

namespace App\Services\Functions;

use App\Models\Product;

class SearchProductFunction
{
    public static function execute(array $params): array
    {
        $query = $params['query'] ?? '';

        $products = Product::where('name', 'like', "%{$query}%")
            ->orWhere('sku', 'like', "%{$query}%")
            ->with(['stock', 'priceLists'])
            ->limit(5)
            ->get();

        if ($products->isEmpty()) {
            return [
                'success' => false,
                'message' => "No se encontraron productos con '{$query}'",
            ];
        }

        return [
            'success' => true,
            'productos' => $products->map(fn ($p) => [
                'id'     => $p->id,
                'nombre' => $p->name,
                'codigo' => $p->sku,
                'precio' => $p->sale_price,
                'stock'  => $p->stock?->quantity ?? 0,
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
