<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Services\CodigoService;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;

class CodigoController extends Controller
{
    public function __construct(protected CodigoService $codigoService) {}

    public function generarCodigos(Product $product)
    {
        $data = $this->codigoService->generarEtiquetaCompleta($product);

        $pdf = Pdf::loadView('pdf.etiqueta-producto', [
            'product'       => $product,
            'codigo_barras' => $data['codigo_barras'],
            'codigo_qr'     => $data['codigo_qr'],
            'imagen_barras' => $data['imagen_barras'],
            'imagen_qr'     => $data['imagen_qr'],
        ])->setPaper([0, 0, 226.77, 396.85]); // ~80x140mm vertical

        return $pdf->stream("etiqueta-{$product->sku}.pdf");
    }

    public function generarCodigoBarras(Product $product)
    {
        $codigo = $this->codigoService->generarCodigoBarras($product);
        $imagen = $this->codigoService->generarImagenCodigoBarras($codigo);

        return response($imagen)->header('Content-Type', 'image/png');
    }

    public function generarCodigoQR(Product $product)
    {
        $codigo = $this->codigoService->generarCodigoQR($product);
        $imagen = $this->codigoService->generarImagenQR($codigo);

        return response($imagen)->header('Content-Type', 'image/svg+xml');
    }

    public function buscarPorCodigo(Request $request)
    {
        $codigo = $request->input('codigo');

        if (!$codigo) {
            return response()->json(['error' => 'Código requerido'], 400);
        }

        try {
            $product = $this->codigoService->buscarArticuloPorCodigo($codigo);

            if (!$product) {
                return response()->json(['error' => 'Artículo no encontrado'], 404);
            }

            return response()->json([
                'articulo' => $product->load(['category', 'brand', 'stock', 'priceLists', 'images']),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error interno del servidor'], 500);
        }
    }

    public function imprimirEtiquetas(Request $request)
    {
        $etiquetas = collect($request->input('articulos', []))
            ->map(fn($id) => Product::find($id))
            ->filter()
            ->map(fn($product) => $this->codigoService->generarEtiquetaCompleta($product))
            ->values();

        return Inertia::render('Codigos/ImprimirEtiquetas', ['etiquetas' => $etiquetas]);
    }

    public function scanner()
    {
        return Inertia::render('Codigos/Scanner');
    }
}
