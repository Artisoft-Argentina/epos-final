<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;

class FacturaPdfController extends Controller
{
    public function generate(Sale $factura)
    {
        if (!$factura->cae) {
            return redirect()->back()->with('error', 'La factura debe estar autorizada por AFIP');
        }

        $empresa = Setting::first();

        $pdf = Pdf::loadView('pdf.factura', [
            'factura' => $factura->load(['customer', 'products']),
            'empresa' => $empresa,
        ]);

        return $pdf->download("factura-{$factura->invoice_number}.pdf");
    }
}
