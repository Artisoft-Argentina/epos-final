<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;

class OllamaService
{
    private string $apiUrl;
    private string $model;

    public function __construct()
    {
        $this->apiUrl = config('telegram-agents.ollama.api_url');
        $this->model = config('telegram-agents.ollama.model');
    }

    public function chat(array $messages, array $tools = []): array
    {
        $response = Http::timeout(60)->post("{$this->apiUrl}/api/chat", [
            'model' => $this->model,
            'messages' => $messages,
            'stream' => false,
        ]);

        if (!$response->successful()) {
            throw new \Exception('Error al comunicarse con Ollama: ' . $response->body());
        }

        $data = $response->json();
        
        return [
            'content' => $data['message']['content'] ?? '',
            'role' => $data['message']['role'] ?? 'assistant',
            'tool_calls' => null,
            'finish_reason' => 'stop',
        ];
    }

    public function isAvailable(): bool
    {
        try {
            $response = Http::timeout(2)->get("{$this->apiUrl}/api/tags");
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }
}
