<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Factura;
use App\Models\FacturaPago;
use App\Models\Cliente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\MercadoPagoConfig;

class CheckoutController extends Controller
{
    public function index()
    {
        if (!auth()->check()) {
            // Guardar URL de retorno y redirigir a login
            session(['url.intended' => route('checkout.index')]);
            return redirect()->route('login')->with('message', 'Inicia sesión para continuar con tu compra');
        }

        $sessionId = session()->getId();
        $userId = auth()->id();

        $cartItems = Cart::with(['articulo', 'articulo.imagenes'])
            ->where(function ($query) use ($userId, $sessionId) {
                if ($userId) {
                    $query->where('user_id', $userId);
                } else {
                    $query->where('session_id', $sessionId);
                }
            })
            ->get();

        if ($cartItems->isEmpty()) {
            return redirect()->route('cart.index')->with('error', 'Tu carrito está vacío');
        }

        $total = $cartItems->sum(function ($cartItem) {
            return $cartItem->articulo->precio * $cartItem->quantity;
        });

        $publicKey = env('MERCADOPAGO_PUBLIC_KEY');

        return Inertia::render('ecommerce/checkout', compact('cartItems', 'total', 'publicKey'));
    }

    public function createPayment(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'payment_method_id' => 'required|string',
            'installments' => 'required|integer|min:1',
            'issuer_id' => 'nullable',
        ]);

        if (!auth()->check()) {
            return redirect()->route('login')->with('error', 'Debes iniciar sesión para realizar el pago');
        }

        try {
            MercadoPagoConfig::setAccessToken(env('MERCADOPAGO_ACCESS_TOKEN'));

            $sessionId = session()->getId();
            $userId = auth()->id();

            $cartItems = Cart::with(['articulo', 'articulo.imagenes'])
                ->where(function ($query) use ($userId, $sessionId) {
                    if ($userId) {
                        $query->where('user_id', $userId);
                    } else {
                        $query->where('session_id', $sessionId);
                    }
                })
                ->get();

            $total = $cartItems->sum(function ($cartItem) {
                return $cartItem->articulo->precio * $cartItem->quantity;
            });

            $userEmail = auth()->user()->email;
            $client = Cliente::where('email', $userEmail)->first();
            
            if (!$client) {
                $client = Cliente::create([
                    'razonsocial' => auth()->user()->name,
                    'email' => $userEmail,
                ]);
            }

            $factura = Factura::create([
                'user_id' => $userId,
                'cliente_id' => $client->id,
                'numfactura' => time() + $userId,
                'ptoventa' => 1,
                'codcomprobante' => 6,
                'letracomprobante' => 'B',
                'cuit' => $client->documentounico ?? 0,
                'total' => $total,
                'subtotal' => $total,
                'bonificacion' => 0,
                'recargo' => 0,
                'descuento' => 0,
                'pagada' => 'NO',
                'condicionventa' => 'Contado',
                'tipo_venta' => 'ecommerce',
                'fecha' => now()->format('Y-m-d'),
            ]);

            foreach ($cartItems as $cartItem) {
                $factura->articulos()->attach($cartItem->articulo_id, [
                    'codprov' => '',
                    'codarticulo' => $cartItem->articulo->codarticulo ?? '',
                    'articulo' => $cartItem->articulo->articulo,
                    'medida' => $cartItem->articulo->medida ?? 'UN',
                    'cantidad' => $cartItem->quantity,
                    'bonificacion' => 0,
                    'alicuota' => $cartItem->articulo->alicuota ?? 21,
                    'preciounitario' => $cartItem->articulo->precio,
                    'subtotal' => $cartItem->quantity * $cartItem->articulo->precio,
                ]);
            }

            $payment = [
                'transaction_amount' => (float) $total,
                'token' => $request->token,
                'description' => 'Compra en tienda online',
                'installments' => (int) $request->installments,
                'payment_method_id' => $request->payment_method_id,
                'external_reference' => (string) $factura->id,
                'payer' => [
                    'email' => auth()->user()->email,
                ],
            ];

            if ($request->filled('issuer_id')) {
                $payment['issuer_id'] = $request->issuer_id;
            }

            $client = new PaymentClient;
            $createdPayment = $client->create($payment);

            if ($createdPayment->status === 'approved') {
                // Crear el pago completo
                FacturaPago::create([
                    'factura_id' => $factura->id,
                    'monto' => $total,
                    'metodo_pago' => 'MercadoPago',
                    'fecha_pago' => now()->format('Y-m-d'),
                    'observaciones' => 'Pago ecommerce - ID: ' . $createdPayment->id,
                ]);

                // Cambiar estado de factura a pagada
                $factura->update(['pagada' => 'SI']);

                Cart::where(function ($query) use ($userId, $sessionId) {
                    if ($userId) {
                        $query->where('user_id', $userId);
                    } else {
                        $query->where('session_id', $sessionId);
                    }
                })->delete();

                return redirect()->route('checkout.success', ['payment_id' => $createdPayment->id]);
            }

            if ($createdPayment->status === 'pending') {
                return redirect()->route('checkout.pending', ['payment_id' => $createdPayment->id]);
            }

            return redirect()->route('checkout.failure', ['status_detail' => $createdPayment->status_detail]);

        } catch (\Exception $e) {
            Log::error('Error en pago', [
                'message' => $e->getMessage(),
                'user_id' => $userId ?? null,
            ]);

            return redirect()->route('checkout.failure')->with('error', 'Error al procesar el pago: ' . $e->getMessage());
        }
    }

    public function success(Request $request)
    {
        return Inertia::render('ecommerce/payment-success', [
            'payment_id' => $request->get('payment_id'),
        ]);
    }

    public function failure(Request $request)
    {
        return Inertia::render('ecommerce/payment-failure', [
            'error' => session('error') ?: 'Error al procesar el pago',
        ]);
    }

    public function pending(Request $request)
    {
        return Inertia::render('ecommerce/payment-pending', [
            'payment_id' => $request->get('payment_id'),
        ]);
    }

    public function getPaymentStatus($paymentId)
    {
        try {
            MercadoPagoConfig::setAccessToken(env('MERCADOPAGO_ACCESS_TOKEN'));
            
            $client = new PaymentClient();
            $payment = $client->get($paymentId);
            
            return response()->json([
                'id' => $payment->id,
                'status' => $payment->status,
                'status_detail' => $payment->status_detail,
                'transaction_amount' => $payment->transaction_amount,
                'external_reference' => $payment->external_reference,
                'date_created' => $payment->date_created,
                'date_approved' => $payment->date_approved,
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'No se pudo consultar el pago',
                'message' => $e->getMessage()
            ], 404);
        }
    }
}
