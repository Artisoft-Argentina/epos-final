<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\InitialSetting;
use App\Services\Afip\AfipWebService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AfipController extends Controller
{
    public function index()
    {
        $empresa = InitialSetting::first();

        $certPath = config('afip.certificate_path');
        $keyPath = config('afip.key_path');

        return Inertia::render('settings/afip', [
            'config' => [
                'cuit' => $empresa?->cuit,
                'ambiente' => $empresa?->afip_ambiente ?? config('afip.environment', 'homologacion'),
                'punto_venta' => $empresa?->puntoventa ?? 1,
                'cert_exists' => file_exists($certPath),
                'key_exists' => file_exists($keyPath),
            ]
        ]);
    }

    public function healthCheck()
    {
        $results = [
            'api_publica' => $this->checkApiPublica(),
            'wsfe' => $this->checkWsfe(),
            'padron' => $this->checkPadron(),
            'certificados' => $this->checkCertificados(),
        ];

        return response()->json($results);
    }

    private function checkApiPublica(): array
    {
        try {
            // Usamos un CUIT conocido de AFIP para probar
            $url = "https://soa.afip.gob.ar/sr-padron/v2/persona/33693450239";

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            if ($error) {
                return [
                    'status' => 'error',
                    'message' => 'Error de conexión: ' . $error,
                ];
            }

            if ($httpCode === 200) {
                $data = json_decode($response, true);
                if (isset($data['datosGenerales'])) {
                    return [
                        'status' => 'ok',
                        'message' => 'API pública funcionando correctamente',
                    ];
                }
            }

            return [
                'status' => 'error',
                'message' => "API respondió con código HTTP {$httpCode}",
            ];

        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage(),
            ];
        }
    }

    private function checkWsfe(): array
    {
        try {
            $certPath = config('afip.certificate_path');
            $keyPath = config('afip.key_path');

            if (!file_exists($certPath) || !file_exists($keyPath)) {
                return [
                    'status' => 'warning',
                    'message' => 'Certificados no configurados',
                ];
            }

            $afipWS = new AfipWebService();

            // Intentar obtener el último comprobante para verificar conexión
            $empresa = InitialSetting::first();
            $ptoVta = $empresa?->puntoventa ?? 1;

            // Solo verificamos que podemos autenticarnos
            $reflection = new \ReflectionClass($afipWS);
            $method = $reflection->getMethod('getAuth');
            $method->setAccessible(true);
            $auth = $method->invoke($afipWS, 'wsfe');

            if (!empty($auth['token']) && !empty($auth['sign'])) {
                return [
                    'status' => 'ok',
                    'message' => 'Autenticación WSFE exitosa',
                ];
            }

            return [
                'status' => 'error',
                'message' => 'No se pudo obtener token de autenticación',
            ];

        } catch (\Exception $e) {
            $message = $e->getMessage();

            // Simplificar mensaje de error común
            if (str_contains($message, 'no le permite actuar')) {
                return [
                    'status' => 'error',
                    'message' => 'CUIT configurado no coincide con certificados',
                ];
            }

            return [
                'status' => 'error',
                'message' => $message,
            ];
        }
    }

    private function checkPadron(): array
    {
        try {
            $certPath = config('afip.certificate_path');
            $keyPath = config('afip.key_path');

            if (!file_exists($certPath) || !file_exists($keyPath)) {
                return [
                    'status' => 'warning',
                    'message' => 'Certificados no configurados',
                ];
            }

            $afipWS = new AfipWebService();

            // Intentar autenticarse para el servicio de padrón
            $reflection = new \ReflectionClass($afipWS);
            $method = $reflection->getMethod('getAuth');
            $method->setAccessible(true);
            $auth = $method->invoke($afipWS, 'ws_sr_padron_a5');

            if (!empty($auth['token']) && !empty($auth['sign'])) {
                return [
                    'status' => 'ok',
                    'message' => 'Autenticación Padrón exitosa',
                ];
            }

            return [
                'status' => 'error',
                'message' => 'No se pudo obtener token de autenticación',
            ];

        } catch (\Exception $e) {
            $message = $e->getMessage();

            if (str_contains($message, 'no le permite actuar')) {
                return [
                    'status' => 'error',
                    'message' => 'CUIT configurado no coincide con certificados',
                ];
            }

            return [
                'status' => 'error',
                'message' => $message,
            ];
        }
    }

    private function checkCertificados(): array
    {
        $certPath = config('afip.certificate_path');
        $keyPath = config('afip.key_path');

        $certExists = file_exists($certPath);
        $keyExists = file_exists($keyPath);

        if (!$certExists || !$keyExists) {
            return [
                'status' => 'error',
                'message' => 'Faltan archivos de certificado',
                'details' => [
                    'cert' => $certExists ? 'OK' : 'No encontrado',
                    'key' => $keyExists ? 'OK' : 'No encontrado',
                ]
            ];
        }

        // Verificar validez del certificado
        try {
            $certContent = file_get_contents($certPath);
            $certInfo = openssl_x509_parse($certContent);

            if (!$certInfo) {
                return [
                    'status' => 'error',
                    'message' => 'Certificado inválido o corrupto',
                ];
            }

            $validTo = $certInfo['validTo_time_t'];
            $daysLeft = floor(($validTo - time()) / 86400);

            if ($daysLeft < 0) {
                return [
                    'status' => 'error',
                    'message' => 'Certificado expirado hace ' . abs($daysLeft) . ' días',
                ];
            }

            if ($daysLeft < 30) {
                return [
                    'status' => 'warning',
                    'message' => "Certificado expira en {$daysLeft} días",
                    'details' => [
                        'subject' => $certInfo['subject']['CN'] ?? 'N/A',
                        'expires' => date('d/m/Y', $validTo),
                    ]
                ];
            }

            return [
                'status' => 'ok',
                'message' => 'Certificados válidos',
                'details' => [
                    'subject' => $certInfo['subject']['CN'] ?? 'N/A',
                    'expires' => date('d/m/Y', $validTo),
                    'days_left' => $daysLeft,
                ]
            ];

        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Error verificando certificado: ' . $e->getMessage(),
            ];
        }
    }

    public function upload(Request $request)
    {
        $request->validate([
            'cert_file' => 'required|file',
            'key_file' => 'required|file',
        ]);

        $certPath = storage_path('app/private/afip');

        if (!is_dir($certPath)) {
            mkdir($certPath, 0755, true);
        }

        $request->file('cert_file')->move($certPath, 'cert.pem');
        $request->file('key_file')->move($certPath, 'key.pem');

        // Limpiar tokens existentes
        $tokenFiles = glob($certPath . '/token_*.json');
        foreach ($tokenFiles as $file) {
            unlink($file);
        }

        return back()->with('success', 'Certificados subidos correctamente');
    }
}
