<?php

namespace App\Console\Commands;

use App\Models\Warehouse;
use Illuminate\Console\Command;

class BackfillDefaultWarehouse extends Command
{
    protected $signature = 'epos:backfill-default-warehouse';

    protected $description = 'Crea el almacén "Principal" por defecto en el tenant actual si no existe';

    public function handle(): int
    {
        if (Warehouse::isDefault()->exists()) {
            $this->info('Ya existe un almacén default en este tenant. Skip.');
            return self::SUCCESS;
        }

        $warehouse = Warehouse::create([
            'name'       => 'Principal',
            'code'       => 'PRINCIPAL',
            'is_default' => true,
            'active'     => true,
        ]);

        $this->info("Almacén default creado: ID {$warehouse->id}");
        return self::SUCCESS;
    }
}
