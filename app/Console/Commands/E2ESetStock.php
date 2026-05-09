<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Models\Stock;
use App\Models\StockMovement;
use App\Models\Warehouse;
use App\Services\MovimientoService;
use Illuminate\Console\Command;

/**
 * Helper E2E: setea stock para un producto en el almacén default vía un movimiento ADJUSTMENT_ENTRY.
 *
 * Uso:
 *   php artisan tenants:run e2e:set-stock --tenants=e2e --option=product-sku=PROD-123 --option=quantity=50
 */
class E2ESetStock extends Command
{
    protected $signature = 'e2e:set-stock
                            {--product-sku= : SKU del producto (default: primer product)}
                            {--quantity=10 : Cantidad a sumar (default 10)}
                            {--warehouse-code= : Código del almacén (default: el is_default)}';

    protected $description = '[E2E] Sumar stock a un producto vía ajuste positivo de inventario.';

    public function handle(MovimientoService $movimientos): int
    {
        $product = $this->option('product-sku')
            ? Product::where('sku', $this->option('product-sku'))->firstOrFail()
            : Product::orderBy('id')->firstOrFail();

        $warehouse = $this->option('warehouse-code')
            ? Warehouse::where('code', $this->option('warehouse-code'))->firstOrFail()
            : Warehouse::where('is_default', true)->firstOrFail();

        $stock = Stock::forProductInWarehouse($product->id, $warehouse->id);

        $movimientos->registrar(
            $stock,
            StockMovement::TYPE_ADJUSTMENT_ENTRY,
            (int) $this->option('quantity'),
            null,
            null,
            'E2E test seed'
        );

        $this->line((string) $stock->fresh()->quantity);

        return self::SUCCESS;
    }
}
