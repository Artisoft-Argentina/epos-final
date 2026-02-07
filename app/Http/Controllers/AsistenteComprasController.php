<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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
        // Log para debugging
        Log::info('Request recibido', [
            'has_file' => $request->hasFile('file'),
            'files' => array_keys($request->allFiles()),
            'file_valid' => $request->hasFile('file') && $request->file('file')->isValid(),
        ]);

        try {
            $request->validate([
                'file' => 'required|file|max:10240|mimes:pdf,jpeg,jpg,png,gif,bmp,tiff',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validación fallida', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'error' => 'Error de validación',
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        }

        $file = $request->file('file');
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
            Log::error('Error procesando archivo', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Error al procesar el archivo: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function addToInventory(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.articulo_id' => 'required|exists:articulos,id',
            'items.*.cantidad' => 'required|numeric|min:0',
            'supplier_id' => 'nullable|exists:suppliers,id',
        ]);

        $items = $request->input('items');
        $supplierId = $request->input('supplier_id');
        $added = [];
        $errors = [];

        foreach ($items as $item) {
            try {
                $articulo = \App\Models\Articulo::find($item['articulo_id']);
                
                if (!$articulo) {
                    $errors[] = "Artículo no encontrado: ID {$item['articulo_id']}";
                    continue;
                }

                $inventario = \App\Models\Inventario::firstOrCreate(
                    ['articulo_id' => $articulo->id],
                    ['cantidad' => 0]
                );

                $inventario->cantidad += $item['cantidad'];
                $inventario->save();

                $added[] = [
                    'articulo' => $articulo->articulo,
                    'cantidad' => $item['cantidad'],
                ];
            } catch (\Exception $e) {
                $errors[] = "Error: {$e->getMessage()}";
            }
        }

        return response()->json([
            'success' => true,
            'added' => $added,
            'errors' => $errors,
        ]);
    }
}
