<?php

namespace App\Services\Functions;

use App\Models\Factura;
use App\Models\Cliente;
use App\Models\Articulo;
use Illuminate\Support\Facades\DB;

class CreateSaleFunction
{
    public static function execute(array $params, int $userId): array
    {
        try {
            $clienteId = $params['cliente_id'] ?? null;
            $items = $params['items'] ?? [];

            if (!$clienteId || empty($items)) {
                return [
                    'success' => false,
                    'message' => 'Faltan datos: cliente_id e items son requeridos',
                ];
            }

            $cliente = Cliente::find($clienteId);
            if (!$cliente) {
                return [
                    'success' => false,
                    'message' => "Cliente con ID {$clienteId} no encontrado",
                ];
            }

            DB::beginTransaction();

            // Calcular totales
            $subtotal = 0;
            $articulosData = [];

            foreach ($items as $item) {
                $articulo = Articulo::with('inventario')->find($item['articulo_id']);
                if (!$articulo) {
                    DB::rollBack();
                    return [
                        'success' => false,
                        'message' => "Producto con ID {$item['articulo_id']} no encontrado",
                    ];
                }

                $cantidad = $item['cantidad'] ?? 1;
                $precio = $item['precio'] ?? $articulo->precioVenta;
                $itemTotal = $cantidad * $precio;
                $subtotal += $itemTotal;

                $articulosData[$articulo->id] = [
                    'cantidad' => $cantidad,
                    'preciounitario' => $precio,
                    'subtotal' => $itemTotal,
                    'articulo' => $articulo->articulo,
                    'codarticulo' => $articulo->codarticulo ?? '',
                    'medida' => $articulo->inventario->medida ?? 'UN',
                    'alicuota' => 21,
                    'bonificacion' => 0,
                ];
            }

            // Crear factura
            $numFactura = Factura::where('letracomprobante', 'B')->max('numfactura') ?? 0;
            $numFactura++;
            
            $factura = Factura::create([
                'cliente_id' => $clienteId,
                'user_id' => $userId,
                'cuit' => $cliente->documentounico,
                'fecha' => now()->format('Y-m-d'),
                'letracomprobante' => 'B',
                'codcomprobante' => 6,
                'ptoventa' => 1,
                'numfactura' => $numFactura,
                'bonificacion' => 0,
                'recargo' => 0,
                'descuento' => 0,
                'subtotal' => $subtotal,
                'total' => $subtotal,
                'pagada' => '0',
                'condicionventa' => 'contado',
            ]);

            // Asociar artículos
            $factura->articulos()->attach($articulosData);

            DB::commit();

            return [
                'success' => true,
                'factura_id' => $factura->id,
                'numero' => $numFactura,
                'cliente' => $cliente->razonsocial,
                'total' => $factura->total,
                'message' => "Factura B #{$numFactura} creada exitosamente para {$cliente->razonsocial}. Total: \${$factura->total}",
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'Error al crear factura: ' . $e->getMessage(),
            ];
        }
    }

    public static function definition(): array
    {
        return [
            'type' => 'function',
            'function' => [
                'name' => 'create_sale',
                'description' => 'Crea una nueva venta/factura con los productos especificados para un cliente',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'cliente_id' => [
                            'type' => 'integer',
                            'description' => 'ID del cliente (usar search_client primero para obtenerlo)',
                        ],
                        'items' => [
                            'type' => 'array',
                            'description' => 'Lista de productos a facturar',
                            'items' => [
                                'type' => 'object',
                                'properties' => [
                                    'articulo_id' => [
                                        'type' => 'integer',
                                        'description' => 'ID del producto',
                                    ],
                                    'cantidad' => [
                                        'type' => 'integer',
                                        'description' => 'Cantidad del producto',
                                    ],
                                    'precio' => [
                                        'type' => 'number',
                                        'description' => 'Precio unitario (opcional, usa el precio del producto por defecto)',
                                    ],
                                ],
                                'required' => ['articulo_id', 'cantidad'],
                            ],
                        ],
                    ],
                    'required' => ['cliente_id', 'items'],
                ],
            ],
        ];
    }
}
