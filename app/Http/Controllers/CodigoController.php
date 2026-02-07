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
            ->header('Content-Type', 'image/svg+xml');
    }

    public function buscarPorCodigo(Request $request)
    {
        \Log::info('Scanner: Búsqueda iniciada', ['codigo' => $request->input('codigo')]);
        
        $codigo = $request->input('codigo');
        
        if (!$codigo) {
            \Log::warning('Scanner: Código vacío');
            return response()->json(['error' => 'Código requerido'], 400);
        }

        try {
            $articulo = $this->codigoService->buscarArticuloPorCodigo($codigo);
            
            if (!$articulo) {
                \Log::info('Scanner: Artículo no encontrado', ['codigo' => $codigo]);
                return response()->json(['error' => 'Artículo no encontrado'], 404);
            }

            \Log::info('Scanner: Artículo encontrado', ['id' => $articulo->id, 'nombre' => $articulo->articulo]);
            
            return response()->json([
                'articulo' => $articulo->load(['categoria', 'marca', 'inventario', 'listasPrecios', 'imagenes'])
            ]);
        } catch (\Exception $e) {
            \Log::error('Scanner: Error en búsqueda', ['error' => $e->getMessage(), 'codigo' => $codigo]);
            return response()->json(['error' => 'Error interno del servidor'], 500);
        }
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