<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePaymentRequest;
use App\Models\Sale;
use App\Models\SalePayment;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function create(Sale $sale)
    {
        if ($sale->isCancelled()) {
            return redirect()->route('sales.index')->with('error', 'No se pueden registrar pagos en una venta cancelada.');
        }

        return Inertia::render('Payments/Create', [
            'factura' => $sale->load(['customer', 'payments']),
        ]);
    }

    public function store(StorePaymentRequest $request, Sale $sale)
    {
        if ($sale->isCancelled()) {
            return redirect()->route('sales.index')->with('error', 'No se pueden registrar pagos en una venta cancelada.');
        }

        $data = $request->validated();

        try {
            DB::transaction(function () use ($sale, $data, $request) {
                // Lock sobre la venta: serializa pagos concurrentes / doble submit.
                // De acá en adelante se trabaja SIEMPRE sobre $lockedSale: la
                // instancia del route binding quedó fuera del lock y sus datos
                // pueden estar desactualizados.
                $lockedSale = Sale::lockForUpdate()->findOrFail($sale->id);

                if ($lockedSale->isCancelled()) {
                    throw new \RuntimeException('No se pueden registrar pagos en una venta cancelada.');
                }

                // Saldo re-leído DESPUÉS del lock (evita sobrepago por doble submit).
                $pendingBalance = round((float) $lockedSale->total - (float) $lockedSale->payments()->sum('amount'), 2);
                $amount         = round((float) $data['amount'], 2);

                if ($amount > $pendingBalance) {
                    throw new \RuntimeException('El pago supera el saldo pendiente ($' . number_format($pendingBalance, 2) . ').');
                }

                SalePayment::create([
                    'sale_id'        => $lockedSale->id,
                    'amount'         => $amount,
                    'payment_method' => $data['payment_method'],
                    'payment_date'   => $data['payment_date'],
                    'notes'          => $data['notes'] ?? null,
                    'user_id'        => $request->user()->id,
                ]);

                $lockedSale->recalcPaymentStatus();
            });
        } catch (\RuntimeException $e) {
            return back()->withInput()->withErrors(['amount' => $e->getMessage()]);
        }

        return redirect()->route('sales.index')->with('success', 'Pago registrado exitosamente');
    }

    public function destroy(SalePayment $payment)
    {
        $sale = $payment->sale;

        if ($sale->isCancelled()) {
            return back()->with('error', 'No se pueden modificar los pagos de una venta cancelada.');
        }

        DB::transaction(function () use ($payment, $sale) {
            $lockedSale = Sale::lockForUpdate()->findOrFail($sale->id);
            $payment->delete();
            $lockedSale->recalcPaymentStatus();
        });

        return redirect()->route('sales.index')->with('success', 'Pago eliminado exitosamente');
    }
}
