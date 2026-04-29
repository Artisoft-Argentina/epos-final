<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\CategoriaController;
use Illuminate\Http\Request;

class FunctionCallingService
{
    /**
     * Define las funciones disponibles para el modelo
     */
    public function getAvailableTools(): array
    {
        return [
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_total_clientes',
                    'description' => 'Obtiene el número total de clientes registrados',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_total_productos',
                    'description' => 'Obtiene el número total de productos/artículos',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_top_clientes',
                    'description' => 'Obtiene los clientes que más compraron',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'limit' => [
                                'type' => 'integer',
                                'description' => 'Número de clientes a retornar (default: 10)',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_total_ventas',
                    'description' => 'Obtiene el total de ventas en dinero',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'fecha_inicio' => [
                                'type' => 'string',
                                'description' => 'Fecha de inicio (formato: YYYY-MM-DD)',
                            ],
                            'fecha_fin' => [
                                'type' => 'string',
                                'description' => 'Fecha de fin (formato: YYYY-MM-DD)',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_productos_bajo_stock',
                    'description' => 'Obtiene productos con stock bajo',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'umbral' => [
                                'type' => 'integer',
                                'description' => 'Cantidad mínima de stock (default: 10)',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'buscar_cliente',
                    'description' => 'Busca un cliente por nombre o CUIT',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'termino' => [
                                'type' => 'string',
                                'description' => 'Nombre o CUIT del cliente a buscar',
                            ],
                        ],
                        'required' => ['termino'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'crear_categoria',
                    'description' => 'Crea una nueva categoría de productos',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'nombre' => [
                                'type' => 'string',
                                'description' => 'Nombre de la categoría',
                            ],
                        ],
                        'required' => ['nombre'],
                    ],
                ],
            ],
        ];
    }

    /**
     * Ejecuta una función específica
     */
    public function executeFunction(string $functionName, array $arguments): array
    {
        return match ($functionName) {
            'get_total_clientes' => $this->getTotalClientes(),
            'get_total_productos' => $this->getTotalProductos(),
            'get_top_clientes' => $this->getTopClientes($arguments['limit'] ?? 10),
            'get_total_ventas' => $this->getTotalVentas($arguments['fecha_inicio'] ?? null, $arguments['fecha_fin'] ?? null),
            'get_productos_bajo_stock' => $this->getProductosBajoStock($arguments['umbral'] ?? 10),
            'buscar_cliente' => $this->buscarCliente($arguments['termino']),
            'crear_categoria' => $this->crearCategoria($arguments['nombre']),
            default => ['error' => 'Función no encontrada'],
        };
    }

    // ============ IMPLEMENTACIÓN DE FUNCIONES ============

    private function getTotalClientes(): array
    {
        return ['total' => DB::table('customers')->count()];
    }

    private function getTotalProductos(): array
    {
        return ['total' => DB::table('products')->count()];
    }

    private function getTopClientes(int $limit): array
    {
        $clientes = DB::table('sales')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->select('customers.business_name as razonsocial', DB::raw('SUM(sales.total) as total_comprado'))
            ->where('sales.afip_authorized', true)
            ->groupBy('sales.customer_id', 'customers.business_name')
            ->orderByDesc('total_comprado')
            ->limit($limit)
            ->get()
            ->toArray();

        return ['clientes' => $clientes];
    }

    private function getTotalVentas(?string $fechaInicio, ?string $fechaFin): array
    {
        $query = DB::table('sales')->where('afip_authorized', true);
        if ($fechaInicio) $query->where('date', '>=', $fechaInicio);
        if ($fechaFin)    $query->where('date', '<=', $fechaFin);
        return ['total' => $query->sum('total')];
    }

    private function getProductosBajoStock(int $umbral): array
    {
        $productos = DB::table('products')
            ->join('stocks', 'products.id', '=', 'stocks.product_id')
            ->select('products.name as nombre', 'stocks.quantity')
            ->where('stocks.quantity', '<=', $umbral)
            ->orderBy('stocks.quantity')
            ->get()
            ->toArray();

        return ['productos' => $productos];
    }

    private function buscarCliente(string $termino): array
    {
        $clientes = DB::table('customers')
            ->where('business_name', 'LIKE', "%{$termino}%")
            ->orWhere('tax_id', 'LIKE', "%{$termino}%")
            ->select('id', 'business_name', 'tax_id', 'email', 'phone')
            ->limit(10)
            ->get()
            ->toArray();

        return ['clientes' => $clientes];
    }

    private function crearCategoria(string $nombre): array
    {
        try {
            $nombre  = mb_strtoupper($nombre);
            $request = Request::create('/categorias', 'POST', ['name' => $nombre]);
            $controller = app(CategoriaController::class);
            $controller->store($request);

            $categoria = DB::table('categories')->where('name', $nombre)->first();

            return [
                'success' => true,
                'id'      => $categoria->id,
                'nombre'  => $categoria->name,
            ];
        } catch (\Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
}
