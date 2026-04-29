<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Stock;
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
        
        // Enriquecer items con información de artículos (sin actualizar inventario)
        if (isset($data['items']) && is_array($data['items'])) {
            $data['items'] = $this->enrichItems($data['items']);
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
            
            if (empty($content)) {
                return ['error' => 'La IA no devolvió respuesta'];
            }
            
            // Intentar parsear directamente
            $data = json_decode($content, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $data;
            }
            
            // Si falla, buscar JSON en el contenido
            if (preg_match('/\{.*\}/s', $content, $matches)) {
                $data = json_decode($matches[0], true);
                if (json_last_error() === JSON_ERROR_NONE) {
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

    private function enrichItems(array $items): array
    {
        $enrichedItems = [];
        
        foreach ($items as $item) {
            $enrichedItem = $item;
            $enrichedItem['encontrado'] = false;
            $enrichedItem['articulo_id'] = null;
            $enrichedItem['articulo_nombre'] = null;
            $enrichedItem['codarticulo'] = null;
            
            $articulo = null;
            
            if (isset($item['codigo']) && !empty($item['codigo'])) {
                $product = Product::where('supplier_code', $item['codigo'])->first();
            }
            if (!$product && isset($item['codigo']) && !empty($item['codigo'])) {
                $product = Product::where('sku', $item['codigo'])->first();
            }
            if (!$product && isset($item['descripcion']) && !empty($item['descripcion'])) {
                $product = Product::where('name', 'LIKE', '%' . $item['descripcion'] . '%')->first();
            }

            if ($product) {
                $enrichedItem['encontrado']     = true;
                $enrichedItem['articulo_id']    = $product->id;
                $enrichedItem['articulo_nombre']= $product->name;
                $enrichedItem['codarticulo']    = $product->sku;
                $enrichedItem['codprov']        = $product->supplier_code;
            }
            
            $enrichedItems[] = $enrichedItem;
        }
        
        return $enrichedItems;
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
            
            if (isset($item['codigo']) && !empty($item['codigo'])) {
                $product = Product::where('supplier_code', $item['codigo'])->first();
                if ($product) Log::info("Artículo encontrado por supplier_code", ['supplier_code' => $item['codigo'], 'name' => $product->name]);
            }
            if (!$product && isset($item['codigo']) && !empty($item['codigo'])) {
                $product = Product::where('sku', $item['codigo'])->first();
                if ($product) Log::info("Artículo encontrado por sku", ['sku' => $item['codigo'], 'name' => $product->name]);
            }
            if (!$product && isset($item['descripcion']) && !empty($item['descripcion'])) {
                $product = Product::where('name', 'LIKE', '%' . $item['descripcion'] . '%')->first();
                if ($product) Log::info("Artículo encontrado por descripción", ['descripcion' => $item['descripcion'], 'name' => $product->name]);
            }

            if ($product) {
                $stock = Stock::firstOrCreate(
                    ['product_id' => $product->id],
                    ['quantity' => 0]
                );
                $stock->quantity += $item['cantidad'];
                $stock->save();

                $enrichedItem['encontrado']     = true;
                $enrichedItem['articulo_id']    = $product->id;
                $enrichedItem['articulo_nombre']= $product->name;
                $enrichedItem['codarticulo']    = $product->sku;
            } else {
                Log::warning("Artículo no encontrado", ['codigo' => $item['codigo'] ?? null, 'descripcion' => $item['descripcion'] ?? null]);
            }
            
            $enrichedItems[] = $enrichedItem;
        }
        
        return $enrichedItems;
    }
}
