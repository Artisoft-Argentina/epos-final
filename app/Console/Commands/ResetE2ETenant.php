<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Database\Seeders\E2ESeeder;
use Database\Seeders\TenantDemoSeeder;
use Database\Seeders\TenantInitSeeder;
use Database\Seeders\TenantSeeder;
use Illuminate\Console\Command;

/**
 * Recrea el tenant dedicado para pruebas E2E desde cero.
 *
 * Pasos:
 *   1. Borra el tenant `e2e` y su DB si existían.
 *   2. Crea el tenant nuevo con dominio `e2e.<central_domain>`.
 *   3. El evento TenantCreated provisiona la DB y corre `tenants:migrate`.
 *   4. Corre los seeders mínimos para dejar el tenant operable.
 *
 * Uso:
 *   php artisan tenants:e2e-reset
 *   php artisan tenants:e2e-reset --with-demo   (incluye catálogo demo)
 */
class ResetE2ETenant extends Command
{
    protected $signature = 'tenants:e2e-reset
                            {--with-demo : Sembrar también el catálogo demo (productos, stock, clientes)}';

    protected $description = 'Reset completo del tenant e2e: lo borra, lo recrea, migra y siembra los datos mínimos.';

    private const TENANT_ID = 'e2e';

    public function handle(): int
    {
        $central = env('CENTRAL_DOMAIN', parse_url(config('app.url'), PHP_URL_HOST));
        $domain  = self::TENANT_ID . '.' . $central;

        $this->info("Reseteando tenant e2e ({$domain})...");

        $existing = Tenant::find(self::TENANT_ID);
        if ($existing) {
            $this->line('  → Tenant existente encontrado, eliminando...');
            $existing->delete();
            $this->line('  ✔ Tenant anterior eliminado (DB y dominio).');
        }

        $tenant = Tenant::create([
            'id'            => self::TENANT_ID,
            'business_name' => 'Tenant E2E',
            'tax_id'        => '30000000000',
            'plan'          => 'pro',
            'status'        => 'active',
        ]);
        $tenant->domains()->create(['domain' => $domain]);
        $this->line("  ✔ Tenant creado y migrado: {$tenant->id}");

        $tenant->run(function () {
            $this->call('db:seed', ['--class' => TenantSeeder::class,     '--force' => true]);
            $this->call('db:seed', ['--class' => TenantInitSeeder::class, '--force' => true]);

            if ($this->option('with-demo')) {
                $this->call('db:seed', ['--class' => TenantDemoSeeder::class, '--force' => true]);
            }

            $this->call('db:seed', ['--class' => E2ESeeder::class, '--force' => true]);
        });

        $this->newLine();
        $this->info("✓ Tenant e2e listo en http://{$domain}:" . env('APP_PORT', '5433'));
        $this->line('  Usuarios: admin@mail.com / vendedor@mail.com / cliente.e2e@mail.com (password: asdf1234)');

        return self::SUCCESS;
    }
}
