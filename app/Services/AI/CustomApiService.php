<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;

class CustomApiService
{
    private string $apiUrl;

    public function __construct()
    {
        $this->apiUrl = config('telegram-agents.custom_api.url');
    }

    public function chat(array $messages, array $tools = []): array
    {
        // Extraer el último mensaje del usuario
        $userMessage = collect($messages)->last(fn($msg) => $msg['role'] === 'user')['content'] ?? '';

        try {
            $response = Http::timeout(30)->post("{$this->apiUrl}/chat", [
                'message' => $userMessage,
            ]);

            if (!$response->successful()) {
                throw new \Exception('HTTP ' . $response->status() . ': ' . $response->body());
            }

            $data = $response->json();
            
            return [
                'content' => $data['response'] ?? $data['message'] ?? 'Sin respuesta',
                'role' => 'assistant',
                'tool_calls' => null,
                'finish_reason' => 'stop',
            ];
        } catch (\Exception $e) {
            throw new \Exception('Error al comunicarse con Custom API: ' . $e->getMessage());
        }
    }

    public function isAvailable(): bool
    {
        try {
            $response = Http::timeout(2)->get($this->apiUrl);
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }
}
