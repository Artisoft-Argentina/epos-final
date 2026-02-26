<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class MigrateExistingTenant extends Command
{
    protected $signature = 'tenant:migrate-existing
                            {--slug= : Subdominio para la empresa (ej: principal)}
                            {--razonsocial= : Razón social (si la tabla inicialsettings no existe)}
                            {--cuit= : CUIT (si la tabla inicialsettings no existe)}
                            {--confirm : Confirmar sin preguntar interactivamente}';

    protected $description = 'Migra los datos de la BD actual como el primer tenant';

    public function handle(): int
    {
        $this->info('=== Migración de datos existentes como Tenant #1 ===');

        // 1. Intentar leer datos de InitialSetting actual
        $empresa = null;
        try {
            $empresa = DB::connection('mysql')->table('inicialsettings')->first();
        } catch (\Exception $e) {
            $this->warn('Tabla inicialsettings no encontrada en BD actual. Usando valores de los argumentos.');
        }

        if (! $empresa) {
            $this->warn('No se encontró registro en inicialsettings. Se creará un tenant vacío.');
        }

        $razonsocial = $empresa?->razonsocial ?? $this->option('razonsocial') ?? 'Empresa Principal';
        $cuit        = $empresa?->cuit        ?? $this->option('cuit')        ?? '';
        $slug        = $this->option('slug') ?: $this->ask('Subdominio para esta empresa (ej: principal)', 'principal');

        $this->table(['Campo', 'Valor'], [
            ['Razón Social', $razonsocial],
            ['CUIT', $cuit],
            ['Subdominio', $slug . '.' . env('CENTRAL_DOMAIN', parse_url(config('app.url'), PHP_URL_HOST))],
        ]);

        if (! $this->option('confirm') && ! $this->confirm('¿Continuar con la migración?')) {
            $this->info('Operación cancelada.');
            return self::SUCCESS;
        }

        // 2. Crear el tenant
        $this->info('Creando tenant...');
        $tenant = Tenant::create([
            'razonsocial' => $razonsocial,
            'cuit'        => preg_replace('/\D/', '', (string) $cuit),
            'plan'        => 'pro',
            'status'      => 'active',
        ]);

        $subdomain = $slug . '.' . env('CENTRAL_DOMAIN', parse_url(config('app.url'), PHP_URL_HOST));
        $tenant->domains()->create(['domain' => $subdomain]);
        $this->info("Tenant creado: ID {$tenant->id}");
        $this->info("Subdominio: {$subdomain}");

        // 3. El evento TenantCreated ya creó la BD y corrió las migrations
        $tenantDbName = config('tenancy.database.prefix') . $tenant->id;
        $this->info("Base de datos del tenant: {$tenantDbName}");

        // 4. Volcar datos de la BD original a la BD del tenant
        $this->info('Copiando datos de la BD original...');

        tenancy()->initialize($tenant);

        try {
            $tables = [
                'roles', 'users', 'password_reset_tokens', 'sessions',
                'inicialsettings', 'marcas', 'categorias', 'suppliers',
                'articulos', 'articulo_imagenes', 'inventarios', 'movimientos',
                'remitos', 'articulo_remito', 'presupuestos', 'articulo_presupuesto',
                'facturas', 'articulo_factura', 'factura_pagos',
                'cuentacorrientes', 'pagos', 'recibos', 'pago_recibo', 'movimientocuentas',
                'clientes', 'entregas', 'listas_precios', 'articulo_lista_precio',
                'compras', 'compra_detalles', 'carts', 'activity_log',
                'telegram_users', 'telegram_conversations',
                'provincias', 'localidades',
            ];

            $centralDb = config('database.connections.mysql.database');

            foreach ($tables as $table) {
                try {
                    $rows = DB::connection('mysql')->table($table)->get();
                    if ($rows->isEmpty()) {
                        continue;
                    }
                    DB::table($table)->truncate();
                    foreach ($rows->chunk(500) as $chunk) {
                        DB::table($table)->insert($chunk->map(fn ($r) => (array) $r)->toArray());
                    }
                    $this->line("  ✔ {$table} (" . $rows->count() . ' registros)');
                } catch (\Exception $e) {
                    $this->warn("  ⚠ {$table}: " . $e->getMessage());
                }
            }
        } finally {
            tenancy()->end();
        }

        $this->newLine();
        $this->info('✅ Migración completada exitosamente.');
        $this->info("Accedé al sistema en: https://{$subdomain}");

        return self::SUCCESS;
    }
}
