<?php

namespace App\Console\Commands;

use App\Services\Telegram\TelegramBotService;
use Illuminate\Console\Command;

class SetupTelegramWebhooks extends Command
{
    protected $signature = 'telegram:setup-webhooks {--delete : Delete webhooks instead of setting them}';
    protected $description = 'Setup or delete Telegram webhooks';

    public function handle()
    {
        $appUrl = config('app.url');
        
        if ($this->option('delete')) {
            $this->deleteWebhooks();
            return;
        }

        $this->info('Setting up Telegram webhooks...');
        $this->newLine();

        // Admin bot
        $adminBot = new TelegramBotService('admin');
        $adminUrl = "{$appUrl}/api/telegram/webhook/admin";
        $adminResult = $adminBot->setWebhook($adminUrl);
        
        if ($adminResult['ok'] ?? false) {
            $this->info("✅ Admin bot webhook set: {$adminUrl}");
        } else {
            $this->error("❌ Admin bot webhook failed: " . ($adminResult['description'] ?? 'Unknown error'));
        }

        // Vendedor bot
        $vendedorBot = new TelegramBotService('vendedor');
        $vendedorUrl = "{$appUrl}/api/telegram/webhook/vendedor";
        $vendedorResult = $vendedorBot->setWebhook($vendedorUrl);
        
        if ($vendedorResult['ok'] ?? false) {
            $this->info("✅ Vendedor bot webhook set: {$vendedorUrl}");
        } else {
            $this->error("❌ Vendedor bot webhook failed: " . ($vendedorResult['description'] ?? 'Unknown error'));
        }

        $this->newLine();
        $this->info('Done!');
    }

    private function deleteWebhooks()
    {
        $this->info('Deleting Telegram webhooks...');
        $this->newLine();

        $adminBot = new TelegramBotService('admin');
        $adminResult = $adminBot->deleteWebhook();
        
        if ($adminResult['ok'] ?? false) {
            $this->info("✅ Admin bot webhook deleted");
        }

        $vendedorBot = new TelegramBotService('vendedor');
        $vendedorResult = $vendedorBot->deleteWebhook();
        
        if ($vendedorResult['ok'] ?? false) {
            $this->info("✅ Vendedor bot webhook deleted");
        }

        $this->newLine();
        $this->info('Done!');
    }
}
