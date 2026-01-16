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
articulos: id, articulo, precio, marca_id, categoria_id
clientes: id, razonsocial, documentounico
facturas: id, cliente_id, fecha, total
articulo_factura: factura_id, articulo_id, cantidad
marcas: id, marca
categorias: id, categoria

EJEMPLOS:
P: cuantos clientes
R: SELECT COUNT(*) FROM clientes;

P: cuantos productos tengo
R: SELECT COUNT(*) FROM articulos;

P: cliente que mas compro
R: SELECT clientes.razonsocial, SUM(facturas.total) as total FROM clientes JOIN facturas ON clientes.id=facturas.cliente_id GROUP BY clientes.id, clientes.razonsocial ORDER BY total DESC LIMIT 1;

P: total de ventas
R: SELECT SUM(total) as total FROM facturas;

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

        $schema .= "TABLA: articulos\n";
        $schema .= "- id (PK)\n";
        $schema .= "- codarticulo (código del artículo)\n";
        $schema .= "- articulo (nombre del producto)\n";
        $schema .= "- descripcion\n";
        $schema .= "- precio\n";
        $schema .= "- alicuota (IVA)\n";
        $schema .= "- marca_id (FK a marcas.id)\n";
        $schema .= "- categoria_id (FK a categorias.id)\n\n";

        $schema .= "TABLA: clientes\n";
        $schema .= "- id (PK)\n";
        $schema .= "- razonsocial\n";
        $schema .= "- documentounico (CUIT)\n";
        $schema .= "- condicioniva\n";
        $schema .= "- direccion\n";
        $schema .= "- telefono\n";
        $schema .= "- email\n\n";

        $schema .= "TABLA: facturas\n";
        $schema .= "- id (PK)\n";
        $schema .= "- cliente_id (FK a clientes.id)\n";
        $schema .= "- fecha (DATE)\n";
        $schema .= "- total (DECIMAL)\n";
        $schema .= "- autorizada_afip (BOOLEAN)\n";
        $schema .= "- cae\n";
        $schema .= "- vencimiento_cae\n\n";

        $schema .= "TABLA: articulo_factura (relación muchos a muchos)\n";
        $schema .= "- factura_id (FK a facturas.id)\n";
        $schema .= "- articulo_id (FK a articulos.id)\n";
        $schema .= "- cantidad\n";
        $schema .= "- precio\n";
        $schema .= "- subtotal\n\n";

        $schema .= "TABLA: inventarios\n";
        $schema .= "- id (PK)\n";
        $schema .= "- articulo_id (FK a articulos.id)\n";
        $schema .= "- cantidad\n\n";

        $schema .= "TABLA: categorias\n";
        $schema .= "- id (PK)\n";
        $schema .= "- categoria (nombre)\n\n";

        $schema .= "TABLA: marcas\n";
        $schema .= "- id (PK)\n";
        $schema .= "- marca (nombre)\n\n";

        $schema .= "TABLA: presupuestos\n";
        $schema .= "- id (PK)\n";
        $schema .= "- cliente_id (FK a clientes.id)\n";
        $schema .= "- fecha\n";
        $schema .= "- total\n\n";

        $schema .= "NOTAS IMPORTANTES:\n";
        $schema .= "- Para obtener el nombre de la marca: JOIN con tabla marcas usando articulos.marca_id = marcas.id\n";
        $schema .= "- Para obtener el nombre de la categoría: JOIN con tabla categorias usando articulos.categoria_id = categorias.id\n";
        $schema .= "- La tabla articulos NO tiene columna 'marca' ni 'categoria', solo marca_id y categoria_id\n";
        $schema .= "- Para ventas: usar articulo_factura que relaciona facturas con articulos\n";

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
