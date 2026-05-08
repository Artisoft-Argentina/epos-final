<?php

namespace App\Console\Commands;

use App\Models\Delivery;
use App\Models\Warehouse;
use Illuminate\Console\Command;

class BackfillDeliveryWarehouse extends Command
{
    protected $signature = 'epos:backfill-delivery-warehouse';

    protected $description = 'Asigna warehouse_id a las deliveries que no lo tienen, usando sale.warehouse_id o el almacén default.';

    public function handle(): int
    {
        $defaultWarehouseId = Warehouse::isDefault()->value('id');

        if (! $defaultWarehouseId) {
            $this->error('No existe almacén default en este tenant. Crealo primero con epos:backfill-default-warehouse.');
            return self::FAILURE;
        }

        $count = 0;
        Delivery::with('sale:id,warehouse_id')
            ->whereNull('warehouse_id')
            ->chunkById(1000, function ($chunk) use ($defaultWarehouseId, &$count) {
                foreach ($chunk as $delivery) {
                    $delivery->warehouse_id = $delivery->sale?->warehouse_id ?? $defaultWarehouseId;
                    $delivery->saveQuietly();
                    $count++;
                }
            });

        $this->info("✓ {$count} deliveries actualizadas con warehouse_id.");
        return self::SUCCESS;
    }
}
