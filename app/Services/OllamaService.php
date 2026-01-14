<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class OllamaService
{
    private Client $client;
    private string $baseUrl;
    private string $model;
    private AnalyticsService $analytics;

    public function __construct(AnalyticsService $analytics)
    {
        $this->baseUrl = config('ollama.base_url', 'http://localhost:11434');
        $this->model = config('ollama.model', 'llama2');
        $this->analytics = $analytics;
        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'timeout' => 60,
        ]);
    }

    public function chat(array $messages): string
    {
        $lastMessage = end($messages)['content'];
        
        // Detectar si necesita datos de la BD y devolver respuesta directa
        $analyticsResponse = $this->detectAndExecuteAnalytics($lastMessage);
        
        if ($analyticsResponse) {
            return $analyticsResponse;
        }

        // Solo usar el modelo para preguntas generales
        try {
            // Agregar contexto del sistema
            array_unshift($messages, [
                'role' => 'system',
                'content' => 'Eres un asistente del sistema Gepetto de gestión comercial. Responde preguntas sobre cómo usar el sistema, no sobre datos específicos.'
            ]);

            $response = $this->client->post('/api/chat', [
                'json' => [
                    'model' => $this->model,
                    'messages' => $messages,
                    'stream' => false,
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            return $data['message']['content'] ?? 'No response';
        } catch (\Exception $e) {
            Log::error('Ollama error: ' . $e->getMessage());
            return 'Error al conectar con el modelo de IA. Verifica que Ollama esté ejecutándose.';
        }
    }

    private function detectAndExecuteAnalytics(string $message): ?string
    {
        $messageLower = mb_strtolower($message);
        
        // Productos más vendidos
        if (str_contains($messageLower, 'producto') && (str_contains($messageLower, 'vendido') || str_contains($messageLower, 'vende'))) {
            $data = $this->analytics->getTopSellingProducts();
            if (empty($data)) return "No hay datos de ventas disponibles.";
            
            $response = "📊 **Productos más vendidos:**\n\n";
            foreach ($data as $i => $p) {
                $response .= ($i + 1) . ". {$p->nombre}: {$p->total_vendido} unidades\n";
            }
            return $response;
        }
        
        // Mes de mayor ingreso
        if ((str_contains($messageLower, 'mes') || str_contains($messageLower, 'período')) && 
            (str_contains($messageLower, 'mayor') || str_contains($messageLower, 'mejor')) && 
            (str_contains($messageLower, 'ingreso') || str_contains($messageLower, 'venta') || str_contains($messageLower, 'facturación'))) {
            $data = $this->analytics->getBestMonth();
            if (!$data) return "No hay datos de facturación disponibles.";
            
            $meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            return "📈 El mes de mayor ingreso fue **{$meses[$data->month]} {$data->year}** con un total de **$" . number_format($data->revenue, 2) . "**";
        }
        
        // Ingresos mensuales
        if ((str_contains($messageLower, 'ingreso') || str_contains($messageLower, 'venta') || str_contains($messageLower, 'facturación')) && 
            str_contains($messageLower, 'mes')) {
            $data = $this->analytics->getMonthlyRevenue();
            if (empty($data)) return "No hay datos de facturación disponibles.";
            
            $meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            $response = "📊 **Ingresos mensuales:**\n\n";
            foreach ($data as $m) {
                $response .= "{$meses[$m->month]} {$m->year}: $" . number_format($m->revenue, 2) . "\n";
            }
            return $response;
        }
        
        // Mejores clientes
        if (str_contains($messageLower, 'cliente') && 
            (str_contains($messageLower, 'mejor') || str_contains($messageLower, 'top') || str_contains($messageLower, 'más') || str_contains($messageLower, 'compro') || str_contains($messageLower, 'compra'))) {
            $data = $this->analytics->getTopClients();
            if (empty($data)) return "No hay datos de clientes disponibles.";
            
            $response = "👥 **Mejores clientes:**\n\n";
            foreach ($data as $i => $c) {
                $response .= ($i + 1) . ". {$c->nombre}: $" . number_format($c->total_comprado, 2) . "\n";
            }
            return $response;
        }
        
        // Stock bajo
        if (str_contains($messageLower, 'stock') || str_contains($messageLower, 'inventario')) {
            $data = $this->analytics->getLowStock();
            if (empty($data)) return "No hay productos con stock bajo.";
            
            $response = "⚠️ **Productos con stock bajo:**\n\n";
            foreach ($data as $p) {
                $response .= "{$p->nombre}: {$p->cantidad} unidades\n";
            }
            return $response;
        }
        
        // Total de ventas
        if ((str_contains($messageLower, 'total') && str_contains($messageLower, 'venta')) || 
            str_contains($messageLower, 'cuánto') && (str_contains($messageLower, 'vendido') || str_contains($messageLower, 'facturado'))) {
            $total = $this->analytics->getTotalSales();
            return "💰 El total de ventas es: **$" . number_format($total, 2) . "**";
        }
        
        return null;
    }
}
