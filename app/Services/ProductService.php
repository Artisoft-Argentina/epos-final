<?php

namespace App\Services;

use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Stock;
use App\Models\StockMovement;
use App\Models\Warehouse;
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

        $trackStock   = ! empty($data['track_stock']);
        $initialStock = (int) ($data['initial_stock'] ?? 0);
        $warehouseId  = (int) ($data['warehouse_id'] ?? 0) ?: Warehouse::getDefault()?->id;
        $data = Arr::except($data, ['initial_stock', 'track_stock', 'warehouse_id']);

        $product = Product::create($data);

        if ($trackStock && $warehouseId) {
            $this->initStock($product, $initialStock, $warehouseId);
        }

        $this->storeImages($product, $images);
        $this->syncPriceLists($product);

        return $product;
    }

    public function update(Product $product, array $data, array $images = []): void
    {
        $previousPrice = (float) $product->price;

        $product->update($data);

        // Recalcular listas solo si cambió el precio base
        if ((float) $product->fresh()->price !== $previousPrice) {
            $this->syncPriceLists($product->fresh());
        }

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

    private function syncPriceLists(Product $product): void
    {
        $lists = PriceList::where('active', true)->get();

        foreach ($lists as $list) {
            $price = round((float) $product->price * (1 + ($list->percentage / 100)), 2);
            $list->products()->syncWithoutDetaching([
                $product->id => ['price' => $price],
            ]);
        }
    }

    private function initStock(Product $product, int $quantity, int $warehouseId): void
    {
        $stock = Stock::create([
            'product_id'   => $product->id,
            'warehouse_id' => $warehouseId,
            'quantity'     => 0,
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
