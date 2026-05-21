<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProductImageController extends Controller
{
    public function __construct(
        private readonly ProductService $productService
    ) {}

    public function store(Request $request, Product $product): JsonResponse
    {
        $request->validate([
            'images.*' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        $this->productService->update($product, [], $request->file('images', []));

        return response()->json([
            'images' => $product->fresh()->images,
        ]);
    }

    public function destroy(ProductImage $image): RedirectResponse
    {
        $this->productService->deleteImage($image);

        return back()->with('success', 'Imagen eliminada correctamente.');
    }

    public function setPrimary(ProductImage $image): RedirectResponse
    {
        ProductImage::where('product_id', $image->product_id)->update(['is_primary' => false]);
        $image->update(['is_primary' => true]);

        return back()->with('success', 'Imagen principal actualizada.');
    }

    public function updateOrder(Request $request, Product $product): RedirectResponse
    {
        $request->validate([
            'images'          => 'required|array',
            'images.*.id'     => 'required|exists:product_images,id',
            'images.*.order'  => 'required|integer',
        ]);

        foreach ($request->images as $item) {
            ProductImage::where('id', $item['id'])->update(['sort_order' => $item['order']]);
        }

        return back();
    }
}
