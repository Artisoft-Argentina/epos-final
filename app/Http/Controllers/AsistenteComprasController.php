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

    public function addToInventory(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.codigo' => 'nullable|string',
            'items.*.descripcion' => 'required|string',
            'items.*.cantidad' => 'required|numeric|min:0',
            'supplier_id' => 'nullable|exists:suppliers,id',
        ]);

        $items = $request->input('items');
        $supplierId = $request->input('supplier_id');
        $added = [];
        $errors = [];

        foreach ($items as $item) {
            try {
                // Buscar artículo por código o descripción
                $articulo = \App\Models\Articulo::where('codarticulo', $item['codigo'])
                    ->orWhere('articulo', 'LIKE', '%' . $item['descripcion'] . '%')
                    ->first();

                if (!$articulo) {
                    $errors[] = "Artículo no encontrado: {$item['descripcion']}";
                    continue;
                }

                // Buscar inventario existente
                $inventario = \App\Models\Inventario::where('articulo_id', $articulo->id)
                    ->where('supplier_id', $supplierId)
                    ->first();

                if ($inventario) {
                    // Actualizar cantidad
                    $inventario->cantidad += $item['cantidad'];
                    $inventario->save();
                } else {
                    // Crear nuevo inventario
                    $inventario = \App\Models\Inventario::create([
                        'articulo_id' => $articulo->id,
                        'cantidad' => $item['cantidad'],
                        'supplier_id' => $supplierId,
                    ]);
                }

                $added[] = [
                    'articulo' => $articulo->articulo,
                    'cantidad' => $item['cantidad'],
                ];
            } catch (\Exception $e) {
                $errors[] = "Error con {$item['descripcion']}: {$e->getMessage()}";
            }
        }

        return response()->json([
            'success' => true,
            'added' => $added,
            'errors' => $errors,
        ]);
    }
}
