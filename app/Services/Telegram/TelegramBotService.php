<?php

namespace App\Services\Telegram;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramBotService
{
    private string $token;

    public function __construct(string $botType)
    {
        $this->token = $botType === 'admin' 
            ? config('telegram-agents.admin_token') ?? env('TELEGRAM_BOT_ADMIN_TOKEN', '')
            : config('telegram-agents.vendedor_token') ?? env('TELEGRAM_BOT_VENDEDOR_TOKEN', '');
            
        if (empty($this->token)) {
            throw new \Exception("Telegram bot token not configured for {$botType}");
        }
    }

    public function sendMessage(int $chatId, string $text, ?array $keyboard = null): array
    {
        $params = [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'HTML',
        ];

        if ($keyboard) {
            $params['reply_markup'] = json_encode($keyboard);
        }

        return $this->makeRequest('sendMessage', $params);
    }

    public function sendTypingAction(int $chatId): void
    {
        $this->makeRequest('sendChatAction', [
            'chat_id' => $chatId,
            'action' => 'typing',
        ]);
    }

    public function setWebhook(string $url): array
    {
        return $this->makeRequest('setWebhook', [
            'url' => $url,
            'allowed_updates' => ['message', 'callback_query'],
        ]);
    }

    public function deleteWebhook(): array
    {
        return $this->makeRequest('deleteWebhook');
    }

    public function getWebhookInfo(): array
    {
        return $this->makeRequest('getWebhookInfo');
    }

    private function makeRequest(string $method, array $params = []): array
    {
        $url = "https://api.telegram.org/bot{$this->token}/{$method}";
        
        try {
            $response = Http::timeout(10)->post($url, $params);
            
            if (!$response->successful()) {
                Log::error('Telegram API error', [
                    'method' => $method,
                    'response' => $response->body(),
                ]);
            }

            return $response->json();
        } catch (\Exception $e) {
            Log::error('Telegram request failed', [
                'method' => $method,
                'error' => $e->getMessage(),
            ]);
            
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }
}
