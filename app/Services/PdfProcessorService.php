<?php

namespace App\Services;

use App\Models\Articulo;
use App\Models\Inventario;
use App\Services\AI\GroqService;
use Illuminate\Support\Facades\Log;
use Smalot\PdfParser\Parser;
use thiagoalessio\TesseractOCR\TesseractOCR;

class PdfProcessorService
{
    private GroqService $groq;

    public function __construct(GroqService $groq)
    {
        $this->groq = $groq;
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
        
        // Actualizar inventario si hay items y enriquecer respuesta
        if (isset($data['items']) && is_array($data['items'])) {
            $data['items'] = $this->updateInventory($data['items']);
            Log::info('Items enriquecidos', ['items' => $data['items']]);
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
        Log::info('Procesando con Groq AI');
        
        try {
            $response = $this->groq->chat([
                [
                    'role' => 'system',
                    'content' => 'Eres un asistente que extrae información estructurada de facturas y documentos comerciales. Responde SOLO con JSON válido, sin texto adicional.'
                ],
                [
                    'role' => 'user',
                    'content' => "Extrae la siguiente información del texto y devuélvela en formato JSON con esta estructura exacta: {\"proveedor\":{\"nombre\":\"\",\"cuit\":\"\"},\"fecha\":\"\",\"numero\":\"\",\"items\":[{\"codigo\":\"\",\"descripcion\":\"\",\"cantidad\":0,\"precio_unitario\":0}],\"subtotal\":0,\"impuestos\":0,\"total\":0}\n\nTexto:\n" . substr($text, 0, 2000)
                ]
            ]);

            $content = $response['content'] ?? '';
            Log::info('Respuesta de Groq', ['content' => substr($content, 0, 500)]);
            
            if (empty($content)) {
                return ['error' => 'La IA no devolvió respuesta'];
            }
            
            // Intentar parsear directamente
            $data = json_decode($content, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                Log::info('JSON parseado correctamente');
                return $data;
            }
            
            // Si falla, buscar JSON en el contenido
            if (preg_match('/\{.*\}/s', $content, $matches)) {
                $data = json_decode($matches[0], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    Log::info('JSON extraído y parseado correctamente');
                    return $data;
                }
            }
            
            Log::error('Respuesta no es JSON válido', [
                'content' => substr($content, 0, 500),
                'json_error' => json_last_error_msg()
            ]);
            return ['error' => 'La respuesta no es JSON válido: ' . json_last_error_msg()];
        } catch (\Exception $e) {
            Log::error('Error procesando con Groq: ' . $e->getMessage());
            return ['error' => 'Error al procesar el documento: ' . $e->getMessage()];
        }
    }

    private function updateInventory(array $items): array
    {
        $enrichedItems = [];
        
        foreach ($items as $item) {
            $enrichedItem = $item;
            $enrichedItem['encontrado'] = false;
            $enrichedItem['articulo_id'] = null;
            $enrichedItem['articulo_nombre'] = null;
            $enrichedItem['codarticulo'] = null;
            
            if (!isset($item['cantidad']) || $item['cantidad'] <= 0) {
                $enrichedItems[] = $enrichedItem;
                continue;
            }

            $articulo = null;
            
            // Buscar por código de proveedor (prioridad)
            if (isset($item['codigo']) && !empty($item['codigo'])) {
                $articulo = Articulo::where('codprov', $item['codigo'])->first();
                
                if ($articulo) {
                    Log::info("Artículo encontrado por codprov", [
                        'codprov' => $item['codigo'],
                        'articulo' => $articulo->articulo,
                        'codarticulo' => $articulo->codarticulo
                    ]);
                }
            }
            
            // Si no se encuentra, buscar por código interno
            if (!$articulo && isset($item['codigo']) && !empty($item['codigo'])) {
                $articulo = Articulo::where('codarticulo', $item['codigo'])->first();
                
                if ($articulo) {
                    Log::info("Artículo encontrado por codarticulo", [
                        'codarticulo' => $item['codigo'],
                        'articulo' => $articulo->articulo
                    ]);
                }
            }
            
            // Si no se encuentra, buscar por descripción
            if (!$articulo && isset($item['descripcion']) && !empty($item['descripcion'])) {
                $articulo = Articulo::where('articulo', 'LIKE', '%' . $item['descripcion'] . '%')
                    ->first();
                    
                if ($articulo) {
                    Log::info("Artículo encontrado por descripción", [
                        'descripcion' => $item['descripcion'],
                        'articulo' => $articulo->articulo
                    ]);
                }
            }

            if ($articulo) {
                $inventario = Inventario::firstOrCreate(
                    ['articulo_id' => $articulo->id],
                    ['cantidad' => 0]
                );

                $inventario->cantidad += $item['cantidad'];
                $inventario->save();

                Log::info("Inventario actualizado: {$articulo->articulo} (codprov: {$articulo->codprov}, codarticulo: {$articulo->codarticulo}) +{$item['cantidad']}");
                
                $enrichedItem['encontrado'] = true;
                $enrichedItem['articulo_id'] = $articulo->id;
                $enrichedItem['articulo_nombre'] = $articulo->articulo;
                $enrichedItem['codarticulo'] = $articulo->codarticulo;
            } else {
                Log::warning("Artículo no encontrado", [
                    'codigo' => $item['codigo'] ?? null,
                    'descripcion' => $item['descripcion'] ?? null
                ]);
            }
            
            $enrichedItems[] = $enrichedItem;
        }
        
        return $enrichedItems;
    }
}
