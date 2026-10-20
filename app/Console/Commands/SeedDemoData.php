<?php

namespace App\Console\Commands;

use Database\Seeders\DemoSeeder;
use Illuminate\Console\Command;

class SeedDemoData extends Command
{
    protected $signature = 'epos:seed-demo';

    protected $description = 'Siembra marcas, categorías, proveedores, productos, stock inicial y clientes en la BD.';

    public function handle(): int
    {
        $this->info('Sembrando datos demo en la BD...');
        $this->call('db:seed', ['--class' => DemoSeeder::class, '--force' => true]);
        return self::SUCCESS;
    }
}
