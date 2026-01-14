<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Articulo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EcommerceController extends Controller
{
    public function index()
    {
        $articulos = Articulo::with(['categoria', 'marca', 'imagenes'])
            ->paginate(12);

        $articulos->getCollection()->transform(function ($articulo) {
            if ($articulo->imagenes) {
                $articulo->imagenes->transform(function ($imagen) {
                    $imagen->url = secure_asset('storage/' . $imagen->ruta);
                    return $imagen;
                });
            }
            return $articulo;
        });

        $sessionId = session()->getId();
        $userId = auth()->id();
        
        $cartCount = Cart::where(function($query) use ($userId, $sessionId) {
                if ($userId) {
                    $query->where('user_id', $userId);
                } else {
                    $query->where('session_id', $sessionId);
                }
            })
            ->sum('quantity');

        return Inertia::render('ecommerce/index', compact('articulos', 'cartCount'));
    }

    public function addToCart(Request $request, Articulo $articulo)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $sessionId = session()->getId();
        $userId = auth()->id();
        
        $cart = Cart::where('articulo_id', $articulo->id)
            ->where(function($query) use ($userId, $sessionId) {
                if ($userId) {
                    $query->where('user_id', $userId);
                } else {
                    $query->where('session_id', $sessionId);
                }
            })
            ->first();

        if ($cart) {
            $cart->quantity += $request->quantity;
            $cart->save();
        } else {
            Cart::create([
                'user_id' => $userId,
                'session_id' => $userId ? null : $sessionId,
                'articulo_id' => $articulo->id,
                'quantity' => $request->quantity,
            ]);
        }

        $cartCount = Cart::where(function($query) use ($userId, $sessionId) {
                if ($userId) {
                    $query->where('user_id', $userId);
                } else {
                    $query->where('session_id', $sessionId);
                }
            })
            ->sum('quantity');

        return back()->with(['success' => 'Producto agregado al carrito', 'cartCount' => $cartCount]);
    }

    public function cart()
    {
        $sessionId = session()->getId();
        $userId = auth()->id();
        
        $cartItems = Cart::with(['articulo', 'articulo.imagenes'])
            ->where(function($query) use ($userId, $sessionId) {
                if ($userId) {
                    $query->where('user_id', $userId);
                } else {
                    $query->where('session_id', $sessionId);
                }
            })
            ->get();

        return Inertia::render('ecommerce/cart', compact('cartItems'));
    }

    public function clearCart()
    {
        $sessionId = session()->getId();
        $userId = auth()->id();
        
        Cart::where(function($query) use ($userId, $sessionId) {
                if ($userId) {
                    $query->where('user_id', $userId);
                } else {
                    $query->where('session_id', $sessionId);
                }
            })
            ->delete();

        return redirect()->route('cart.index')->with('success', 'Carrito vaciado');
    }

    public function updateCartItem(Request $request, Cart $cartItem)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $cartItem->update(['quantity' => $request->quantity]);

        return back()->with('success', 'Cantidad actualizada');
    }

    public function removeCartItem(Cart $cartItem)
    {
        $cartItem->delete();

        return back()->with('success', 'Producto eliminado del carrito');
    }

    public function mergeSessionCart($userId, $sessionId)
    {
        $sessionCartItems = Cart::where('session_id', $sessionId)
            ->whereNull('user_id')
            ->get();

        foreach ($sessionCartItems as $sessionItem) {
            $userCartItem = Cart::where('user_id', $userId)
                ->where('articulo_id', $sessionItem->articulo_id)
                ->first();

            if ($userCartItem) {
                $userCartItem->quantity += $sessionItem->quantity;
                $userCartItem->save();
            } else {
                $sessionItem->update([
                    'user_id' => $userId,
                    'session_id' => null
                ]);
            }
        }

        Cart::where('session_id', $sessionId)
            ->whereNull('user_id')
            ->where('user_id', '!=', $userId)
            ->delete();
    }
}
