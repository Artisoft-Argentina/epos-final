<?php

namespace App\Services\Afip;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Servicio AFIP WebService
 * Implementación completa basada en documentación oficial
 */
class AfipWebService
{
    private string $cuit;

    private string $certPath;

    private string $keyPath;

    private bool $production;

    private const WSAA_URL_TEST = 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms';

    private const WSAA_URL_PROD = 'https://wsaa.afip.gov.ar/ws/services/LoginCms';

    private const WSFE_URL_TEST = 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx';

    private const WSFE_URL_PROD = 'https://servicios1.afip.gov.ar/wsfev1/service.asmx';

    private const WSR5_URL_TEST = 'https://awshomo.afip.gov.ar/sr-padron/webservices/personaServiceA5';

    private const WSR5_URL_PROD = 'https://aws.afip.gov.ar/sr-padron/webservices/personaServiceA5';

    public function __construct()
    {
        // Intentar obtener configuración desde InitialSetting (BD) o config
        $empresa = \App\Models\InitialSetting::first();

        // CUIT: sanitizar eliminando caracteres no numéricos
        $rawCuit = $empresa?->cuit ?: config('afip.cuit');
        $this->cuit = preg_replace('/\D/', '', (string) $rawCuit);

        // Certificados per-tenant
        $afipDir = $this->getAfipDir();
        $this->certPath = "{$afipDir}/cert.pem";
        $this->keyPath  = "{$afipDir}/key.pem";

        // Ambiente: desde BD si existe, sino desde config
        $ambiente = $empresa?->afip_ambiente ?? config('afip.environment', 'homologacion');
        $this->production = $ambiente === 'production';

        // Invalidar token si cambió el CUIT o ambiente
        $this->validateTokenCuit();
    }

    private function getAfipDir(): string
    {
        $tenantId = tenancy()->tenant?->id ?? 'default';
        return storage_path("app/private/tenants/{$tenantId}/afip");
    }

    private function validateTokenCuit(): void
    {
        $tokenFile = $this->getAfipDir() . '/token_wsfe.json';

        if (file_exists($tokenFile)) {
            $tokenData = json_decode(file_get_contents($tokenFile), true);
            $savedCuit = $tokenData['cuit'] ?? null;
            $savedAmbiente = $tokenData['ambiente'] ?? null;
            $currentAmbiente = $this->production ? 'production' : 'homologacion';

            // Si cambió el CUIT o ambiente, invalidar token
            if ($savedCuit !== $this->cuit || $savedAmbiente !== $currentAmbiente) {
                Log::info('AFIP: Invalidando token por cambio de CUIT/ambiente', [
                    'saved_cuit' => $savedCuit,
                    'current_cuit' => $this->cuit,
                    'saved_ambiente' => $savedAmbiente,
                    'current_ambiente' => $currentAmbiente,
                ]);
                unlink($tokenFile);
                Cache::forget('afip_auth_wsfe');
            }
        }
    }

