<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class OllamaService
{
    private Client $client;
    private string $baseUrl;
    private string $model;

    public function __construct()
    {
        $this->baseUrl = config('ollama.base_url', 'http://localhost:11434');
        $this->model = config('ollama.model', 'llama2');
        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'timeout' => 60,
        ]);
    }

    public function chat(array $messages): string
    {
        try {
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
}
