<?php

namespace App\Services;

use App\Models\PriceHistory;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PriceService
{
    /**
     * Calcula el precio de un producto en una lista según la pricing_strategy.
     */
    public function resolvePrice(Product $product, PriceList $priceList): float
    {
        $markup = $priceList->pricing_strategy === 'product'
            ? ($product->markup_percent ?? $priceList->percentage)
            : $priceList->percentage;

        return round((float) $product->cost * (1 + ($markup / 100)), 2);
    }

    /**
     * Genera precios en todas las listas activas para un producto recién creado.
     */
    public function generateForProduct(Product $product): void
    {
        $lists = PriceList::where('active', true)->get();

        $sync = [];
        foreach ($lists as $list) {
            $sync[$list->id] = [
                'price'     => $this->resolvePrice($product, $list),
                'is_manual' => false,
            ];
        }

        $product->priceLists()->syncWithoutDetaching($sync);
    }

    /**
     * Recalcula masivamente los precios de una lista.
     *
     * @param string $strategy 'all' = sobreescribe manuales | 'auto_only' = respeta manuales
     */
    public function recalculateList(PriceList $priceList, string $strategy, ?User $user = null): void
    {
        $products = Product::where('active', true)->get();

        DB::transaction(function () use ($priceList, $products, $strategy, $user) {
            foreach ($products as $product) {
                $pivot = DB::table('price_list_products')
                    ->where('product_id', $product->id)
                    ->where('price_list_id', $priceList->id)
                    ->first();

                // auto_only: respetar precios editados a mano
                if ($strategy === 'auto_only' && $pivot && $pivot->is_manual) {
                    continue;
                }

                $newPrice     = $this->resolvePrice($product, $priceList);
                $oldPrice     = $pivot ? (float) $pivot->price : 0.0;
                $priceChanged = ! $pivot || ! $this->sameMoney($oldPrice, $newPrice);
                // strategy 'all' debe resetear is_manual aunque el precio no cambie
                $needsManualReset = $strategy === 'all' && $pivot && $pivot->is_manual;

                if ($pivot && ! $priceChanged && ! $needsManualReset) {
                    continue;
                }

                $priceList->products()->syncWithoutDetaching([
                    $product->id => [
                        'price'     => $newPrice,
                        'is_manual' => false,
                    ],
                ]);

                if ($user && $priceChanged) {
                    PriceHistory::create([
                        'product_id'    => $product->id,
                        'price_list_id' => $priceList->id,
                        'type'          => 'bulk_recalculation',
                        'old_value'     => $oldPrice,
                        'new_value'     => $newPrice,
                        'user_id'       => $user->id,
                    ]);
                }
            }
        });
    }

    /**
     * Actualiza el costo de un producto y recalcula precios no-manuales en todas las listas.
     */
    public function updateCost(Product $product, float $newCost, ?User $user = null): void
    {
        $oldCost = (float) $product->cost;

        if ($this->sameMoney($oldCost, $newCost)) {
            return;
        }

        DB::transaction(function () use ($product, $oldCost, $newCost, $user) {
            $product->update(['cost' => $newCost]);

            if ($user) {
                PriceHistory::create([
                    'product_id'    => $product->id,
                    'price_list_id' => null,
                    'type'          => 'cost_update',
                    'old_value'     => $oldCost,
                    'new_value'     => $newCost,
                    'user_id'       => $user->id,
                ]);
            }

            $this->recalculateProductNonManual($product->fresh(), $user);
        });
    }

    /**
     * Recalcula los precios no-manuales de un producto en todas las listas activas.
     * Se usa cuando cambia el `markup_percent` del producto (del que dependen las
     * listas con strategy 'product') sin que haya cambiado el costo.
     */
    public function recalculateProductPrices(Product $product, ?User $user = null): void
    {
        DB::transaction(function () use ($product, $user) {
            $this->recalculateProductNonManual($product, $user);
        });
    }

    /**
     * Recorre las listas activas y recalcula el precio no-manual del producto.
     * Asume que $product ya tiene el costo/markup actualizados.
     */
    private function recalculateProductNonManual(Product $product, ?User $user): void
    {
        $lists = PriceList::where('active', true)->get();

        foreach ($lists as $list) {
            $pivot = DB::table('price_list_products')
                ->where('product_id', $product->id)
                ->where('price_list_id', $list->id)
                ->first();

            if (! $pivot || $pivot->is_manual) {
                continue;
            }

            $oldPrice = (float) $pivot->price;
            $newPrice = $this->resolvePrice($product, $list);

            if ($this->sameMoney($oldPrice, $newPrice)) {
                continue;
            }

            $list->products()->syncWithoutDetaching([
                $product->id => ['price' => $newPrice],
            ]);

            if ($user) {
                PriceHistory::create([
                    'product_id'    => $product->id,
                    'price_list_id' => $list->id,
                    'type'          => 'bulk_recalculation',
                    'old_value'     => $oldPrice,
                    'new_value'     => $newPrice,
                    'user_id'       => $user->id,
                ]);
            }
        }
    }

    /**
     * Guarda un precio custom para un producto en una lista y lo marca como manual.
     */
    public function overridePrice(Product $product, PriceList $priceList, float $price, User $user): void
    {
        $pivot = DB::table('price_list_products')
            ->where('product_id', $product->id)
            ->where('price_list_id', $priceList->id)
            ->first();

        $oldPrice = $pivot ? (float) $pivot->price : 0.0;

        $priceList->products()->syncWithoutDetaching([
            $product->id => [
                'price'     => $price,
                'is_manual' => true,
            ],
        ]);

        PriceHistory::create([
            'product_id'    => $product->id,
            'price_list_id' => $priceList->id,
            'type'          => 'price_override',
            'old_value'     => $oldPrice,
            'new_value'     => $price,
            'user_id'       => $user->id,
        ]);
    }

    /**
     * Comparación de montos tolerante a la representación binaria de floats.
     * Ambos lados se manejan a 2 decimales, así que medio centavo alcanza.
     */
    private function sameMoney(float $a, float $b): bool
    {
        return abs($a - $b) < 0.005;
    }
}
