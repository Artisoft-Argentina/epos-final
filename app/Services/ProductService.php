<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Stock;
use App\Models\StockMovement;
use Illuminate\Support\Arr;

class ProductService
{
    public function __construct(
        private readonly ImageService $imageService,
        private readonly MovimientoService $movimientoService
    ) {}

    public function create(array $data, array $images = []): Product
    {
        if (empty($data['sku'])) {
            $data['sku'] = $this->generateSku();
        }

        $initialStock = $data['initial_stock'] ?? null;
        $data = Arr::except($data, ['initial_stock']);

        $product = Product::create($data);

        if ($initialStock !== null && $initialStock >= 0) {
            $this->initStock($product, (int) $initialStock);
        }

        $this->storeImages($product, $images);

        return $product;
    }

    public function update(Product $product, array $data, array $images = []): void
    {
        $product->update($data);

        $this->storeImages($product, $images);
    }

    public function toggleActive(Product $product): void
    {
        $product->update(['active' => ! $product->active]);
    }

    public function deleteImage(ProductImage $image): void
    {
        $this->imageService->deleteProductImage($image->path, $image->thumbnail_path);
        $image->delete();
    }

    /**
     * Genera el próximo SKU correlativo: ART-000001, ART-000002, ...
     */
    public function generateSku(): string
    {
        $last = Product::withTrashed()
            ->where('sku', 'like', 'ART-%')
            ->orderByDesc('sku')
            ->value('sku');

        $next = $last ? ((int) substr($last, 4)) + 1 : 1;

        return 'ART-' . str_pad($next, 6, '0', STR_PAD_LEFT);
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    private function initStock(Product $product, int $quantity): void
    {
        $stock = Stock::create([
            'product_id' => $product->id,
            'quantity'   => 0,
        ]);

        if ($quantity > 0) {
            $this->movimientoService->registrar(
                $stock,
                StockMovement::TYPE_ADJUSTMENT_ENTRY,
                $quantity,
                null,
                null,
                'Stock inicial al crear producto'
            );
        }
    }

    private function storeImages(Product $product, array $images): void
    {
        if (empty($images)) {
            return;
        }

        $currentCount = $product->images()->count();

        foreach ($images as $index => $file) {
            $result = $this->imageService->processProductImage($file, $product->id, $currentCount + $index);

            $product->images()->create([
                'filename'       => $result['filename'],
                'path'           => $result['path'],
                'thumbnail_path' => $result['thumbnail_path'],
                'is_primary'     => $currentCount === 0 && $index === 0,
                'sort_order'     => $currentCount + $index,
            ]);
        }
    }
}
