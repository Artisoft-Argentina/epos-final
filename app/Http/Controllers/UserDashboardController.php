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

        // Las ventas canceladas se listan (trazabilidad) pero no facturan ni
        // adeudan: lo pagado ya se acreditó al crédito del cliente. El resumen
        // tiene que dar lo mismo que el estado de cuenta del admin.
        $ventasVigentes = $sales->reject(fn ($sale) => $sale->isCancelled());

        $totalCompras    = (float) $ventasVigentes->sum('total');
        $totalPagado     = (float) $ventasVigentes->sum(fn ($s) => $s->payments->sum('amount'));
        $saldoPendiente  = round($totalCompras - $totalPagado, 2);

        $entregasPendientes = $sales->flatMap(fn($s) => $s->deliveries)
            ->where('status', 'pending')
            ->count();

        return Inertia::render('user-dashboard', [
            'facturas' => $sales->map(fn($sale) => [
                'id'              => $sale->id,
                'numero'          => $sale->invoice_number,
                'fecha'           => $sale->date,
                'total'           => (float) $sale->total,
                'pagada'          => $sale->payment_status?->value,
                'total_pagado'    => (float) $sale->payments->sum('amount'),
                // Una venta cancelada no deja saldo a cobrar.
                'saldo_pendiente' => $sale->isCancelled()
                    ? 0.0
                    : round((float) $sale->total - (float) $sale->payments->sum('amount'), 2),
                'cancelada'       => $sale->isCancelled(),
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
                'total_compras'       => $totalCompras,
                'total_pagado'        => $totalPagado,
                'saldo_pendiente'     => $saldoPendiente,
                'credito'             => (float) $customer->credit,
                'entregas_pendientes' => $entregasPendientes,
                'total_facturas'      => $ventasVigentes->count(),
            ],
            'cliente' => [
                'nombre' => $customer->business_name,
                'email'  => $customer->email,
            ],
        ]);
    }
}
