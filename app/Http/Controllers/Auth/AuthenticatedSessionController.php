<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $sessionId = $request->session()->getId();
        
        $request->authenticate();

        $request->session()->regenerate();
        
        // Fusionar carrito de sesión con carrito de usuario
        $userId = auth()->id();
        $sessionCartItems = \App\Models\Cart::where('session_id', $sessionId)
            ->whereNull('user_id')
            ->get();

        foreach ($sessionCartItems as $sessionItem) {
            $userCartItem = \App\Models\Cart::where('user_id', $userId)
                ->where('articulo_id', $sessionItem->articulo_id)
                ->first();

            if ($userCartItem) {
                $userCartItem->quantity += $sessionItem->quantity;
                $userCartItem->save();
                $sessionItem->delete();
            } else {
                $sessionItem->update([
                    'user_id' => $userId,
                    'session_id' => null
                ]);
            }
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
