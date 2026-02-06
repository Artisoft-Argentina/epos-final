<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class ClearAfipTokens extends Command
{
    protected $signature = 'afip:clear-tokens';

    protected $description = 'Limpia los tokens de AFIP almacenados localmente y en caché';

    public function handle()
    {
        $this->info('Limpiando tokens de AFIP...');

        // Limpiar archivos de tokens
        $tokenPath = storage_path('app/private/afip');
        $tokens = glob($tokenPath . '/token_*.json');

        foreach ($tokens as $token) {
            if (unlink($token)) {
                $this->info('✓ Eliminado: ' . basename($token));
            }
        }

        // Limpiar caché
        Cache::forget('afip_auth_wsfe');
        Cache::forget('afip_auth_ws_sr_padron_a5');
        $this->info('✓ Caché de AFIP limpiado');

        $this->info('');
        $this->info('Tokens de AFIP eliminados correctamente.');
        $this->info('Los nuevos tokens se generarán automáticamente en la próxima consulta.');

        return 0;
    }
}
