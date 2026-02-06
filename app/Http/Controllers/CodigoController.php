<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Articulo;
use App\Services\CodigoService;
use Inertia\Inertia;

class CodigoController extends Controller
{
    protected $codigoService;

    public function __construct(CodigoService $codigoService)
    {
        $this->codigoService = $codigoService;
    }

    public function generarCodigos(Articulo $articulo)
    {
        $etiqueta = $this->codigoService->generarEtiquetaCompleta($articulo);
        
        return response()->json($etiqueta);
    }

    public function generarCodigoBarras(Articulo $articulo)
    {
        $codigo = $this->codigoService->generarCodigoBarras($articulo);
        $imagen = $this->codigoService->generarImagenCodigoBarras($codigo);
        
        return response($imagen)
            ->header('Content-Type', 'image/png');
    }

    public function generarCodigoQR(Articulo $articulo)
    {
        $codigo = $this->codigoService->generarCodigoQR($articulo);
        $imagen = $this->codigoService->generarImagenQR($codigo);
        
        return response($imagen)
            ->header('Content-Type', 'image/png');
    }

    public function buscarPorCodigo(Request $request)
    {
        $codigo = $request->input('codigo');
        
        if (!$codigo) {
            return response()->json(['error' => 'Código requerido'], 400);
        }

        $articulo = $this->codigoService->buscarArticuloPorCodigo($codigo);
        
        if (!$articulo) {
            return response()->json(['error' => 'Artículo no encontrado'], 404);
        }

        return response()->json([
            'articulo' => $articulo->load(['categoria', 'marca', 'inventario'])
        ]);
    }

    public function imprimirEtiquetas(Request $request)
    {
        $articuloIds = $request->input('articulos', []);
        $etiquetas = [];

        foreach ($articuloIds as $id) {
            $articulo = Articulo::find($id);
            if ($articulo) {
                $etiquetas[] = $this->codigoService->generarEtiquetaCompleta($articulo);
            }
        }

        return Inertia::render('Codigos/ImprimirEtiquetas', [
            'etiquetas' => $etiquetas
        ]);
    }

    public function scanner()
    {
        return Inertia::render('Codigos/Scanner');
    }
}