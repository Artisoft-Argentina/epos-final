<?php

namespace App\Http\Controllers;

use App\Models\Articulo;
use App\Models\ArticuloImagen;
use App\Services\ImageService;
use Illuminate\Http\Request;

class ArticuloImagenController extends Controller
{
    public function __construct(
        protected ImageService $imageService
    ) {}

    public function store(Request $request, Articulo $articulo)
    {
        $request->validate([
            'imagenes.*' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120'
        ]);

        $imagenes = [];

        foreach ($request->file('imagenes') as $index => $imagen) {
            $resultado = $this->imageService->processArticuloImage($imagen, $articulo->id, $index);

            $articuloImagen = ArticuloImagen::create([
                'articulo_id' => $articulo->id,
                'nombre_archivo' => $resultado['nombre_archivo'],
                'ruta' => $resultado['ruta'],
                'ruta_thumb' => $resultado['ruta_thumb'],
                'es_principal' => $index === 0 && $articulo->imagenes()->count() === 0,
                'orden' => $articulo->imagenes()->count() + $index
            ]);

            $imagenes[] = $articuloImagen;
        }

        return response()->json(['imagenes' => $imagenes]);
    }

    public function destroy(ArticuloImagen $imagen)
    {
        $this->imageService->deleteArticuloImage($imagen->ruta, $imagen->ruta_thumb);
        $imagen->delete();

        return back();
    }

    public function setPrincipal(ArticuloImagen $imagen)
    {
        ArticuloImagen::where('articulo_id', $imagen->articulo_id)
                     ->update(['es_principal' => false]);

        $imagen->update(['es_principal' => true]);

        return back();
    }

    public function updateOrder(Request $request, Articulo $articulo)
    {
        $request->validate([
            'imagenes' => 'required|array',
            'imagenes.*.id' => 'required|exists:articulo_imagenes,id',
            'imagenes.*.orden' => 'required|integer'
        ]);

        foreach ($request->imagenes as $imagenData) {
            ArticuloImagen::where('id', $imagenData['id'])
                         ->update(['orden' => $imagenData['orden']]);
        }

        return back();
    }
}
