<?php

namespace App\Services;

use App\Models\Articulo;
use App\Models\Inventario;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;
use Smalot\PdfParser\Parser;
use thiagoalessio\TesseractOCR\TesseractOCR;

class PdfProcessorService
{
    private Client $client;
    private string $apiUrl;

    public function __construct()
    {
        $this->apiUrl = env('CUSTOM_API_URL', 'http://localhost:3000');
        $this->client = new Client([
            'timeout' => 60,
        ]);
    }

    public function extractAndProcess(string $filePath): array
    {
        // Detectar tipo de archivo por MIME type
        $mimeType = mime_content_type($filePath);
        
        // Extraer texto según el tipo
        if ($mimeType === 'application/pdf') {
            $text = $this->extractTextFromPdf($filePath);
        } else {
            $text = $this->extractTextFromImage($filePath);
        }
        
        if (!$text) {
            return ['error' => 'No se pudo extraer texto del archivo'];
        }

        // Procesar con tu API custom
        $data = $this->processWithCustomAPI($text);
        
        // Actualizar inventario si hay items
        if (isset($data['items']) && is_array($data['items'])) {
            $this->updateInventory($data['items']);
        }
        
        return $data;
    }

    private function extractTextFromPdf(string $pdfPath): ?string
    {
        try {
            $parser = new Parser();
            $pdf = $parser->parseFile($pdfPath);
            return $pdf->getText();
        } catch (\Exception $e) {
            Log::error('Error extrayendo texto del PDF: ' . $e->getMessage());
            return null;
        }
    }

    private function extractTextFromImage(string $imagePath): ?string
    {
        try {
            // Verificar que Tesseract esté instalado
            $tesseractPath = trim(shell_exec('which tesseract') ?? '');
            
            if (empty($tesseractPath)) {
                Log::error('Tesseract no encontrado en el sistema');
                return null;
            }

            // Usar Tesseract OCR para extraer texto de la imagen
            $ocr = new TesseractOCR($imagePath);
            $ocr->executable($tesseractPath);
            $ocr->lang('spa', 'eng'); // Español e inglés
            $text = $ocr->run();
            
            Log::info('Texto extraído de imagen: ' . substr($text, 0, 200));
            return $text;
        } catch (\Exception $e) {
            Log::error('Error extrayendo texto de la imagen: ' . $e->getMessage());
            return null;
        }
    }

    private function processWithCustomAPI(string $text): array
    {
        try {
            $response = $this->client->post($this->apiUrl . '/chat', [
                'json' => [
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'Eres un asistente que extrae información estructurada de facturas y documentos comerciales. Responde solo con JSON válido.'
                        ],
                        [
                            'role' => 'user',
                            'content' => "Extrae la siguiente información del texto y devuélvela en formato JSON: proveedor, fecha, número de factura, items (con codigo, descripción, cantidad, precio unitario), subtotal, impuestos, total.\n\nTexto:\n" . $text
                        ]
                    ],
                ],
                'timeout' => 60,
                'connect_timeout' => 10,
            ]);

            $content = $response->getBody()->getContents();
            
            // La respuesta es un stream de texto, concatenar todo
            $jsonMatch = preg_match('/\{.*\}/s', $content, $matches);
            if ($jsonMatch) {
                $data = json_decode($matches[0], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    return $data;
                }
                Log::error('Error parseando JSON: ' . json_last_error_msg());
            }
            
            Log::error('Respuesta de API no contiene JSON válido', ['content' => substr($content, 0, 500)]);
            return ['error' => 'La API no devolvió un formato válido'];
        } catch (\GuzzleHttp\Exception\ConnectException $e) {
            Log::error('Error de conexión con API: ' . $e->getMessage());
            return ['error' => 'No se pudo conectar con el servicio de procesamiento'];
        } catch (\Exception $e) {
            Log::error('Error procesando con API: ' . $e->getMessage());
            return ['error' => 'Error al procesar el documento: ' . $e->getMessage()];
        }
    }

    private function updateInventory(array $items): void
    {
        foreach ($items as $item) {
            if (!isset($item['cantidad'])) {
                continue;
            }

            // Buscar artículo por código (prioridad) o descripción
            $articulo = null;
            
            if (isset($item['codigo'])) {
                $articulo = Articulo::where('codarticulo', $item['codigo'])
                    ->orWhere('codprov', $item['codigo'])
                    ->first();
            }
            
            if (!$articulo && isset($item['descripcion'])) {
                $articulo = Articulo::where('articulo', 'LIKE', '%' . $item['descripcion'] . '%')
                    ->first();
            }

            if ($articulo) {
                $inventario = Inventario::firstOrCreate(
                    ['articulo_id' => $articulo->id],
                    ['cantidad' => 0]
                );

                $inventario->cantidad += $item['cantidad'];
                $inventario->save();

                Log::info("Inventario actualizado: {$articulo->articulo} (código: {$articulo->codarticulo}) +{$item['cantidad']}");
            }
        }
    }
}
