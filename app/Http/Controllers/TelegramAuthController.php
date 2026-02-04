<?php

namespace App\Http\Controllers;

use App\Models\TelegramUser;
use Illuminate\Http\Request;

class TelegramAuthController extends Controller
{
    public function verify(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $telegramUser = TelegramUser::where('verification_code', $request->code)
            ->where('is_verified', false)
            ->first();

        if (!$telegramUser) {
            return back()->with('error', 'Código inválido o ya utilizado');
        }

        // Vincular con el usuario actual
        $telegramUser->update([
            'user_id' => auth()->id(),
            'is_verified' => true,
            'verification_code' => null,
        ]);

        return back()->with('success', '¡Cuenta vinculada exitosamente! Ya puedes usar el bot de Telegram.');
    }
}
