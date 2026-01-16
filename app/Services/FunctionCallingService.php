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
        $total = DB::table('clientes')->count();
        return ['total' => $total];
    }

    private function getTotalProductos(): array
    {
        $total = DB::table('articulos')->count();
        return ['total' => $total];
    }

    private function getTopClientes(int $limit): array
    {
        $clientes = DB::table('facturas')
            ->join('clientes', 'facturas.cliente_id', '=', 'clientes.id')
            ->select('clientes.razonsocial', DB::raw('SUM(facturas.total) as total_comprado'))
            ->where('facturas.autorizada_afip', true)
            ->groupBy('facturas.cliente_id', 'clientes.razonsocial')
            ->orderByDesc('total_comprado')
            ->limit($limit)
            ->get()
            ->toArray();

        return ['clientes' => $clientes];
    }

    private function getTotalVentas(?string $fechaInicio, ?string $fechaFin): array
    {
        $query = DB::table('facturas')->where('autorizada_afip', true);

        if ($fechaInicio) {
            $query->where('fecha', '>=', $fechaInicio);
        }
        if ($fechaFin) {
            $query->where('fecha', '<=', $fechaFin);
        }

        $total = $query->sum('total');
        return ['total' => $total];
    }

    private function getProductosBajoStock(int $umbral): array
    {
        $productos = DB::table('articulos')
            ->join('inventarios', 'articulos.id', '=', 'inventarios.articulo_id')
            ->select('articulos.articulo as nombre', 'inventarios.cantidad')
            ->where('inventarios.cantidad', '<=', $umbral)
            ->orderBy('inventarios.cantidad')
            ->get()
            ->toArray();

        return ['productos' => $productos];
    }

    private function buscarCliente(string $termino): array
    {
        $clientes = DB::table('clientes')
            ->where('razonsocial', 'LIKE', "%{$termino}%")
            ->orWhere('documentounico', 'LIKE', "%{$termino}%")
            ->select('id', 'razonsocial', 'documentounico', 'email', 'telefono')
            ->limit(10)
            ->get()
            ->toArray();

        return ['clientes' => $clientes];
    }

    private function crearCategoria(string $nombre): array
    {
        try {
            $nombre = mb_strtoupper($nombre);
            $request = Request::create('/categorias', 'POST', ['categoria' => $nombre]);
            $controller = app(CategoriaController::class);
            $controller->store($request);

            $categoria = DB::table('categorias')->where('categoria', $nombre)->first();

            return [
                'success' => true,
                'id' => $categoria->id,
                'nombre' => $categoria->categoria,
            ];
        } catch (\Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
}
