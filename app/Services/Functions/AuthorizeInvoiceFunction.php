<?php

namespace App\Services\Functions;

use App\Models\Factura;
use App\Services\AfipService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Barryvdh\DomPDF\Facade\Pdf;

class AuthorizeInvoiceFunction
{
    public function execute(array $params): array
    {
        try {
            $facturaId = $params['factura_id'] ?? null;
            $enviarEmail = $params['enviar_email'] ?? true;

            if (!$facturaId) {
                return [
                    'success' => false,
                    'message' => 'factura_id es requerido',
                ];
            }

            $factura = Factura::with(['cliente', 'articulos'])->find($facturaId);
            if (!$factura) {
                return [
                    'success' => false,
                    'message' => "Factura con ID {$facturaId} no encontrada",
                ];
            }

            if ($factura->autorizada_afip) {
                return [
                    'success' => false,
                    'message' => "La factura ya está autorizada en AFIP (CAE: {$factura->cae})",
                ];
            }

            DB::beginTransaction();

            // Autorizar en AFIP
            $afipService = new AfipService();
            $resultado = $afipService->autorizarFactura($factura);

            if (!$resultado['success']) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'Error al autorizar en AFIP: ' . $resultado['message'],
                ];
            }

            // Actualizar factura con datos de AFIP
            $factura->update([
                'cae' => $resultado['cae'],
                'vencimiento_cae' => $resultado['vencimiento'],
                'autorizada_afip' => true,
            ]);

            DB::commit();

            $response = [
                'success' => true,
                'factura_id' => $factura->id,
                'numero' => $factura->numfactura,
                'cae' => $resultado['cae'],
                'vencimiento_cae' => $resultado['vencimiento'],
                'message' => "Factura #{$factura->numfactura} autorizada en AFIP. CAE: {$resultado['cae']}",
            ];

            // Enviar email si se solicita
            if ($enviarEmail && $factura->cliente->email) {
                try {
                    $pdf = Pdf::loadView('facturas.pdf', ['factura' => $factura]);
                    
                    Mail::send('emails.factura', ['factura' => $factura], function ($message) use ($factura, $pdf) {
                        $message->to($factura->cliente->email)
                            ->subject("Factura #{$factura->numfactura} - " . config('app.name'))
                            ->attachData($pdf->output(), "factura_{$factura->numfactura}.pdf");
                    });

                    $response['email_enviado'] = true;
                    $response['message'] .= " Email enviado a {$factura->cliente->email}";
                } catch (\Exception $e) {
                    $response['email_enviado'] = false;
                    $response['message'] .= " (Error al enviar email: {$e->getMessage()})";
                }
            }

            return $response;

        } catch (\Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'Error al autorizar factura: ' . $e->getMessage(),
            ];
        }
    }

    public static function definition(): array
    {
        return [
            'type' => 'function',
            'function' => [
                'name' => 'authorize_invoice',
                'description' => 'Autoriza una factura en AFIP y opcionalmente envía el PDF por email al cliente',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'factura_id' => [
                            'type' => 'integer',
                            'description' => 'ID de la factura a autorizar en AFIP',
                        ],
                        'enviar_email' => [
                            'type' => 'boolean',
                            'description' => 'Si se debe enviar el PDF por email al cliente (default: true)',
                        ],
                    ],
                    'required' => ['factura_id'],
                ],
            ],
        ];
    }
}
