<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TelegramUser extends Model
{
    protected $fillable = [
        'user_id',
        'telegram_id',
        'telegram_username',
        'telegram_first_name',
        'telegram_last_name',
        'bot_type',
        'verification_code',
        'is_verified',
        'is_active',
        'last_interaction_at',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'is_active' => 'boolean',
        'last_interaction_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(TelegramConversation::class);
    }

    public function generateVerificationCode(): string
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $this->update(['verification_code' => $code]);
        return $code;
    }

    public function verify(): void
    {
        $this->update([
            'is_verified' => true,
            'verification_code' => null,
        ]);
    }
}
