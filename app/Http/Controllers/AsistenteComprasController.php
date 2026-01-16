<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\PdfProcessorService;

class AsistenteComprasController extends Controller
{
    private PdfProcessorService $pdfProcessor;

    public function __construct(PdfProcessorService $pdfProcessor)
    {
        $this->pdfProcessor = $pdfProcessor;
    }

    public function index()
    {
        return Inertia::render('AsistenteCompras/Index');
    }

    public function processPdf(Request $request)
    {
        $request->validate([
            'pdf' => 'required|file|mimes:pdf|max:10240',
        ]);

        $file = $request->file('pdf');
        $fullPath = $file->getRealPath();

        try {
            $result = $this->pdfProcessor->extractAndProcess($fullPath);

            if (isset($result['error'])) {
                return response()->json([
                    'success' => false,
                    'error' => $result['error'],
                ], 400);
            }

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al procesar el PDF: ' . $e->getMessage(),
            ], 500);
        }
    }
}
