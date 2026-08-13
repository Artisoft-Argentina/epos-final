<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePaymentRequest;
use App\Models\Sale;
use App\Models\SalePayment;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PagoController extends Controller
{
    public function create(Sale $factura)
    {
        if ($factura->isCancelled()) {
            return redirect()->route('ventas.index')->with('error', 'No se pueden registrar pagos en una venta cancelada.');
        }

        return Inertia::render('Pagos/Create', [
            'factura' => $factura->load(['customer', 'payments']),
        ]);
    }

    public function store(StorePaymentRequest $request, Sale $factura)
    {
        if ($factura->isCancelled()) {
            return redirect()->route('ventas.index')->with('error', 'No se pueden registrar pagos en una venta cancelada.');
        }

        $data = $request->validated();

        try {
            DB::transaction(function () use ($factura, $data, $request) {
                // Lock sobre la venta: serializa pagos concurrentes / doble submit.
                $sale = Sale::lockForUpdate()->findOrFail($factura->id);

                if ($sale->isCancelled()) {
                    throw new \RuntimeException('No se pueden registrar pagos en una venta cancelada.');
                }

                // Saldo re-leído DESPUÉS del lock (evita sobrepago por doble submit).
                $pendingBalance = round((float) $sale->total - (float) $sale->payments()->sum('amount'), 2);
                $amount         = round((float) $data['amount'], 2);

                if ($amount > $pendingBalance) {
                    throw new \RuntimeException('El pago supera el saldo pendiente ($' . number_format($pendingBalance, 2) . ').');
                }

                SalePayment::create([
                    'sale_id'        => $sale->id,
                    'amount'         => $amount,
                    'payment_method' => $data['payment_method'],
                    'payment_date'   => $data['payment_date'],
                    'notes'          => $data['notes'] ?? null,
                    'user_id'        => $request->user()->id,
                ]);

                $sale->recalcPaymentStatus();
            });
        } catch (\RuntimeException $e) {
            return back()->withInput()->withErrors(['amount' => $e->getMessage()]);
        }

        return redirect()->route('ventas.index')->with('success', 'Pago registrado exitosamente');
    }

    public function destroy(SalePayment $pago)
    {
        $sale = $pago->sale;

        if ($sale->isCancelled()) {
            return back()->with('error', 'No se pueden modificar los pagos de una venta cancelada.');
        }

        DB::transaction(function () use ($pago, $sale) {
            $lockedSale = Sale::lockForUpdate()->findOrFail($sale->id);
            $pago->delete();
            $lockedSale->recalcPaymentStatus();
        });

        return redirect()->route('ventas.index')->with('success', 'Pago eliminado exitosamente');
    }
}
