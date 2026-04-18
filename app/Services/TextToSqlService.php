<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TextToSqlService
{
    private Client $client;

    private string $baseUrl;

    private string $model;

    public function __construct()
    {
        $this->baseUrl = config('ollama.base_url', 'http://localhost:11434');
        // $this->model = config('ollama.model', 'llama2');
        $this->model = config('ollama.model', 'llama3.1:8b');
        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'timeout' => 30,
            'connect_timeout' => 5,
        ]);
    }

    public function generateAndExecuteQuery(string $question, array $history = []): array
    {
        try {
            // Verificar si la pregunta necesita más información
            $needsInfo = $this->checkIfNeedsMoreInfo($question, $history);
            if ($needsInfo) {
                return ['conversation' => $needsInfo];
            }

            $schema = $this->getDatabaseSchema();
            $sql = $this->generateSQL($question, $schema, $history);

            if (! $sql) {
                return ['error' => 'Lo siento, no pude procesar tu pregunta. Intenta reformularla o usa las opciones predefinidas del menú.'];
            }

            $results = DB::select($sql);

            return [
                'sql' => $sql,
                'results' => $results,
                'count' => count($results),
            ];
        } catch (\Exception $e) {
            Log::error('Query execution error: '.$e->getMessage());

            return ['error' => 'No pude procesar tu consulta en este momento. Por favor, intenta con una pregunta más simple.'];
        }
    }

    private function checkIfNeedsMoreInfo(string $question, array $history): ?string
    {
        $lower = mb_strtolower($question);

        // Si pregunta por un cliente/producto específico sin nombre
        if (preg_match('/(cliente|producto|articulo)\s+(con|de|que)/i', $question) &&
            ! preg_match('/\b[A-Z][a-z]+\b/', $question)) {
            return '¿Podrías especificar el nombre del '.(str_contains($lower, 'cliente') ? 'cliente' : 'producto').'?';
        }

        // Si pregunta por rango de fechas sin especificar
        if ((str_contains($lower, 'ventas') || str_contains($lower, 'facturas')) &&
            ! str_contains($lower, 'total') &&
            ! preg_match('/(mes|año|día|fecha|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|\d{4})/i', $question)) {
            return '¿De qué período necesitas la información? (este mes, este año, últimos 30 días, etc.)';
        }

        return null;
    }

    private function generateSQL(string $question, string $schema, array $history = []): ?string
    {
        // Construir contexto con historial
        $context = '';
        if (! empty($history)) {
            $context = "\nCONTEXTO PREVIO:\n";
            foreach (array_slice($history, -3) as $msg) {
                $context .= $msg['role'].': '.$msg['content']."\n";
            }
        }

        $prompt = "SQL MySQL. Solo el query.{$context}

TABLAS:
products: id, sku, name, price, brand_id, category_id
customers: id, business_name, tax_id
sales: id, customer_id, date, total
sale_products: sale_id, product_id, quantity
brands: id, name
categories: id, name

EJEMPLOS:
P: cuantos clientes
R: SELECT COUNT(*) FROM customers;

P: cuantos productos tengo
R: SELECT COUNT(*) FROM products;

P: cliente que mas compro
R: SELECT customers.business_name, SUM(sales.total) as total FROM customers JOIN sales ON customers.id=sales.customer_id GROUP BY customers.id, customers.business_name ORDER BY total DESC LIMIT 1;

P: total de ventas
R: SELECT SUM(total) as total FROM sales;

P: {$question}
R:";

        try {
            $response = $this->client->post('/api/generate', [
                'json' => [
                    'model' => $this->model,
                    'prompt' => $prompt,
                    'stream' => false,
                    'options' => [
                        'temperature' => 0.1,
                        'num_predict' => 100,
                    ],
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            $sql = trim($data['response'] ?? '');

            // Limpiar
            $sql = preg_replace('/```.*?```/s', '', $sql);
            $sql = preg_replace('/^(SQL:|R:)\s*/i', '', $sql);
            $sql = preg_replace('/\s+/', ' ', $sql);
            $sql = trim($sql);

            if (! preg_match('/^\s*SELECT/i', $sql)) {
                return null;
            }

            return $sql;
        } catch (\GuzzleHttp\Exception\ConnectException $e) {
            Log::error('Ollama timeout: '.$e->getMessage());

            return null;
        } catch (\Exception $e) {
            Log::error('Ollama error: '.$e->getMessage());

            return null;
        }
    }

    private function getDatabaseSchema(): string
    {
        $schema = "ESQUEMA DE BASE DE DATOS MYSQL:\n\n";

        $schema .= "TABLA: products\n";
        $schema .= "- id (PK)\n";
        $schema .= "- sku (código del artículo)\n";
        $schema .= "- name (nombre del producto)\n";
        $schema .= "- description\n";
        $schema .= "- price\n";
        $schema .= "- tax_rate (IVA)\n";
        $schema .= "- brand_id (FK a brands.id)\n";
        $schema .= "- category_id (FK a categories.id)\n\n";

        $schema .= "TABLA: customers\n";
        $schema .= "- id (PK)\n";
        $schema .= "- business_name\n";
        $schema .= "- tax_id (CUIT)\n";
        $schema .= "- tax_status\n";
        $schema .= "- address\n";
        $schema .= "- phone\n";
        $schema .= "- email\n\n";

        $schema .= "TABLA: sales\n";
        $schema .= "- id (PK)\n";
        $schema .= "- customer_id (FK a customers.id)\n";
        $schema .= "- date (DATE)\n";
        $schema .= "- total (DECIMAL)\n";
        $schema .= "- afip_authorized (BOOLEAN)\n";
        $schema .= "- cae\n";
        $schema .= "- cae_expiration\n\n";

        $schema .= "TABLA: sale_products (relación muchos a muchos)\n";
        $schema .= "- sale_id (FK a sales.id)\n";
        $schema .= "- product_id (FK a products.id)\n";
        $schema .= "- quantity\n";
        $schema .= "- unit_price\n";
        $schema .= "- subtotal\n\n";

        $schema .= "TABLA: stocks\n";
        $schema .= "- id (PK)\n";
        $schema .= "- product_id (FK a products.id)\n";
        $schema .= "- quantity\n\n";

        $schema .= "TABLA: categories\n";
        $schema .= "- id (PK)\n";
        $schema .= "- name (nombre)\n\n";

        $schema .= "TABLA: brands\n";
        $schema .= "- id (PK)\n";
        $schema .= "- name (nombre)\n\n";

        $schema .= "TABLA: quotes\n";
        $schema .= "- id (PK)\n";
        $schema .= "- customer_id (FK a customers.id)\n";
        $schema .= "- date\n";
        $schema .= "- total\n\n";

        $schema .= "NOTAS IMPORTANTES:\n";
        $schema .= "- Para obtener el nombre de la marca: JOIN con tabla brands usando products.brand_id = brands.id\n";
        $schema .= "- Para obtener el nombre de la categoría: JOIN con tabla categories usando products.category_id = categories.id\n";
        $schema .= "- La tabla products NO tiene columna 'brand' ni 'category', solo brand_id y category_id\n";
        $schema .= "- Para ventas: usar sale_products que relaciona sales con products\n";

        return $schema;
    }

    public function formatResults(array $data): string
    {
        // Si es una conversación, devolver la pregunta
        if (isset($data['conversation'])) {
            return '💬 '.$data['conversation'];
        }

        if (isset($data['error'])) {
            return '❌ '.$data['error'];
        }

        if (empty($data['results'])) {
            return 'No se encontraron resultados.';
        }

        $results = $data['results'];
        $firstRow = $results[0];

        // Si es un COUNT, SUM, AVG, etc. (una sola columna con agregación)
        if (count((array) $firstRow) === 1 && count($results) === 1) {
            $value = array_values((array) $firstRow)[0];
            $column = array_keys((array) $firstRow)[0];

            if (stripos($column, 'COUNT') !== false) {
                return "📊 Total: **{$value}**";
            }
            if (stripos($column, 'SUM') !== false || stripos($column, 'total') !== false) {
                return '💰 Total: **$'.number_format($value, 2).'**';
            }
            if (stripos($column, 'AVG') !== false || stripos($column, 'promedio') !== false) {
                return '📈 Promedio: **'.number_format($value, 2).'**';
            }

            return "📊 Resultado: **{$value}**";
        }

        // Para múltiples resultados
        $response = "📊 **Resultados ({$data['count']}):**\n\n";

        foreach ($results as $i => $row) {
            $response .= ($i + 1).'. ';
            $values = [];
            foreach ($row as $key => $value) {
                $values[] = "**{$key}:** {$value}";
            }
            $response .= implode(', ', $values)."\n";
        }

        return $response;
    }
}
