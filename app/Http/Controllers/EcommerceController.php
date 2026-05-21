<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EcommerceController extends Controller
{
    public function index()
    {
        $articulos = Product::with(['category', 'brand', 'images' => fn($q) => $q->reorder()->orderByDesc('is_primary')->orderBy('sort_order')])->paginate(12);

        $cartCount = $this->getCartCount();

        return Inertia::render('ecommerce/index', compact('articulos', 'cartCount'));
    }

    public function show(Product $articulo)
    {
        $articulo->load(['category', 'brand', 'images' => fn($q) => $q->reorder()->orderByDesc('is_primary')->orderBy('sort_order')]);

        $relacionados = Product::with(['images' => fn($q) => $q->reorder()->orderByDesc('is_primary')->orderBy('sort_order')])
            ->where('category_id', $articulo->category_id)
            ->where('id', '!=', $articulo->id)
            ->limit(4)
            ->get();

        $cartCount = $this->getCartCount();

        return Inertia::render('ecommerce/show', compact('articulo', 'relacionados', 'cartCount'));
    }

    public function addToCart(Request $request, Product $articulo)
    {
        $request->validate(['quantity' => 'required|integer|min:1']);

        $sessionId = session()->getId();
        $userId    = auth()->id();

        $cart = Cart::where('product_id', $articulo->id)
            ->where(function ($q) use ($userId, $sessionId) {
                $userId ? $q->where('user_id', $userId) : $q->where('session_id', $sessionId);
            })
            ->first();

        if ($cart) {
            $cart->increment('quantity', $request->quantity);
        } else {
            Cart::create([
                'user_id'    => $userId,
                'session_id' => $userId ? null : $sessionId,
                'product_id' => $articulo->id,
                'quantity'   => $request->quantity,
            ]);
        }

        $cartCount = $this->getCartCount();

        return back()->with(['success' => 'Producto agregado al carrito', 'cartCount' => $cartCount]);
    }

    public function cart()
    {
        $sessionId = session()->getId();
        $userId    = auth()->id();

        $cartItems = Cart::with(['product', 'product.images'])
            ->where(function ($q) use ($userId, $sessionId) {
                $userId ? $q->where('user_id', $userId) : $q->where('session_id', $sessionId);
            })
            ->get();

        return Inertia::render('ecommerce/cart', compact('cartItems'));
    }

    public function clearCart()
    {
        $sessionId = session()->getId();
        $userId    = auth()->id();

        Cart::where(function ($q) use ($userId, $sessionId) {
            $userId ? $q->where('user_id', $userId) : $q->where('session_id', $sessionId);
        })->delete();

        return redirect()->route('cart.index')->with('success', 'Carrito vaciado');
    }

    public function updateCartItem(Request $request, Cart $cartItem)
    {
        $this->authorizeCartItem($cartItem);
        $request->validate(['quantity' => 'required|integer|min:1']);
        $cartItem->update(['quantity' => $request->quantity]);

        return back()->with('success', 'Cantidad actualizada');
    }

    public function removeCartItem(Cart $cartItem)
    {
        $this->authorizeCartItem($cartItem);
        $cartItem->delete();

        return back()->with('success', 'Producto eliminado del carrito');
    }

    private function getCartCount(): int
    {
        $sessionId = session()->getId();
        $userId    = auth()->id();

        return Cart::where(function ($q) use ($userId, $sessionId) {
            $userId ? $q->where('user_id', $userId) : $q->where('session_id', $sessionId);
        })->sum('quantity');
    }

    private function authorizeCartItem(Cart $cartItem): void
    {
        $userId    = auth()->id();
        $sessionId = session()->getId();

        if ($userId) {
            if ($cartItem->user_id !== $userId) abort(403);
        } else {
            if ($cartItem->session_id !== $sessionId) abort(403);
        }
    }

    public function mergeSessionCart(int $userId, string $sessionId): void
    {
        $sessionItems = Cart::where('session_id', $sessionId)->whereNull('user_id')->get();

        foreach ($sessionItems as $item) {
            $existing = Cart::where('user_id', $userId)->where('product_id', $item->product_id)->first();

            if ($existing) {
                $existing->increment('quantity', $item->quantity);
                $item->delete();
            } else {
                $item->update(['user_id' => $userId, 'session_id' => null]);
            }
        }
    }
}
