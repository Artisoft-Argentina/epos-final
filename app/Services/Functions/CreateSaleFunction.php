<?php

namespace App\Services\Functions;

use App\Models\Sale;
use App\Models\Customer;
use App\Models\Product;
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

            $customer = Customer::find($clienteId);
            if (!$customer) {
                return ['success' => false, 'message' => "Cliente con ID {$clienteId} no encontrado"];
            }

            DB::beginTransaction();

            $subtotal    = 0;
            $productsData = [];

            foreach ($items as $item) {
                $product = Product::with('stock')->find($item['articulo_id']);
                if (!$product) {
                    DB::rollBack();
                    return ['success' => false, 'message' => "Producto con ID {$item['articulo_id']} no encontrado"];
                }

                $quantity     = $item['cantidad'] ?? 1;
                $price        = $item['precio'] ?? $product->sale_price;
                $itemTotal    = $quantity * $price;
                $subtotal    += $itemTotal;

                $productsData[$product->id] = [
                    'quantity'      => $quantity,
                    'unit_price'    => $price,
                    'subtotal'      => $itemTotal,
                    'name'          => $product->name,
                    'sku'           => $product->sku ?? '',
                    'unit'          => $product->unit ?? 'UN',
                    'tax_rate'      => 21,
                    'discount'      => 0,
                ];
            }

            $invoiceNumber = Sale::where('voucher_letter', 'B')->max('invoice_number') ?? 0;
            $invoiceNumber++;

            $sale = Sale::create([
                'customer_id'    => $clienteId,
                'user_id'        => $userId,
                'tax_id'         => $customer->tax_id,
                'date'           => now()->format('Y-m-d'),
                'voucher_letter' => 'B',
                'voucher_code'   => 6,
                'pos_number'     => 1,
                'invoice_number' => $invoiceNumber,
                'discount'       => 0,
                'surcharge'      => 0,
                'additional_discount' => 0,
                'subtotal'       => $subtotal,
                'total'          => $subtotal,
                'payment_status' => 'NO',
                'sale_condition' => 'contado',
            ]);

            $sale->products()->attach($productsData);

            DB::commit();

            return [
                'success'    => true,
                'factura_id' => $sale->id,
                'numero'     => $invoiceNumber,
                'cliente'    => $customer->business_name,
                'total'      => $sale->total,
                'message'    => "Factura B #{$invoiceNumber} creada exitosamente para {$customer->business_name}. Total: \${$sale->total}",
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
