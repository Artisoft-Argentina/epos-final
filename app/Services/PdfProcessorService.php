<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;
use Smalot\PdfParser\Parser;

class PdfProcessorService
{
    private Client $client;
    private string $apiKey;

    public function __construct()
    {
        $this->apiKey = env('GROQ_API_KEY');
        $this->client = new Client([
            'base_uri' => 'https://api.groq.com/openai/v1/',
            'timeout' => 60,
        ]);
    }

    public function extractAndProcess(string $pdfPath): array
    {
        // Extraer texto del PDF
        $text = $this->extractTextFromPdf($pdfPath);
        
        if (!$text) {
            return ['error' => 'No se pudo extraer texto del PDF'];
        }

        // Procesar con IA para generar JSON estructurado
        return $this->processWithAI($text);
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

    private function processWithAI(string $text): array
    {
        $prompt = $this->buildPrompt($text);

        try {
            $response = $this->client->post('chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => 'llama-3.3-70b-versatile',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'Eres un asistente que extrae información de facturas y remitos. Responde SOLO con JSON válido, sin texto adicional.'
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt
                        ]
                    ],
                    'response_format' => ['type' => 'json_object'],
                    'temperature' => 0.1,
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            $jsonResponse = $data['choices'][0]['message']['content'] ?? '{}';
            
            return json_decode($jsonResponse, true) ?? ['error' => 'Respuesta inválida'];
        } catch (\Exception $e) {
            Log::error('Error procesando con IA: ' . $e->getMessage());
            return ['error' => 'Error al procesar el documento: ' . $e->getMessage()];
        }
    }

    private function buildPrompt(string $text): string
    {
        return <<<PROMPT
Analiza el siguiente texto extraído de una factura o remito y extrae la información en formato JSON.

Texto del documento:
{$text}

Genera un JSON con esta estructura:
{
  "tipo_documento": "factura|remito",
  "numero": "número del documento",
  "fecha": "YYYY-MM-DD",
  "proveedor": {
    "nombre": "razón social",
    "cuit": "CUIT",
    "direccion": "dirección",
    "telefono": "teléfono"
  },
  "items": [
    {
      "codigo": "código del producto",
      "descripcion": "descripción",
      "cantidad": 0,
      "precio_unitario": 0.00,
      "subtotal": 0.00
    }
  ],
  "subtotal": 0.00,
  "iva": 0.00,
  "total": 0.00
}

Si algún campo no está disponible, usa null. Responde SOLO con el JSON, sin explicaciones.
PROMPT;
    }
}
