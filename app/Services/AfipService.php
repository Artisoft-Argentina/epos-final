<?php

namespace App\Services;

use App\Models\Factura;
use App\Models\InitialSetting;
use Artisoft\AfipSdk\AfipSdk;
use Artisoft\AfipSdk\Exceptions\AfipException;
use Artisoft\AfipSdk\Exceptions\AuthenticationException;
use Artisoft\AfipSdk\Exceptions\CertificateException;
use Artisoft\AfipSdk\Exceptions\SoapFaultException;

class AfipService
{
    private AfipSdk $sdk;

    public function __construct()
    {
        $empresa = InitialSetting::first();

        $rawCuit = $empresa?->cuit ?: config('afip-sdk.cuit');
        $cuit = preg_replace('/\D/', '', (string) $rawCuit);

        $afipDir = $this->getAfipDir();
        $certPath = "{$afipDir}/cert.pem";
        $keyPath = "{$afipDir}/key.pem";

        $ambiente = $empresa?->afip_ambiente ?? config('afip-sdk.environment', 'homologacion');
        $production = $ambiente === 'production';

        $this->sdk = new AfipSdk(
            cuit: $cuit,
            certPath: $certPath,
            keyPath: $keyPath,
            production: $production,
            tokenDirectory: $afipDir,
        );
    }

    public function autorizarFactura(Factura $factura): array
    {
        try {
            $ivaDesglose = $this->calcularIvaDesdeArticulos($factura);
            $total = round(floatval($factura->total), 2);
            $neto = $ivaDesglose['neto'];
            $iva = $ivaDesglose['iva'];

            $ivaCondReceptor = 5;
            $cbteTipo = 6;

            if ($factura->cliente && $factura->cliente->condicioniva) {
                $condicion = strtolower($factura->cliente->condicioniva);
                if (str_contains($condicion, 'responsable inscripto')) {
                    $ivaCondReceptor = 1;
                    $cbteTipo = 1;
                } elseif (str_contains($condicion, 'monotributo')) {
                    $ivaCondReceptor = 6;
                    $cbteTipo = 1;
                } elseif (str_contains($condicion, 'exento')) {
                    $ivaCondReceptor = 4;
                    $cbteTipo = 6;
                } elseif (str_contains($condicion, 'consumidor')) {
                    $ivaCondReceptor = 5;
                    $cbteTipo = 6;
                }
            }

            $cuitCliente = $factura->cliente?->cuit ? preg_replace('/[^0-9]/', '', $factura->cliente->cuit) : '';
            $docTipo = 80;
            $docNro = 0;

            if (strlen($cuitCliente) === 11) {
                $docTipo = 80;
                $docNro = intval($cuitCliente);
            } elseif (strlen($cuitCliente) === 8) {
                $docTipo = 96;
                $docNro = intval($cuitCliente);
            } else {
                $docTipo = 99;
                $docNro = 0;
            }

            $empresa = InitialSetting::first();
            $ptoVta = $factura->ptoventa ?: ($empresa?->puntoventa ?: 1);

            $datos = [
                'PtoVta' => $ptoVta,
                'CbteTipo' => $cbteTipo,
                'Concepto' => 1,
                'DocTipo' => $docTipo,
                'DocNro' => $docNro,
                'CbteFch' => $factura->fecha ? $factura->fecha->format('Ymd') : date('Ymd'),
                'ImpTotal' => $total,
                'ImpTotConc' => 0,
                'ImpNeto' => $neto,
                'ImpOpEx' => 0,
                'ImpIVA' => $iva,
                'ImpTrib' => 0,
                'MonId' => 'PES',
                'MonCotiz' => 1,
                'CondicionIVAReceptor' => $ivaCondReceptor,
                'Iva' => $ivaDesglose['alicuotas'],
            ];

            $res = $this->sdk->authorizeInvoice($datos);

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
        } catch (AfipException $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function consultarDatosFiscales($cuit): array
    {
        try {
            $cuitLimpio = preg_replace('/[^0-9]/', '', $cuit);

            if (strlen($cuitLimpio) !== 11 && strlen($cuitLimpio) !== 8) {
                return ['success' => false, 'error' => 'Debe ingresar un CUIT (11 dígitos) o DNI (8 dígitos)'];
            }

            \Log::info('AFIP: Iniciando consulta de padrón', ['cuit' => $cuitLimpio]);

            try {
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
                    'response_length' => strlen($response),
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
                            ],
                        ];
                    }
                }

                \Log::warning('AFIP: API pública no devolvió datos válidos, intentando WebService autenticado');

                $persona = $this->sdk->getPersona($cuitLimpio);

                \Log::info('AFIP: Consulta exitosa con SDK Padrón', ['datos' => $persona->toArray()]);

                return [
                    'success' => true,
                    'data' => $persona->toArray(),
                ];
            } catch (AfipException $e) {
                \Log::error('AFIP: Error en consulta', ['error' => $e->getMessage()]);
                return ['success' => false, 'error' => 'No se pudieron obtener los datos de AFIP: ' . $e->getMessage()];
            }
        } catch (\Exception $e) {
            \Log::error('AFIP: Error general', ['error' => $e->getMessage()]);
            return ['success' => false, 'error' => 'Error al consultar AFIP: ' . $e->getMessage()];
        }
    }

    public function getSdk(): AfipSdk
    {
        return $this->sdk;
    }

    private function calcularIvaDesdeArticulos(Factura $factura): array
    {
        $alicuotasAgrupadas = [];
        $totalNeto = 0;
        $totalIva = 0;

        $mapeoAlicuotas = [
            '0' => 3,
            '10.5' => 4,
            '21' => 5,
            '27' => 6,
            '5' => 8,
            '2.5' => 9,
        ];

        foreach ($factura->articulos as $articulo) {
            $subtotal = floatval($articulo->pivot->subtotal ?? 0);
            $alicuota = floatval($articulo->pivot->alicuota ?? 21);

            $factor = 1 + ($alicuota / 100);
            $netoArticulo = round($subtotal / $factor, 2);
            $ivaArticulo = round($subtotal - $netoArticulo, 2);

            $totalNeto += $netoArticulo;
            $totalIva += $ivaArticulo;

            $idAlicuota = $mapeoAlicuotas[(string)$alicuota] ?? 5;
            if (!isset($alicuotasAgrupadas[$idAlicuota])) {
                $alicuotasAgrupadas[$idAlicuota] = ['BaseImp' => 0, 'Importe' => 0];
            }
            $alicuotasAgrupadas[$idAlicuota]['BaseImp'] += $netoArticulo;
            $alicuotasAgrupadas[$idAlicuota]['Importe'] += $ivaArticulo;
        }

        if (empty($alicuotasAgrupadas)) {
            $total = floatval($factura->total);
            $neto = round($total / 1.21, 2);
            $iva = round($total - $neto, 2);
            $alicuotasAgrupadas[5] = ['BaseImp' => $neto, 'Importe' => $iva];
            $totalNeto = $neto;
            $totalIva = $iva;
        }

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

    private function determinarCondicionIvaPublica($data): string
    {
        if (isset($data['datosMonotributo']['actividadMonotributista'])) {
            foreach ($data['datosMonotributo']['actividadMonotributista'] as $actividad) {
                if (isset($actividad['estado']) && $actividad['estado'] === 'ACTIVO') {
                    return 'Monotributo';
                }
            }
        }

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

    private function getAfipDir(): string
    {
        $tenantId = tenancy()->tenant?->id ?? 'default';
        return storage_path("app/private/tenants/{$tenantId}/afip");
    }
}