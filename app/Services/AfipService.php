<?php

namespace App\Services;

use App\Models\Sale;
use App\Services\Afip\AfipWebService;

require_once base_path('vendor/afipsdk/afip.php/src/Afip.php');

class AfipService
{
    private $afip;

    public function __construct()
    {
        try {
            $certPath = config('afip.certificate_path');
            $keyPath = config('afip.key_path');
            
            if (!file_exists($certPath) || !file_exists($keyPath)) {
                \Log::warning('AFIP: Certificados no encontrados, usando modo desarrollo');
                $this->afip = null;
                return;
            }
            
            $this->afip = new \Afip([
                'CUIT' => config('afip.cuit'),
                'production' => config('afip.environment') === 'production',
                'cert' => file_get_contents($certPath),
                'key' => file_get_contents($keyPath),
            ]);
        } catch (\Exception $e) {
            \Log::error('AFIP: Error inicializando servicio: ' . $e->getMessage());
            $this->afip = null;
        }
    }

    public function autorizarFactura(Sale $factura)
    {
        try {

            $afipWS = new AfipWebService();

            // Calcular IVA desde los artículos de la factura
            $ivaDesglose = $this->calcularIvaDesdeArticulos($factura);
            $total = round(floatval($factura->total), 2);
            $neto = $ivaDesglose['neto'];
            $iva = $ivaDesglose['iva'];

            // Determinar condición IVA del receptor y tipo de comprobante
            // Las reglas de negocio según condición IVA tienen prioridad sobre codcomprobante guardado
            $ivaCondReceptor = 5; // Consumidor Final por defecto
            $cbteTipo = 6; // Factura B por defecto

            if ($factura->customer && $factura->customer->tax_status) {
                $condicion = strtolower($factura->customer->tax_status);
                if (str_contains($condicion, 'responsable inscripto')) {
                    $ivaCondReceptor = 1;
                    $cbteTipo = 1; // Factura A para Resp. Inscripto
                } elseif (str_contains($condicion, 'monotributo')) {
                    $ivaCondReceptor = 6;
                    $cbteTipo = 1; // Factura A para Monotributista
                } elseif (str_contains($condicion, 'exento')) {
                    $ivaCondReceptor = 4;
                    $cbteTipo = 6; // Factura B para Exento
                } elseif (str_contains($condicion, 'consumidor')) {
                    $ivaCondReceptor = 5;
                    $cbteTipo = 6; // Factura B para Consumidor Final
                }
            }

            // Determinar tipo de documento
            $cuitCliente = $factura->customer?->cuit ? preg_replace('/[^0-9]/', '', $factura->customer->cuit) : '';
            $docTipo = 80; // CUIT por defecto
            $docNro = 0;

            if (strlen($cuitCliente) === 11) {
                $docTipo = 80; // CUIT
                $docNro = intval($cuitCliente);
            } elseif (strlen($cuitCliente) === 8) {
                $docTipo = 96; // DNI
                $docNro = intval($cuitCliente);
            } else {
                $docTipo = 99; // Sin identificación
                $docNro = 0;
            }

            // Punto de venta desde factura, InitialSetting o default
            $empresa = \App\Models\Setting::first();
            $ptoVta = $factura->pos_number ?: ($empresa?->pos_number ?: 1);

            $datos = [
                'PtoVta' => $ptoVta,
                'CbteTipo' => $cbteTipo,
                'Concepto' => 1, // 1=Productos, 2=Servicios, 3=Productos y Servicios
                'DocTipo' => $docTipo,
                'DocNro' => $docNro,
                'CbteFch' => $factura->date ? $factura->date->format('Ymd') : date('Ymd'),
                'ImpTotal' => $total,
                'ImpTotConc' => 0, // No gravado
                'ImpNeto' => $neto,
                'ImpOpEx' => 0, // Exento
                'ImpIVA' => $iva,
                'ImpTrib' => 0, // Tributos
                'MonId' => 'PES',
                'MonCotiz' => 1,
                'CondicionIVAReceptor' => $ivaCondReceptor,
                'Iva' => $ivaDesglose['alicuotas'],
            ];

            $res = $afipWS->autorizarFactura($datos);

            if ($res['success']) {
                $factura->update([
                    'invoice_number'  => $res['numero'],
                    'cae'             => $res['cae'],
                    'cae_expiration'  => $res['vencimiento_cae'],
                    'afip_authorized' => true,
                ]);

                return [
                    'success' => true,
                    'cae' => $res['cae'],
                    'vencimiento_cae' => $res['vencimiento_cae'],
                    'message' => 'Factura autorizada correctamente',
                ];
            }

            return ['success' => false, 'error' => 'Error en autorización AFIP'];

        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function calcularIvaDesdeArticulos(Sale $factura): array
    {
        $alicuotasAgrupadas = [];
        $totalNeto = 0;
        $totalIva  = 0;

        $mapeoAlicuotas = [
            '0' => 3, '10.5' => 4, '21' => 5, '27' => 6, '5' => 8, '2.5' => 9,
        ];

        foreach ($factura->products as $product) {
            $subtotal  = floatval($product->pivot->subtotal ?? 0);
            $alicuota  = floatval($product->pivot->tax_rate ?? 21);
            $factor    = 1 + ($alicuota / 100);
            $neto      = round($subtotal / $factor, 2);
            $iva       = round($subtotal - $neto, 2);

            $totalNeto += $neto;
            $totalIva  += $iva;

            $idAlicuota = $mapeoAlicuotas[(string) $alicuota] ?? 5;
            if (! isset($alicuotasAgrupadas[$idAlicuota])) {
                $alicuotasAgrupadas[$idAlicuota] = ['BaseImp' => 0, 'Importe' => 0];
            }
            $alicuotasAgrupadas[$idAlicuota]['BaseImp'] += $neto;
            $alicuotasAgrupadas[$idAlicuota]['Importe'] += $iva;
        }

        // Si no hay artículos, calcular desde el total
        if (empty($alicuotasAgrupadas)) {
            $total = floatval($factura->total);
            $neto = round($total / 1.21, 2);
            $iva = round($total - $neto, 2);
            $alicuotasAgrupadas[5] = ['BaseImp' => $neto, 'Importe' => $iva];
            $totalNeto = $neto;
            $totalIva = $iva;
        }

        // Formatear para AFIP
        $alicuotasAfip = [];
        foreach ($alicuotasAgrupadas as $id => $valores) {
            $alicuotasAfip[] = [
                'Id' => $id,
                'BaseImp' => round($valores['BaseImp'], 2),
                'Importe' => round($valores['Importe'], 2),
            ];
        }

        return [
            'neto' => round($totalNeto, 2),
            'iva' => round($totalIva, 2),
            'alicuotas' => $alicuotasAfip,
        ];
    }

    public function consultarDatosFiscales($cuit)
    {
        try {
            $cuitLimpio = preg_replace('/[^0-9]/', '', $cuit);
            
            if (strlen($cuitLimpio) !== 11 && strlen($cuitLimpio) !== 8) {
                return ['success' => false, 'error' => 'Debe ingresar un CUIT (11 dígitos) o DNI (8 dígitos)'];
            }
            
            \Log::info('AFIP: Iniciando consulta de padrón', ['cuit' => $cuitLimpio]);
            
            // Intentar primero con API pública (más confiable y sin autenticación)
            try {
                // API pública
                $url = "https://soa.afip.gob.ar/sr-padron/v2/persona/{$cuitLimpio}";
                
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $curlError = curl_error($ch);
                curl_close($ch);
                
                \Log::info('AFIP: Respuesta API pública', [
                    'http_code' => $httpCode,
                    'curl_error' => $curlError,
                    'response_length' => strlen($response)
                ]);
                
                if ($httpCode === 200 && $response) {
                    $data = json_decode($response, true);
                    
                    if (isset($data['datosGenerales'])) {
                        $datosGenerales = $data['datosGenerales'];
                        $domicilio = $datosGenerales['domicilioFiscal'] ?? [];
                        
                        $razonSocial = '';
                        if (!empty($datosGenerales['razonSocial'])) {
                            $razonSocial = $datosGenerales['razonSocial'];
                        } elseif (!empty($datosGenerales['nombre']) && !empty($datosGenerales['apellido'])) {
                            $razonSocial = trim($datosGenerales['apellido'] . ', ' . $datosGenerales['nombre']);
                        }
                        
                        \Log::info('AFIP: Datos obtenidos de API pública', ['razon_social' => $razonSocial]);
                        
                        return [
                            'success' => true,
                            'data' => [
                                'razonsocial' => $razonSocial,
                                'direccion' => $domicilio['direccion'] ?? '',
                                'localidad' => $domicilio['localidad'] ?? '',
                                'provincia' => $domicilio['descripcionProvincia'] ?? '',
                                'provincia_id_afip' => $domicilio['idProvincia'] ?? null,
                                'codigopostal' => $domicilio['codPostal'] ?? '',
                                'condicioniva' => $this->determinarCondicionIvaPublica($data),
                            ]
                        ];
                    }
                }
                
                \Log::warning('AFIP: API pública no devolvió datos válidos, intentando WebService autenticado');
                
                // Fallback a WebService autenticado
                $afipWS = new AfipWebService();
                $datos = $afipWS->consultarPadron($cuitLimpio);
                
                \Log::info('AFIP: Consulta exitosa con AfipWebService', ['datos' => $datos]);
                
                return [
                    'success' => true,
                    'data' => $datos
                ];
                
            } catch (\Exception $e) {
                \Log::error('AFIP: Error en consulta', ['error' => $e->getMessage()]);
                return ['success' => false, 'error' => 'No se pudieron obtener los datos de AFIP: ' . $e->getMessage()];
            }
            
        } catch (\Exception $e) {
            \Log::error('AFIP: Error general', ['error' => $e->getMessage()]);
            return ['success' => false, 'error' => 'Error al consultar AFIP: ' . $e->getMessage()];
        }
    }

    private function determinarCondicionIvaPublica($data)
    {
        // Verificar monotributo
        if (isset($data['datosMonotributo']['actividadMonotributista'])) {
            foreach ($data['datosMonotributo']['actividadMonotributista'] as $actividad) {
                if (isset($actividad['estado']) && $actividad['estado'] === 'ACTIVO') {
                    return 'Monotributo';
                }
            }
        }
        
        // Verificar régimen general
        if (isset($data['datosRegimenGeneral']['impuesto'])) {
            foreach ($data['datosRegimenGeneral']['impuesto'] as $impuesto) {
                if ($impuesto['idImpuesto'] == 30 && $impuesto['estado'] === 'ACTIVO') {
                    return 'Responsable Inscripto';
                }
                if ($impuesto['idImpuesto'] == 32 && $impuesto['estado'] === 'ACTIVO') {
                    return 'Exento';
                }
            }
        }
        
        return 'Consumidor Final';
    }

    private function determinarCondicionIva($personaArray)
    {
        // Verificar si tiene monotributo activo
        if (isset($personaArray['datosMonotributo']['impuesto'])) {
            foreach ($personaArray['datosMonotributo']['impuesto'] as $impuesto) {
                if ($impuesto['idImpuesto'] == 20 && $impuesto['estadoImpuesto'] == 'AC') {
                    return 'Monotributo';
                }
            }
        }
        
        // Verificar régimen general
        if (isset($personaArray['datosRegimenGeneral']['impuesto'])) {
            foreach ($personaArray['datosRegimenGeneral']['impuesto'] as $impuesto) {
                if ($impuesto['idImpuesto'] == 30 && $impuesto['estadoImpuesto'] == 'AC') {
                    return 'Responsable Inscripto';
                }
                if ($impuesto['idImpuesto'] == 32 && $impuesto['estadoImpuesto'] == 'AC') {
                    return 'Exento';
                }
            }
        }
        
        // Si hay errores, determinar por defecto
        if (isset($personaArray['errorMonotributo']) && !isset($personaArray['errorRegimenGeneral'])) {
            return 'Responsable Inscripto';
        }
        
        return 'Monotributo';
    }
}
