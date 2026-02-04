<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TelegramConversation extends Model
{
    protected $fillable = [
        'telegram_user_id',
        'message_id',
        'user_message',
        'bot_response',
        'context',
        'function_called',
        'function_result',
        'tokens_used',
        'response_time_ms',
    ];

    protected $casts = [
        'context' => 'array',
        'function_result' => 'array',
    ];

    public function telegramUser(): BelongsTo
    {
        return $this->belongsTo(TelegramUser::class);
    }
}