    private function getAuth(string $service): array
    {
        $tenantId  = tenancy()->tenant?->id ?? 'default';
        $cacheKey  = "afip_auth_{$tenantId}_{$service}";
        $tokenFile = $this->getAfipDir() . "/token_{$service}.json";

        // Intentar obtener del caché de Laravel
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        // Intentar obtener del archivo (backup persistente)
        if (file_exists($tokenFile)) {
            $tokenData = json_decode(file_get_contents($tokenFile), true);
            if ($tokenData && isset($tokenData['expires_at']) && $tokenData['expires_at'] > time()) {
                Cache::put($cacheKey, $tokenData['auth'], now()->addHours(11));
                return $tokenData['auth'];
            }
        }

        // Solicitar nuevo token
        $tra = $this->createTRA($service);
        $cms = $this->signTRA($tra);
        $response = $this->callWSAA($cms);
        $auth = $this->parseWSAAResponse($response);

        // Guardar en caché y archivo (incluir CUIT y ambiente para validación)
        Cache::put($cacheKey, $auth, now()->addHours(11));
        $dir = dirname($tokenFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents($tokenFile, json_encode([
            'auth' => $auth,
            'cuit' => $this->cuit,
            'ambiente' => $this->production ? 'production' : 'homologacion',
            'expires_at' => time() + (11 * 3600), // 11 horas
            'created_at' => date('Y-m-d H:i:s'),
        ]));

        return $auth;
    }

    private function createTRA(string $service): string
    {
        $uniqueId = time();
        $generationTime = date('c', $uniqueId - 60);
        $expirationTime = date('c', $uniqueId + 60);

        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
    <header>
        <uniqueId>{$uniqueId}</uniqueId>
        <generationTime>{$generationTime}</generationTime>
        <expirationTime>{$expirationTime}</expirationTime>
    </header>
    <service>{$service}</service>
</loginTicketRequest>
XML;
    }

    private function signTRA(string $tra): string
    {
        if (! file_exists($this->certPath) || ! file_exists($this->keyPath)) {
            Log::error('AFIP: Certificados no encontrados', [
                'cert' => $this->certPath,
                'key' => $this->keyPath,
                'cert_exists' => file_exists($this->certPath),
                'key_exists' => file_exists($this->keyPath)
            ]);
            throw new \Exception('Certificados AFIP no encontrados');
        }

        $traFile = sys_get_temp_dir().'/tra_'.time().'.xml';
        $cmsFile = sys_get_temp_dir().'/tra_'.time().'.cms';

        file_put_contents($traFile, $tra);

        $command = sprintf(
            'openssl smime -sign -in %s -out %s -signer %s -inkey %s -nodetach -outform DER 2>&1',
            escapeshellarg($traFile),
            escapeshellarg($cmsFile),
            escapeshellarg($this->certPath),
            escapeshellarg($this->keyPath)
        );

        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            Log::error('AFIP: Error al firmar TRA', [
                'command' => $command,
                'output' => implode("\n", $output),
                'return_code' => $returnCode
            ]);
            throw new \Exception('Error al firmar TRA: ' . implode(', ', $output));
        }

        $cms = base64_encode(file_get_contents($cmsFile));

        unlink($traFile);
        unlink($cmsFile);

        return $cms;
    }

