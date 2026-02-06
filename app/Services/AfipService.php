<?php

namespace App\Services;

use App\Models\Factura;
use App\Services\Afip\AfipWebService;

require_once base_path('vendor/afipsdk/afip.php/src/Afip.php');

class AfipService
{
    private $afip;

    public function __construct()
    {
        try {
            $certPath = storage_path('app/private/afip/cert.pem');
            $keyPath = storage_path('app/private/afip/key.pem');
            
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

    public function autorizarFactura(Factura $factura)
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

            if ($factura->cliente && $factura->cliente->condicioniva) {
                $condicion = strtolower($factura->cliente->condicioniva);
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
            $cuitCliente = $factura->cliente?->cuit ? preg_replace('/[^0-9]/', '', $factura->cliente->cuit) : '';
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
            $empresa = \App\Models\InitialSetting::first();
            $ptoVta = $factura->ptoventa ?: ($empresa?->puntoventa ?: 1);

            $datos = [
                'PtoVta' => $ptoVta,
                'CbteTipo' => $cbteTipo,
                'Concepto' => 1, // 1=Productos, 2=Servicios, 3=Productos y Servicios
                'DocTipo' => $docTipo,
                'DocNro' => $docNro,
                'CbteFch' => $factura->fecha ? $factura->fecha->format('Ymd') : date('Ymd'),
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
                    'numfactura' => $res['numero'],
                    'cae' => $res['cae'],
                    'vencimiento_cae' => $res['vencimiento_cae'],
                    'autorizada_afip' => true,
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

    private function calcularIvaDesdeArticulos(Factura $factura): array
    {
        $alicuotasAgrupadas = [];
        $totalNeto = 0;
        $totalIva = 0;

        // Mapeo de alícuotas AFIP
        // 3 = 0%, 4 = 10.5%, 5 = 21%, 6 = 27%, 8 = 5%, 9 = 2.5%
        $mapeoAlicuotas = [
            '0' => 3,      // 0%
            '10.5' => 4,   // 10.5%
            '21' => 5,     // 21%
            '27' => 6,     // 27%
            '5' => 8,      // 5%
            '2.5' => 9,    // 2.5%
        ];

        foreach ($factura->articulos as $articulo) {
            $subtotal = floatval($articulo->pivot->subtotal ?? 0);
            $alicuota = floatval($articulo->pivot->alicuota ?? 21);

            // Calcular neto e IVA del artículo
            $factor = 1 + ($alicuota / 100);
            $netoArticulo = round($subtotal / $factor, 2);
            $ivaArticulo = round($subtotal - $netoArticulo, 2);

            $totalNeto += $netoArticulo;
            $totalIva += $ivaArticulo;

            // Agrupar por alícuota
            $idAlicuota = $mapeoAlicuotas[(string)$alicuota] ?? 5; // Default 21%
            if (!isset($alicuotasAgrupadas[$idAlicuota])) {
                $alicuotasAgrupadas[$idAlicuota] = ['BaseImp' => 0, 'Importe' => 0];
            }
            $alicuotasAgrupadas[$idAlicuota]['BaseImp'] += $netoArticulo;
            $alicuotasAgrupadas[$idAlicuota]['Importe'] += $ivaArticulo;
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
            
            // Intentar con nuevo servicio AFIP
            try {
                $afipWS = new AfipWebService();
                $datos = $afipWS->consultarPadron($cuitLimpio);
                
                return [
                    'success' => true,
                    'data' => $datos
                ];
            } catch (\Exception $e) {
                
                // Fallback a API pública
                $url = "https://soa.afip.gob.ar/sr-padron/v2/persona/{$cuitLimpio}";
                
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
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
            }
            
            // Fallback final
            return [
                'success' => true,
                'data' => [
                    'razonsocial' => 'Cliente - ' . $cuit,
                    'direccion' => 'Dirección no disponible',
                    'localidad' => 'Localidad',
                    'provincia' => 'Provincia',
                    'provincia_id_afip' => 1,
                    'codigopostal' => '',
                    'condicioniva' => 'Consumidor Final',
                ]
            ];
            
        } catch (\Exception $e) {
            
            return [
                'success' => true,
                'data' => [
                    'razonsocial' => 'Cliente - ' . $cuit,
                    'direccion' => 'Dirección no disponible',
                    'localidad' => 'Localidad',
                    'provincia' => 'Provincia',
                    'provincia_id_afip' => 1,
                    'codigopostal' => '',
                    'condicioniva' => 'Consumidor Final',
                ]
            ];
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
