import { chromium, type FullConfig } from '@playwright/test';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Global setup que corre una vez antes de todo el suite.
 *
 * 1. Resetea el tenant e2e (DB efímera, datos mínimos).
 * 2. Hace login con cada rol y guarda storageState en tests/e2e/.auth/<rol>.json
 *    para que los tests arranquen ya autenticados.
 */
async function globalSetup(config: FullConfig) {
    const baseURL = config.projects[0]?.use?.baseURL;
    if (!baseURL) throw new Error('baseURL no definido en playwright.config.ts');

    if (process.env.E2E_SKIP_RESET !== '1') {
        console.log('→ Reseteando tenant e2e...');
        const flags = process.env.E2E_WITH_DEMO === '1' ? ' --with-demo' : '';
        const artisan = process.env.E2E_ARTISAN_CMD ?? 'docker exec local-epos-app php artisan';
        execSync(`${artisan} tenants:e2e-reset${flags}`, { stdio: 'inherit' });
    } else {
        console.log('→ E2E_SKIP_RESET=1, salteando reset del tenant.');
    }

    const users = [
        { role: 'admin', email: 'admin@mail.com', password: 'asdf1234' },
        { role: 'vendedor', email: 'vendedor@mail.com', password: 'asdf1234' },
        { role: 'cliente', email: 'cliente.e2e@mail.com', password: 'asdf1234' },
    ];

    const browser = await chromium.launch();
    try {
        for (const user of users) {
            console.log(`→ Login como ${user.role}...`);
            const context = await browser.newContext({ baseURL });
            const page = await context.newPage();

            await page.goto('/login');
            await page.fill('#email', user.email);
            await page.fill('#password', user.password);

            await Promise.all([
                page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 }),
                page.click('button[type="submit"]'),
            ]);

            const storagePath = `tests/e2e/.auth/${user.role}.json`;
            mkdirSync(dirname(storagePath), { recursive: true });
            await context.storageState({ path: storagePath });
            await context.close();
            console.log(`  ✔ ${user.role} → ${storagePath}`);
        }
    } finally {
        await browser.close();
    }
}

export default globalSetup;
