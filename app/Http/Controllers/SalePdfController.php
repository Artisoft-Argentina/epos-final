<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;

class SalePdfController extends Controller
{
    public function generate(Sale $sale)
    {
        if (!$sale->cae) {
            return redirect()->back()->with('error', 'La factura debe estar autorizada por AFIP');
        }

        $empresa = Setting::first();

        $pdf = Pdf::loadView('pdf.factura', [
            'factura' => $sale->load(['customer', 'products']),
            'empresa' => $empresa,
        ]);

        return $pdf->download("factura-{$sale->invoice_number}.pdf");
    }
}
