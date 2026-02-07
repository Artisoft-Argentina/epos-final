<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;

class GroqService
{
    private string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('telegram-agents.groq.api_key');
    }

    public function chat(array $messages, array $tools = []): array
    {
        $payload = [
            'model' => 'llama-3.3-70b-versatile',
            'messages' => $messages,
            'temperature' => 0.5,
            'max_tokens' => 1000,
        ];

        if (!empty($tools)) {
            $payload['tools'] = $tools;
            $payload['tool_choice'] = 'auto';
        }

        $response = Http::timeout(30)
            ->withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/json',
            ])
            ->post('https://api.groq.com/openai/v1/chat/completions', $payload);

        if (!$response->successful()) {
            throw new \Exception('HTTP ' . $response->status() . ': ' . $response->body());
        }

        $data = $response->json();
        $choice = $data['choices'][0] ?? [];
        
        return [
            'content' => $choice['message']['content'] ?? null,
            'role' => 'assistant',
            'tool_calls' => $choice['message']['tool_calls'] ?? null,
            'finish_reason' => $choice['finish_reason'] ?? null,
        ];
    }

    public function isAvailable(): bool
    {
        return !empty($this->apiKey);
    }
}
