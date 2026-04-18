<?php

namespace App\Console\Commands;

use App\Services\AfipService;
use Illuminate\Console\Command;

class ClearAfipTokens extends Command
{
    protected $signature = 'afip:clear-tokens';

    protected $description = 'Limpia los tokens de AFIP almacenados localmente y en caché';

    public function handle()
    {
        $this->info('Limpiando tokens de AFIP...');

        try {
            $afipService = new AfipService();
            $afipService->getSdk()->clearTokens();
            $this->info('✓ Tokens eliminados correctamente');
        } catch (\Exception $e) {
            $this->warn('No se pudieron limpiar tokens vía SDK: ' . $e->getMessage());

            $afipDir = storage_path('app/private/afip');
            if (is_dir($afipDir)) {
                $tokens = glob($afipDir . '/token_*.json');
                foreach ($tokens as $token) {
                    if (unlink($token)) {
                        $this->info('✓ Eliminado: ' . basename($token));
                    }
                }
            }

            \Illuminate\Support\Facades\Cache::forget('afip_auth_wsfe');
            \Illuminate\Support\Facades\Cache::forget('afip_auth_ws_sr_padron_a5');
            $this->info('✓ Caché de AFIP limpiado (fallback)');
        }

        $this->info('');
        $this->info('Los nuevos tokens se generarán automáticamente en la próxima consulta.');

        return 0;
    }
}