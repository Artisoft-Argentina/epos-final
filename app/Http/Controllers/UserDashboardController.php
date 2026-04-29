<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user     = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return Inertia::render('user-dashboard', [
                'facturas' => [],
                'resumen'  => [
                    'total_compras'      => 0,
                    'total_pagado'       => 0,
                    'saldo_pendiente'    => 0,
                    'entregas_pendientes'=> 0,
                    'total_facturas'     => 0,
                ],
                'mensaje' => 'No hay un cliente vinculado a tu cuenta. Contacta al administrador.',
            ]);
        }

        $sales = Sale::with(['products', 'payments', 'deliveries'])
            ->where('customer_id', $customer->id)
            ->orderBy('date', 'desc')
            ->get();

        $totalCompras    = $sales->sum('total');
        $totalPagado     = $sales->sum(fn($s) => $s->payments->sum('amount'));
        $saldoPendiente  = $totalCompras - $totalPagado;

        $entregasPendientes = $sales->flatMap(fn($s) => $s->deliveries)
            ->where('status', 'pending')
            ->count();

        return Inertia::render('user-dashboard', [
            'facturas' => $sales->map(fn($sale) => [
                'id'              => $sale->id,
                'numero'          => $sale->invoice_number,
                'fecha'           => $sale->date,
                'total'           => (float) $sale->total,
                'pagada'          => $sale->payment_status,
                'total_pagado'    => (float) $sale->payments->sum('amount'),
                'saldo_pendiente' => (float) ($sale->total - $sale->payments->sum('amount')),
                'articulos'       => $sale->products->map(fn($p) => [
                    'nombre'   => $p->name,
                    'cantidad' => (int) $p->pivot->quantity,
                    'precio'   => (float) $p->pivot->unit_price,
                    'subtotal' => (float) $p->pivot->subtotal,
                ]),
                'pagos'    => $sale->payments->map(fn($p) => [
                    'fecha'  => $p->payment_date,
                    'monto'  => (float) $p->amount,
                    'metodo' => $p->payment_method,
                ]),
                'entregas' => $sale->deliveries->map(fn($d) => [
                    'fecha'  => $d->delivery_date,
                    'estado' => $d->status,
                ]),
            ]),
            'resumen' => [
                'total_compras'       => (float) $totalCompras,
                'total_pagado'        => (float) $totalPagado,
                'saldo_pendiente'     => (float) $saldoPendiente,
                'entregas_pendientes' => $entregasPendientes,
                'total_facturas'      => $sales->count(),
            ],
            'cliente' => [
                'nombre' => $customer->business_name,
                'email'  => $customer->email,
            ],
        ]);
    }
}
