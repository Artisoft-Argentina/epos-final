<?php

namespace App\Services\Functions;

use App\Models\Cliente;
use App\Models\Articulo;

class CreateAndSendInvoiceFunction
{
    public static function execute(array $params, int $userId): array
    {
        $steps = [];
        
        try {
            // Paso 1: Buscar cliente
            $steps[] = 'Buscando cliente...';
            $clienteTerm = $params['cliente'] ?? null;
            if (!$clienteTerm) {
                return [
                    'success' => false,
                    'message' => 'Debe especificar el cliente',
                    'steps' => $steps,
                ];
            }

            $cliente = Cliente::where('razonsocial', 'LIKE', "%{$clienteTerm}%")
                ->orWhere('documentounico', 'LIKE', "%{$clienteTerm}%")
                ->first();

            if (!$cliente) {
                return [
                    'success' => false,
                    'message' => "Cliente '{$clienteTerm}' no encontrado",
                    'steps' => $steps,
                ];
            }
            $steps[] = "✓ Cliente encontrado: {$cliente->razonsocial}";

            // Paso 2: Buscar productos
            $steps[] = 'Buscando productos...';
            $items = [];
            foreach ($params['productos'] as $prod) {
                $articulo = Articulo::where('articulo', 'LIKE', "%{$prod['nombre']}%")
                    ->orWhere('codarticulo', 'LIKE', "%{$prod['nombre']}%")
                    ->first();

                if (!$articulo) {
                    return [
                        'success' => false,
                        'message' => "Producto '{$prod['nombre']}' no encontrado",
                        'steps' => $steps,
                    ];
                }

                $items[] = [
                    'articulo_id' => $articulo->id,
                    'cantidad' => $prod['cantidad'] ?? 1,
                    'precio' => $prod['precio'] ?? null,
                ];
                $steps[] = "✓ Producto encontrado: {$articulo->articulo} x{$prod['cantidad']}";
            }

            // Paso 3: Crear venta
            $steps[] = 'Creando factura...';
            $saleResult = CreateSaleFunction::execute([
                'cliente_id' => $cliente->id,
                'items' => $items,
            ], $userId);

            if (!$saleResult['success']) {
                return [
                    'success' => false,
                    'message' => $saleResult['message'],
                    'steps' => $steps,
                ];
            }
            $steps[] = "✓ Factura #{$saleResult['numero']} creada. Total: \${$saleResult['total']}";

            // Paso 4: Autorizar en AFIP
            $steps[] = 'Autorizando en AFIP...';
            $authorizeFunction = new AuthorizeInvoiceFunction();
            $afipResult = $authorizeFunction->execute([
                'factura_id' => $saleResult['factura_id'],
                'enviar_email' => true,
            ]);

            if (!$afipResult['success']) {
                return [
                    'success' => false,
                    'message' => $afipResult['message'],
                    'steps' => $steps,
                    'factura_id' => $saleResult['factura_id'],
                    'factura_creada' => true,
                ];
            }
            $steps[] = "✓ Autorizada en AFIP. CAE: {$afipResult['cae']}";

            // Paso 5: Email
            if ($afipResult['email_enviado'] ?? false) {
                $steps[] = "✓ Email enviado a {$cliente->email}";
            } else {
                $steps[] = "⚠ No se pudo enviar el email";
            }

            return [
                'success' => true,
                'factura_id' => $saleResult['factura_id'],
                'numero' => $saleResult['numero'],
                'cliente' => $cliente->razonsocial,
                'total' => $saleResult['total'],
                'cae' => $afipResult['cae'],
                'email_enviado' => $afipResult['email_enviado'] ?? false,
                'steps' => $steps,
                'message' => "Proceso completado: Factura #{$saleResult['numero']} creada, autorizada (CAE: {$afipResult['cae']}) y enviada a {$cliente->email}",
            ];

        } catch (\Exception $e) {
            $steps[] = "✗ Error: {$e->getMessage()}";
            return [
                'success' => false,
                'message' => 'Error en el proceso: ' . $e->getMessage(),
                'steps' => $steps,
            ];
        }
    }

    public static function definition(): array
    {
        return [
            'type' => 'function',
            'function' => [
                'name' => 'create_and_send_invoice',
                'description' => 'Proceso completo: crea una factura, la autoriza en AFIP y la envía por email al cliente. Todo en un solo paso.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'cliente' => [
                            'type' => 'string',
                            'description' => 'Nombre o CUIT del cliente',
                        ],
                        'productos' => [
                            'type' => 'array',
                            'description' => 'Lista de productos a facturar',
                            'items' => [
                                'type' => 'object',
                                'properties' => [
                                    'nombre' => [
                                        'type' => 'string',
                                        'description' => 'Nombre o código del producto',
                                    ],
                                    'cantidad' => [
                                        'type' => 'integer',
                                        'description' => 'Cantidad (default: 1)',
                                    ],
                                    'precio' => [
                                        'type' => 'number',
                                        'description' => 'Precio unitario (opcional)',
                                    ],
                                ],
                                'required' => ['nombre'],
                            ],
                        ],
                    ],
                    'required' => ['cliente', 'productos'],
                ],
            ],
        ];
    }
}
