<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SalePayment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PagoController extends Controller
{
    public function create(Sale $factura)
    {
        return Inertia::render('Pagos/Create', [
            'factura' => $factura->load(['customer', 'payments']),
        ]);
    }

    public function store(Request $request, Sale $factura)
    {
        $pendingBalance = $factura->total - $factura->payments->sum('amount');

        $request->validate([
            'amount'         => 'required|numeric|min:1|max:' . $pendingBalance,
            'payment_method' => 'required|string',
            'payment_date'   => 'required|date',
            'notes'          => 'nullable|string',
        ]);

        SalePayment::create([
            'sale_id'        => $factura->id,
            'amount'         => $request->amount,
            'payment_method' => $request->payment_method,
            'payment_date'   => $request->payment_date,
            'notes'          => $request->notes,
        ]);

        $factura->load('payments');
        $totalPaid      = $factura->payments->sum('amount');
        $pendingBalance = $factura->total - $totalPaid;

        $factura->update(['payment_status' => $pendingBalance <= 0 ? 'SI' : 'NO']);

        return redirect()->route('ventas.index')->with('success', 'Pago registrado exitosamente');
    }

    public function destroy(SalePayment $pago)
    {
        $sale = $pago->sale;
        $pago->delete();

        $sale->load('payments');
        $totalPaid      = $sale->payments->sum('amount');
        $pendingBalance = $sale->total - $totalPaid;

        $sale->update(['payment_status' => $pendingBalance <= 0 ? 'SI' : 'NO']);

        return redirect()->route('ventas.index')->with('success', 'Pago eliminado exitosamente');
    }
}
