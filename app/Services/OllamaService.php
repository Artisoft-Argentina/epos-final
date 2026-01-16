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
    private FunctionCallingService $functionCalling;

    public function __construct(AnalyticsService $analytics, FunctionCallingService $functionCalling)
    {
        $this->baseUrl = config('ollama.base_url', 'http://localhost:11434');
        $this->model = config('ollama.model', 'qwen2.5:7b');
        $this->analytics = $analytics;
        $this->functionCalling = $functionCalling;
        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'timeout' => 25,
            'connect_timeout' => 5,
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

        // Detectar si quiere crear categoría
        if (preg_match('/(crea|crear|agrega|agregar|añade|añadir)\s+(?:la\s+)?categoría\s+([a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]+?)\s*$/i', $lastMessage, $matches)) {
            $nombre = trim($matches[2]);
            $result = $this->functionCalling->executeFunction('crear_categoria', ['nombre' => $nombre]);
            return $this->formatToolResult('crear_categoria', $result);
        }

        // Respuesta genérica
        try {
            array_unshift($messages, [
                'role' => 'system',
                'content' => 'Eres un asistente del sistema Gepetto de gestión comercial.'
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
        } catch (\GuzzleHttp\Exception\ConnectException $e) {
            Log::error('Ollama timeout: ' . $e->getMessage());
            return '⏱️ No pude procesar tu consulta a tiempo. Por favor, intenta con una pregunta más simple.';
        } catch (\Exception $e) {
            Log::error('Ollama error: ' . $e->getMessage());
            return '❌ No pude realizar la consulta. Por favor, intenta nuevamente.';
        }
    }

    private function handleToolCalls(array $toolCalls): string
    {
        $results = [];
        
        foreach ($toolCalls as $toolCall) {
            $functionName = $toolCall['function']['name'];
            $arguments = json_decode($toolCall['function']['arguments'], true) ?? [];
            
            $result = $this->functionCalling->executeFunction($functionName, $arguments);
            $results[] = $this->formatToolResult($functionName, $result);
        }
        
        return implode("\n\n", $results);
    }

    private function formatToolResult(string $functionName, array $result): string
    {
        if (isset($result['error'])) {
            return '❌ ' . $result['error'];
        }

        return match ($functionName) {
            'get_total_clientes' => "📊 Total de clientes: **{$result['total']}**",
            'get_total_productos' => "📦 Total de productos: **{$result['total']}**",
            'get_total_ventas' => '💰 Total de ventas: **$' . number_format($result['total'], 2) . '**',
            'get_top_clientes' => $this->formatTopClientes($result['clientes']),
            'get_productos_bajo_stock' => $this->formatProductosBajoStock($result['productos']),
            'buscar_cliente' => $this->formatBuscarCliente($result['clientes']),
            'crear_categoria' => "✅ Categoría **{$result['nombre']}** creada exitosamente (ID: {$result['id']})",
            default => json_encode($result),
        };
    }

    private function formatTopClientes(array $clientes): string
    {
        if (empty($clientes)) return 'No hay datos de clientes.';
        
        $response = "👥 **Top Clientes:**\n\n";
        foreach ($clientes as $i => $c) {
            $response .= ($i + 1) . ". {$c->razonsocial}: $" . number_format($c->total_comprado, 2) . "\n";
        }
        return $response;
    }

    private function formatProductosBajoStock(array $productos): string
    {
        if (empty($productos)) return 'No hay productos con stock bajo.';
        
        $response = "⚠️ **Productos con stock bajo:**\n\n";
        foreach ($productos as $p) {
            $response .= "{$p->nombre}: {$p->cantidad} unidades\n";
        }
        return $response;
    }

    private function formatBuscarCliente(array $clientes): string
    {
        if (empty($clientes)) return 'No se encontraron clientes.';
        
        $response = "🔍 **Clientes encontrados:**\n\n";
        foreach ($clientes as $c) {
            $response .= "• {$c->razonsocial} (CUIT: {$c->documentounico})\n";
            if ($c->email) $response .= "  Email: {$c->email}\n";
            if ($c->telefono) $response .= "  Tel: {$c->telefono}\n";
        }
        return $response;
    }

    private function detectAndExecuteAnalytics(string $message): ?string
    {
        $messageLower = mb_strtolower($message);
        
        // Detectar creación de categoría
        if (preg_match('/(crea|crear|agrega|agregar|añade|añadir)\s+(?:la\s+)?categor[ií]a\s+([a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]+?)\s*$/i', $message, $matches)) {
            $nombre = trim($matches[2]);
            $result = $this->functionCalling->executeFunction('crear_categoria', ['nombre' => $nombre]);
            return $this->formatToolResult('crear_categoria', $result);
        }
        
        // Extraer rango de fechas si existe
        $dates = $this->extractDateRange($messageLower);
        
        // Productos más vendidos
        if (str_contains($messageLower, 'producto') && (str_contains($messageLower, 'vendido') || str_contains($messageLower, 'vende'))) {
            $data = $this->analytics->getTopSellingProducts(10, $dates['start'], $dates['end']);
            if (empty($data)) return "No hay datos de ventas disponibles.";
            
            $response = "📊 **Productos más vendidos" . ($dates['label'] ? " {$dates['label']}" : '') . ":**\n\n";
            foreach ($data as $i => $p) {
                $response .= ($i + 1) . ". {$p->nombre}: {$p->total_vendido} unidades\n";
            }
            return $response;
        }
        
        // Mejor vendedor
        if (str_contains($messageLower, 'vendedor') && (str_contains($messageLower, 'mejor') || str_contains($messageLower, 'más'))) {
            $data = $this->analytics->getTopSellers($dates['start'], $dates['end']);
            if (empty($data)) return "No hay datos de vendedores disponibles.";
            
            $response = "👤 **Mejores vendedores" . ($dates['label'] ? " {$dates['label']}" : '') . ":**\n\n";
            foreach ($data as $i => $v) {
                $response .= ($i + 1) . ". {$v->vendedor}: $" . number_format($v->total_vendido, 2) . "\n";
            }
            return $response;
        }
        
        // Mes de mayor ingreso
        if ((str_contains($messageLower, 'mes') || str_contains($messageLower, 'período')) && 
            (str_contains($messageLower, 'mayor') || str_contains($messageLower, 'mejor')) && 
            (str_contains($messageLower, 'ingreso') || str_contains($messageLower, 'venta') || str_contains($messageLower, 'facturación'))) {
            $data = $this->analytics->getBestMonth($dates['start'], $dates['end']);
            if (!$data) return "No hay datos de facturación disponibles.";
            
            $meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            return "📈 El mes de mayor ingreso" . ($dates['label'] ? " {$dates['label']}" : '') . " fue **{$meses[$data->month]} {$data->year}** con un total de **$" . number_format($data->revenue, 2) . "**";
        }
        
        // Ingresos mensuales
        if ((str_contains($messageLower, 'ingreso') || str_contains($messageLower, 'venta') || str_contains($messageLower, 'facturación')) && 
            str_contains($messageLower, 'mes')) {
            $data = $this->analytics->getMonthlyRevenue($dates['start'], $dates['end']);
            if (empty($data)) return "No hay datos de facturación disponibles.";
            
            $meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            $response = "📊 **Ingresos mensuales" . ($dates['label'] ? " {$dates['label']}" : '') . ":**\n\n";
            foreach ($data as $m) {
                $response .= "{$meses[$m->month]} {$m->year}: $" . number_format($m->revenue, 2) . "\n";
            }
            return $response;
        }
        
        // Mejores clientes
        if (str_contains($messageLower, 'cliente') && 
            (str_contains($messageLower, 'mejor') || str_contains($messageLower, 'top') || str_contains($messageLower, 'más') || str_contains($messageLower, 'compro') || str_contains($messageLower, 'compra'))) {
            $data = $this->analytics->getTopClients(10, $dates['start'], $dates['end']);
            if (empty($data)) return "No hay datos de clientes disponibles.";
            
            $response = "👥 **Mejores clientes" . ($dates['label'] ? " {$dates['label']}" : '') . ":**\n\n";
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
            $total = $this->analytics->getTotalSales($dates['start'], $dates['end']);
            return "💰 El total de ventas" . ($dates['label'] ? " {$dates['label']}" : '') . " es: **$" . number_format($total, 2) . "**";
        }
        
        return null;
    }
    
    private function extractDateRange(string $message): array
    {
        $now = now();
        
        // Este mes
        if (str_contains($message, 'este mes') || str_contains($message, 'del mes')) {
            return [
                'start' => $now->startOfMonth()->format('Y-m-d'),
                'end' => $now->endOfMonth()->format('Y-m-d'),
                'label' => 'de este mes'
            ];
        }
        
        // Este año
        if (str_contains($message, 'este año') || str_contains($message, 'del año')) {
            return [
                'start' => $now->startOfYear()->format('Y-m-d'),
                'end' => $now->endOfYear()->format('Y-m-d'),
                'label' => 'de este año'
            ];
        }
        
        // Últimos 30 días
        if (str_contains($message, 'últimos 30') || str_contains($message, 'ultimo mes')) {
            return [
                'start' => $now->copy()->subDays(30)->format('Y-m-d'),
                'end' => $now->format('Y-m-d'),
                'label' => 'de los últimos 30 días'
            ];
        }
        
        // Sin filtro
        return ['start' => null, 'end' => null, 'label' => ''];
    }
}
