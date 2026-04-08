<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\InitialSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MercadoPagoController extends Controller
{
    public function index()
    {
        $empresa = InitialSetting::first();

        return Inertia::render('settings/mercadopago', [
            'config' => [
                'public_key'  => $empresa?->mp_public_key,
                'ambiente'    => $empresa?->mp_ambiente ?? 'sandbox',
                'configured'  => !empty($empresa?->mp_access_token),
                // Nunca enviar el access_token completo al frontend
                'token_hint'  => $empresa?->mp_access_token
                    ? substr($empresa->mp_access_token, 0, 8) . '...' . substr($empresa->mp_access_token, -4)
                    : null,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'access_token' => 'required|string|min:10',
            'public_key'   => 'required|string|min:10',
            'ambiente'     => 'required|in:sandbox,production',
        ]);

        $empresa = InitialSetting::firstOrFail();
        $empresa->update([
            'mp_access_token' => $request->access_token,
            'mp_public_key'   => $request->public_key,
            'mp_ambiente'     => $request->ambiente,
        ]);

        return back()->with('success', 'Configuración de MercadoPago guardada correctamente');
    }
}
