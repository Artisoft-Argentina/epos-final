<?php

namespace App\Services\Functions;

use App\Models\Sale;
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

            $sale = Sale::with(['customer', 'products'])->find($facturaId);
            if (!$sale) {
                return ['success' => false, 'message' => "Factura con ID {$facturaId} no encontrada"];
            }

            if ($sale->afip_authorized) {
                return ['success' => false, 'message' => "La factura ya está autorizada en AFIP (CAE: {$sale->cae})"];
            }

            DB::beginTransaction();

            $afipService = new AfipService();
            $resultado   = $afipService->autorizarFactura($sale);

            if (!$resultado['success']) {
                DB::rollBack();
                return ['success' => false, 'message' => 'Error al autorizar en AFIP: ' . $resultado['message']];
            }

            $sale->update([
                'cae'            => $resultado['cae'],
                'cae_expiration' => $resultado['vencimiento'],
                'afip_authorized'=> true,
            ]);

            DB::commit();

            $response = [
                'success'        => true,
                'factura_id'     => $sale->id,
                'numero'         => $sale->invoice_number,
                'cae'            => $resultado['cae'],
                'vencimiento_cae'=> $resultado['vencimiento'],
                'message'        => "Factura #{$sale->invoice_number} autorizada en AFIP. CAE: {$resultado['cae']}",
            ];

            if ($enviarEmail && $sale->customer->email) {
                try {
                    $pdf = Pdf::loadView('facturas.pdf', ['factura' => $sale]);
                    Mail::send('emails.factura', ['factura' => $sale], function ($message) use ($sale, $pdf) {
                        $message->to($sale->customer->email)
                            ->subject("Factura #{$sale->invoice_number} - " . config('app.name'))
                            ->attachData($pdf->output(), "factura_{$sale->invoice_number}.pdf");
                    });
                    $response['email_enviado'] = true;
                    $response['message'] .= " Email enviado a {$sale->customer->email}";
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
