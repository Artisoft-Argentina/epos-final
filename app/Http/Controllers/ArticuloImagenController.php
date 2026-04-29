<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ImageService;
use Illuminate\Http\Request;

class ArticuloImagenController extends Controller
{
    public function __construct(
        protected ImageService $imageService
    ) {}

    public function store(Request $request, Product $articulo)
    {
        $request->validate([
            'imagenes.*' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120'
        ]);

        $images = [];

        foreach ($request->file('imagenes') as $index => $imagen) {
            $resultado = $this->imageService->processProductImage($imagen, $articulo->id, $index);

            $image = ProductImage::create([
                'product_id'     => $articulo->id,
                'filename'       => $resultado['filename'],
                'path'           => $resultado['path'],
                'thumbnail_path' => $resultado['thumbnail_path'],
                'is_primary'     => $index === 0 && $articulo->images()->count() === 0,
                'sort_order'     => $articulo->images()->count() + $index,
            ]);

            $images[] = $image;
        }

        return response()->json(['imagenes' => $images]);
    }

    public function destroy(ProductImage $imagen)
    {
        $this->imageService->deleteProductImage($imagen->path, $imagen->thumbnail_path);
        $imagen->delete();

        return back();
    }

    public function setPrincipal(ProductImage $imagen)
    {
        ProductImage::where('product_id', $imagen->product_id)->update(['is_primary' => false]);
        $imagen->update(['is_primary' => true]);

        return back();
    }

    public function updateOrder(Request $request, Product $articulo)
    {
        $request->validate([
            'imagenes' => 'required|array',
            'imagenes.*.id' => 'required|exists:product_images,id',
            'imagenes.*.orden' => 'required|integer'
        ]);

        foreach ($request->imagenes as $imagenData) {
            ProductImage::where('id', $imagenData['id'])->update(['sort_order' => $imagenData['orden']]);
        }

        return back();
    }
}
