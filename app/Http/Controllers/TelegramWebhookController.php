<?php

namespace App\Http\Controllers;

use App\Models\TelegramUser;
use App\Models\TelegramConversation;
use App\Services\AI\OllamaService;
use App\Services\Telegram\TelegramBotService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TelegramWebhookController extends Controller
{
    public function handleAdmin(Request $request)
    {
        return $this->handleWebhook($request, 'admin');
    }

    public function handleVendedor(Request $request)
    {
        return $this->handleWebhook($request, 'vendedor');
    }

    private function handleWebhook(Request $request, string $botType)
    {
        $update = $request->all();
        \Log::info("Telegram webhook recibido [{$botType}]", ['update' => $update]);

        $message = $update['message'] ?? null;
        if (!$message) {
            return response()->json(['ok' => true]);
        }

        $chatId = $message['chat']['id'];
        $text = $message['text'] ?? '';
        $telegramId = $message['from']['id'];
        $username = $message['from']['username'] ?? null;
        $firstName = $message['from']['first_name'] ?? null;
        $lastName = $message['from']['last_name'] ?? null;

        $bot = new TelegramBotService($botType);

        if ($text === '/start') {
            return $this->handleStartCommand($chatId, $telegramId, $username, $firstName, $lastName, $botType, $bot);
        }

        $telegramUser = TelegramUser::where('telegram_id', $telegramId)
            ->where('bot_type', $botType)
            ->first();

        if (!$telegramUser || !$telegramUser->is_verified) {
            $bot->sendMessage($chatId, "⚠️ Debes vincular tu cuenta primero.\nUsa el comando /start para obtener tu código de verificación.");
            return response()->json(['ok' => true]);
        }

        $telegramUser->update(['last_interaction_at' => now()]);
        $bot->sendTypingAction($chatId);

        $response = $this->processWithAI($text, $telegramUser, $botType);
        $bot->sendMessage($chatId, $response);

        TelegramConversation::create([
            'telegram_user_id' => $telegramUser->id,
            'message_id' => $message['message_id'],
            'user_message' => $text,
            'bot_response' => $response,
        ]);

        return response()->json(['ok' => true]);
    }

    private function handleStartCommand($chatId, $telegramId, $username, $firstName, $lastName, $botType, $bot)
    {
        $telegramUser = TelegramUser::where('telegram_id', $telegramId)
            ->where('bot_type', $botType)
            ->first();

        if ($telegramUser && $telegramUser->is_verified) {
            $bot->sendMessage($chatId, "✅ Tu cuenta ya está vinculada.\n\n¿En qué puedo ayudarte?");
            return response()->json(['ok' => true]);
        }

        if (!$telegramUser) {
            try {
                $telegramUser = TelegramUser::create([
                    'user_id' => 1,
                    'telegram_id' => $telegramId,
                    'telegram_username' => $username,
                    'telegram_first_name' => $firstName,
                    'telegram_last_name' => $lastName,
                    'bot_type' => $botType,
                ]);
            } catch (\Exception $e) {
                $telegramUser = TelegramUser::where('telegram_id', $telegramId)
                    ->where('bot_type', $botType)
                    ->first();
                
                if (!$telegramUser) {
                    throw $e;
                }
            }
        }

        $code = $telegramUser->generateVerificationCode();

        $message = "👋 ¡Hola! Soy el asistente " . ($botType === 'admin' ? 'Administrador' : 'de Ventas') . " de EPOS.\n\n";
        $message .= "Para usar este bot, necesitas vincular tu cuenta.\n\n";
        $message .= "🔑 <b>Tu código de verificación es:</b> <code>{$code}</code>\n\n";
        $message .= "📱 Ingresa este código en:\n";
        $message .= "EPOS → Configuración → Telegram\n\n";
        $message .= "Una vez vinculado, podrás usar todas las funciones del bot.";

        $bot->sendMessage($chatId, $message);

        return response()->json(['ok' => true]);
    }

    private function processWithAI(string $message, TelegramUser $telegramUser, string $botType): string
    {
        $provider = config('telegram-agents.ai_provider');

        $ai = match($provider) {
            'custom' => new \App\Services\AI\CustomApiService(),
            'groq' => new \App\Services\AI\GroqService(),
            default => new OllamaService(),
        };

        if (!$ai->isAvailable()) {
            return "⚠️ El servicio de IA no está disponible en este momento.";
        }

        $previousConversations = $telegramUser->conversations()
            ->latest()
            ->take(5)
            ->get()
            ->reverse()
            ->map(fn($conv) => [
                ['role' => 'user', 'content' => $conv->user_message],
                ['role' => 'assistant', 'content' => $conv->bot_response],
            ])
            ->flatten(1)
            ->toArray();

        $messages = [
            ['role' => 'system', 'content' => config("telegram-agents.{$botType}.system_prompt")],
            ...$previousConversations,
            ['role' => 'user', 'content' => $message],
        ];

        $tools = [
            \App\Services\Functions\SearchClientFunction::definition(),
            \App\Services\Functions\SearchProductFunction::definition(),
            \App\Services\Functions\CreateSaleFunction::definition(),
            \App\Services\Functions\AuthorizeInvoiceFunction::definition(),
            \App\Services\Functions\CreateAndSendInvoiceFunction::definition(),
        ];

        try {
            $response = $ai->chat($messages, $tools);
            
            if (!empty($response['tool_calls'])) {
                return $this->handleToolCalls($response['tool_calls'], $telegramUser, $messages, $ai, $tools);
            }
            
            return $response['content'] ?? 'Sin respuesta';
        } catch (\Exception $e) {
            Log::error('AI error', ['error' => $e->getMessage()]);
            return "❌ Error al procesar tu mensaje. Por favor, intenta de nuevo.";
        }
    }

    private function handleToolCalls(array $toolCalls, TelegramUser $telegramUser, array $messages, $ai, array $tools): string
    {
        $maxIterations = 5;
        $iteration = 0;

        while ($iteration < $maxIterations) {
            foreach ($toolCalls as $toolCall) {
                $functionName = $toolCall['function']['name'];
                $arguments = json_decode($toolCall['function']['arguments'], true);

                $result = match($functionName) {
                    'search_client' => (new \App\Services\Functions\SearchClientFunction())->execute($arguments),
                    'search_product' => (new \App\Services\Functions\SearchProductFunction())->execute($arguments),
                    'create_sale' => (new \App\Services\Functions\CreateSaleFunction())->execute($arguments, $telegramUser->user_id),
                    'authorize_invoice' => (new \App\Services\Functions\AuthorizeInvoiceFunction())->execute($arguments),
                    'create_and_send_invoice' => \App\Services\Functions\CreateAndSendInvoiceFunction::execute($arguments, $telegramUser->user_id),
                    default => ['success' => false, 'message' => 'Función no encontrada'],
                };

                $messages[] = [
                    'role' => 'assistant',
                    'content' => null,
                    'tool_calls' => [$toolCall],
                ];
                $messages[] = [
                    'role' => 'tool',
                    'tool_call_id' => $toolCall['id'],
                    'content' => json_encode($result),
                ];
            }

            try {
                $finalResponse = $ai->chat($messages, $tools);
                
                if (!empty($finalResponse['tool_calls'])) {
                    $toolCalls = $finalResponse['tool_calls'];
                    $iteration++;
                    continue;
                }
                
                return $finalResponse['content'] ?? 'Operación completada';
            } catch (\Exception $e) {
                Log::error('AI error in tool response', ['error' => $e->getMessage()]);
                return "✅ Operación completada";
            }
        }

        return "✅ Operación completada";
    }
}
