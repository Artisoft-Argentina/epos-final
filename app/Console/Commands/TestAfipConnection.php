<?php

namespace App\Console\Commands;

use App\Services\AfipService;
use Illuminate\Console\Command;

class TestAfipConnection extends Command
{
    protected $signature = 'afip:test-connection';

    protected $description = 'Test AFIP connection and configuration';

    public function handle()
    {
        try {
            $this->info('Testing AFIP connection...');

            $afipService = new AfipService();
            $sdk = $afipService->getSdk();

            $this->info('CUIT: ' . $sdk->getCuit());
            $this->info('Environment: ' . ($sdk->isProduction() ? 'production' : 'homologacion'));

            $certResult = $sdk->validateCertificates();
            $this->info('Certificates: ' . ($certResult['valid'] ? 'Valid' : 'Invalid'));
            if (isset($certResult['expires'])) {
                $this->info('Expires: ' . $certResult['expires']);
            }

            $this->info('Testing WSFE connection...');
            if ($sdk->testConnection('wsfe')) {
                $this->info('✓ WSFE connection successful');
            } else {
                $this->warn('✗ WSFE connection failed');
            }

            $this->info('Testing Padrón A5 connection...');
            if ($sdk->testConnection('ws_sr_padron_a5')) {
                $this->info('✓ Padrón A5 connection successful');
            } else {
                $this->warn('✗ Padrón A5 connection failed');
            }

            $this->info('✅ AFIP connection test completed!');
            return 0;
        } catch (\Exception $e) {
            $this->error('❌ AFIP connection test failed: ' . $e->getMessage());
            $this->error('File: ' . $e->getFile());
            $this->error('Line: ' . $e->getLine());
            return 1;
        }
    }
}