    private function callWSAA(string $cms): string
    {
        $url = $this->production ? self::WSAA_URL_PROD : self::WSAA_URL_TEST;

        $soap = <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">
    <soapenv:Header/>
    <soapenv:Body>
        <wsaa:loginCms>
            <wsaa:in0>{$cms}</wsaa:in0>
        </wsaa:loginCms>
    </soapenv:Body>
</soapenv:Envelope>
XML;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $soap);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: text/xml; charset=utf-8',
            'SOAPAction: ""',
        ]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        return curl_exec($ch);
    }

    private function parseWSAAResponse(string $response): array
    {
        $xml = simplexml_load_string($response);

        if ($xml === false) {
            throw new \Exception('Error parseando respuesta WSAA');
        }

        // Verificar si es un SOAP Fault
        $xml->registerXPathNamespace('soapenv', 'http://schemas.xmlsoap.org/soap/envelope/');
        $faults = $xml->xpath('//soapenv:Fault/faultstring');
        if (!empty($faults)) {
            $faultMsg = (string) $faults[0];
            
            // Si el error es que ya existe un token válido, informar al usuario
            if (str_contains($faultMsg, 'El CEE ya posee un TA valido')) {
                throw new \Exception('AFIP ya tiene un token activo. Espere unos minutos o ejecute: php artisan afip:clear-tokens');
            }
            
            throw new \Exception('WSAA Fault: ' . $faultMsg);
        }

        $xml->registerXPathNamespace('ns', 'http://wsaa.view.sua.dvadac.desein.afip.gov');
        $loginCmsReturn = $xml->xpath('//ns:loginCmsReturn');

        if (empty($loginCmsReturn)) {
            Log::error('WSAA: No se encontró loginCmsReturn', ['response' => $response]);
            throw new \Exception('No se encontró loginCmsReturn en respuesta WSAA');
        }

        $credentials = simplexml_load_string((string) $loginCmsReturn[0]);

        return [
            'token' => (string) $credentials->credentials->token,
            'sign' => (string) $credentials->credentials->sign,
        ];
    }

    public function consultarPadron(string $cuit): array
    {
        try {
            $auth = $this->getAuth('ws_sr_padron_a5');
            $url = $this->production ? self::WSR5_URL_PROD : self::WSR5_URL_TEST;

            $soap = <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:a5="http://a5.soap.ws.server.puc.sr/">
    <soapenv:Header/>
    <soapenv:Body>
        <a5:getPersona>
            <token>{$auth['token']}</token>
            <sign>{$auth['sign']}</sign>
            <cuitRepresentada>{$this->cuit}</cuitRepresentada>
            <idPersona>{$cuit}</idPersona>
        </a5:getPersona>
    </soapenv:Body>
</soapenv:Envelope>
XML;

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $soap);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: text/xml; charset=utf-8',
                'SOAPAction: ""',
            ]);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

            $response = curl_exec($ch);
            curl_close($ch);

            return $this->parsePadronResponse($response);
        } catch (\Exception $e) {
            throw $e;
        }
    }

    private function parsePadronResponse(string $response): array
    {
        $dom = new \DOMDocument;
        libxml_use_internal_errors(true);

        if (! $dom->loadXML($response)) {
            throw new \Exception('No se pudo parsear XML');
        }

        libxml_clear_errors();

        // Verificar SOAP Fault
        $faults = $dom->getElementsByTagName('Fault');
        if ($faults->length > 0) {
            $faultString = $faults->item(0)->getElementsByTagName('faultstring')->item(0)->nodeValue;
            throw new \Exception('SOAP Fault: '.$faultString);
        }

        // Buscar personaReturn (sin namespace)
        $personaReturn = $dom->getElementsByTagName('personaReturn');

        if ($personaReturn->length === 0) {
            throw new \Exception('No se encontró personaReturn');
        }

        $persona = $personaReturn->item(0);

        // Buscar errorConstancia
        $errorConstancia = $persona->getElementsByTagName('errorConstancia');
        if ($errorConstancia->length > 0) {
            $error = $errorConstancia->item(0);
            $apellido = $error->getElementsByTagName('apellido')->item(0)->nodeValue ?? '';
            $nombre = $error->getElementsByTagName('nombre')->item(0)->nodeValue ?? '';

            return [
                'razonsocial' => trim($apellido.', '.$nombre),
                'direccion' => '',
                'localidad' => '',
                'provincia' => '',
                'provincia_id_afip' => 0,
                'codigopostal' => '',
                'condicioniva' => 'Consumidor Final',
            ];
        }

        // Buscar datosGenerales
        $datosGenerales = $persona->getElementsByTagName('datosGenerales');
        if ($datosGenerales->length === 0) {
            throw new \Exception('No se encontraron datosGenerales');
        }

        $dg = $datosGenerales->item(0);

        $razonSocial = $dg->getElementsByTagName('razonSocial')->item(0)->nodeValue ?? '';
        if (empty($razonSocial)) {
            $apellido = $dg->getElementsByTagName('apellido')->item(0)->nodeValue ?? '';
            $nombre = $dg->getElementsByTagName('nombre')->item(0)->nodeValue ?? '';
            $razonSocial = trim($apellido.', '.$nombre);
        }

        $domicilio = $dg->getElementsByTagName('domicilioFiscal')->item(0);
        $direccion = $domicilio->getElementsByTagName('direccion')->item(0)->nodeValue ?? '';
        $localidad = $domicilio->getElementsByTagName('localidad')->item(0)->nodeValue ?? '';
        $provincia = $domicilio->getElementsByTagName('descripcionProvincia')->item(0)->nodeValue ?? '';
        $idProvincia = $domicilio->getElementsByTagName('idProvincia')->item(0)->nodeValue ?? 0;
        $codPostal = $domicilio->getElementsByTagName('codPostal')->item(0)->nodeValue ?? '';

        $condicionIva = $this->determinarCondicionIvaDOM($persona);

        return [
            'razonsocial' => $razonSocial,
            'direccion' => $direccion,
            'localidad' => $localidad,
            'provincia' => $provincia,
            'provincia_id_afip' => (int) $idProvincia,
            'codigopostal' => $codPostal,
            'condicioniva' => $condicionIva,
        ];
    }

    private function determinarCondicionIvaDOM($persona): string
    {
        try {
            if ($persona->getElementsByTagName('datosMonotributo')->length > 0) {
                return 'Monotributo';
            }

            $datosRG = $persona->getElementsByTagName('datosRegimenGeneral');
            if ($datosRG->length > 0) {
                $impuestos = $datosRG->item(0)->getElementsByTagName('impuesto');
                foreach ($impuestos as $impuesto) {
                    $idImpuesto = $impuesto->getElementsByTagName('idImpuesto')->item(0)->nodeValue ?? '';
                    if ($idImpuesto == '30') {
                        return 'Responsable Inscripto';
                    }
                    if ($idImpuesto == '32') {
                        return 'Exento';
                    }
                }
            }

            return 'Consumidor Final';
        } catch (\Exception $e) {
            return 'Consumidor Final';
        }
    }

    private function determinarCondicionIva($persona): string
    {
        try {
            if (isset($persona->datosMonotributo)) {
                return 'Monotributo';
            }

            if (isset($persona->datosRegimenGeneral->impuesto)) {
                foreach ($persona->datosRegimenGeneral->impuesto as $impuesto) {
                    if ((int) $impuesto->idImpuesto === 30) {
                        return 'Responsable Inscripto';
                    }
                    if ((int) $impuesto->idImpuesto === 32) {
                        return 'Exento';
                    }
                }
            }

            return 'Consumidor Final';
        } catch (\Exception $e) {
            Log::warning('AfipWebService: Error determinando condición IVA', ['error' => $e->getMessage()]);

            return 'Consumidor Final';
        }
    }

    public function autorizarFactura(array $datos): array
    {
        $auth = $this->getAuth('wsfe');
        $url = $this->production ? self::WSFE_URL_PROD : self::WSFE_URL_TEST;

        $ultimoComprobante = $this->getUltimoComprobante($auth, $datos['PtoVta'], $datos['CbteTipo']);
        $datos['CbteDesde'] = $ultimoComprobante + 1;
        $datos['CbteHasta'] = $ultimoComprobante + 1;
        
        $soap = $this->buildFacturaSoap($auth, $datos);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $soap);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: text/xml; charset=utf-8',
            'SOAPAction: "http://ar.gov.afip.dif.FEV1/FECAESolicitar"',
        ]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);

        return $this->parseFacturaResponse($response);
    }

    private function getUltimoComprobante(array $auth, int $ptoVta, int $cbteTipo): int
    {
        $url = $this->production ? self::WSFE_URL_PROD : self::WSFE_URL_TEST;

        $soap = <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
    <soapenv:Header/>
    <soapenv:Body>
        <ar:FECompUltimoAutorizado>
            <ar:Auth>
                <ar:Token>{$auth['token']}</ar:Token>
                <ar:Sign>{$auth['sign']}</ar:Sign>
                <ar:Cuit>{$this->cuit}</ar:Cuit>
            </ar:Auth>
            <ar:PtoVta>{$ptoVta}</ar:PtoVta>
            <ar:CbteTipo>{$cbteTipo}</ar:CbteTipo>
        </ar:FECompUltimoAutorizado>
    </soapenv:Body>
</soapenv:Envelope>
XML;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $soap);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: text/xml; charset=utf-8',
            'SOAPAction: "http://ar.gov.afip.dif.FEV1/FECompUltimoAutorizado"',
        ]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);

        // Usar DOMDocument para mejor manejo de namespaces
        $dom = new \DOMDocument;
        libxml_use_internal_errors(true);

        if (!$dom->loadXML($response)) {
            throw new \Exception('Error parseando respuesta de FECompUltimoAutorizado');
        }

        libxml_clear_errors();

        // Verificar errores
        $errores = $dom->getElementsByTagName('Err');
        if ($errores->length > 0) {
            $code = $dom->getElementsByTagName('Code')->item(0)->nodeValue ?? '';
            $msg = $dom->getElementsByTagName('Msg')->item(0)->nodeValue ?? '';
            throw new \Exception("Error AFIP [$code]: $msg");
        }

        $cbteNro = $dom->getElementsByTagName('CbteNro');
        if ($cbteNro->length === 0) {
            throw new \Exception('No se encontró CbteNro en respuesta');
        }

        return (int) $cbteNro->item(0)->nodeValue;
    }

    private function buildFacturaSoap(array $auth, array $datos): string
    {
        $ivaXml = '';
        if (isset($datos['Iva'])) {
            foreach ($datos['Iva'] as $iva) {
                $ivaXml .= "<ar:AlicIva><ar:Id>{$iva['Id']}</ar:Id><ar:BaseImp>{$iva['BaseImp']}</ar:BaseImp><ar:Importe>{$iva['Importe']}</ar:Importe></ar:AlicIva>";
            }
        }

        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
    <soapenv:Body>
        <ar:FECAESolicitar>
            <ar:Auth>
                <ar:Token>{$auth['token']}</ar:Token>
                <ar:Sign>{$auth['sign']}</ar:Sign>
                <ar:Cuit>{$this->cuit}</ar:Cuit>
            </ar:Auth>
            <ar:FeCAEReq>
                <ar:FeCabReq>
                    <ar:CantReg>1</ar:CantReg>
                    <ar:PtoVta>{$datos['PtoVta']}</ar:PtoVta>
                    <ar:CbteTipo>{$datos['CbteTipo']}</ar:CbteTipo>
                </ar:FeCabReq>
                <ar:FeDetReq>
                    <ar:FECAEDetRequest>
                        <ar:Concepto>{$datos['Concepto']}</ar:Concepto>
                        <ar:DocTipo>{$datos['DocTipo']}</ar:DocTipo>
                        <ar:DocNro>{$datos['DocNro']}</ar:DocNro>
                        <ar:CbteDesde>{$datos['CbteDesde']}</ar:CbteDesde>
                        <ar:CbteHasta>{$datos['CbteHasta']}</ar:CbteHasta>
                        <ar:CbteFch>{$datos['CbteFch']}</ar:CbteFch>
                        <ar:ImpTotal>{$datos['ImpTotal']}</ar:ImpTotal>
                        <ar:ImpTotConc>{$datos['ImpTotConc']}</ar:ImpTotConc>
                        <ar:ImpNeto>{$datos['ImpNeto']}</ar:ImpNeto>
                        <ar:ImpOpEx>{$datos['ImpOpEx']}</ar:ImpOpEx>
                        <ar:ImpTrib>{$datos['ImpTrib']}</ar:ImpTrib>
                        <ar:ImpIVA>{$datos['ImpIVA']}</ar:ImpIVA>
                        <ar:MonId>{$datos['MonId']}</ar:MonId>
                        <ar:MonCotiz>{$datos['MonCotiz']}</ar:MonCotiz>
                        <ar:CondicionIVAReceptorId>{$datos['CondicionIVAReceptor']}</ar:CondicionIVAReceptorId>
                        <ar:Iva>{$ivaXml}</ar:Iva>
                    </ar:FECAEDetRequest>
                </ar:FeDetReq>
            </ar:FeCAEReq>
        </ar:FECAESolicitar>
    </soapenv:Body>
</soapenv:Envelope>
XML;
    }

    private function parseFacturaResponse(string $response): array
    {
        $dom = new \DOMDocument;
        libxml_use_internal_errors(true);

        if (! $dom->loadXML($response)) {
            throw new \Exception('No se pudo parsear XML de respuesta');
        }

        libxml_clear_errors();

        // Verificar SOAP Fault
        $faults = $dom->getElementsByTagName('Fault');
        if ($faults->length > 0) {
            $faultString = $faults->item(0)->getElementsByTagName('faultstring')->item(0)->nodeValue ?? 'Error desconocido';
            throw new \Exception('SOAP Fault: '.$faultString);
        }

        // Buscar resultado
        $resultado = $dom->getElementsByTagName('FECAESolicitarResult')->item(0);

        if (! $resultado) {
            throw new \Exception('No se encontró FECAESolicitarResult en la respuesta');
        }

        // Verificar errores de nivel superior (ej: CUIT inválido, token expirado)
        $errores = $resultado->getElementsByTagName('Err');
        if ($errores->length > 0) {
            $errMsg = [];
            foreach ($errores as $err) {
                $code = $err->getElementsByTagName('Code')->item(0)->nodeValue ?? '';
                $msg = $err->getElementsByTagName('Msg')->item(0)->nodeValue ?? '';
                $errMsg[] = "[$code] $msg";
            }
            throw new \Exception('Error AFIP: ' . implode('; ', $errMsg));
        }

        $detalle = $resultado->getElementsByTagName('FECAEDetResponse')->item(0);

        if (! $detalle) {
            throw new \Exception('No se encontró FECAEDetResponse en la respuesta');
        }

        $resultadoNode = $detalle->getElementsByTagName('Resultado')->item(0);
        $resultadoValor = $resultadoNode ? $resultadoNode->nodeValue : '';

        if ($resultadoValor === 'A') {
            $cae = $detalle->getElementsByTagName('CAE')->item(0)->nodeValue ?? '';
            $caeFchVto = $detalle->getElementsByTagName('CAEFchVto')->item(0)->nodeValue ?? '';
            $cbteDesde = $detalle->getElementsByTagName('CbteDesde')->item(0)->nodeValue ?? 0;

            return [
                'success' => true,
                'cae' => $cae,
                'vencimiento_cae' => $caeFchVto,
                'numero' => (int) $cbteDesde,
            ];
        }

        // Buscar observaciones
        $obs = $detalle->getElementsByTagName('Obs')->item(0);
        $msg = $obs ? $obs->getElementsByTagName('Msg')->item(0)->nodeValue ?? 'Error desconocido' : 'Error desconocido';

        throw new \Exception('Error: '.$msg);
    }
}
