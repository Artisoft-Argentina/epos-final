<?php

namespace App\Console\Commands;

use Database\Seeders\TenantDemoSeeder;
use Illuminate\Console\Command;

class SeedTenantDemoData extends Command
{
    protected $signature = 'epos:seed-demo';

    protected $description = 'Siembra marcas, categorías, proveedores, productos, stock inicial y clientes en el tenant actual.';

    public function handle(): int
    {
        $this->info('Sembrando datos demo en el tenant actual...');
        $this->call('db:seed', ['--class' => TenantDemoSeeder::class, '--force' => true]);
        return self::SUCCESS;
    }
}
