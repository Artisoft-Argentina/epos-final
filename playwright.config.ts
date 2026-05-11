import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

const APP_PORT = process.env.APP_PORT ?? '5433';
const CENTRAL_DOMAIN = process.env.CENTRAL_DOMAIN ?? 'epos.lvh.me';
const E2E_TENANT = process.env.E2E_TENANT ?? 'e2e';
const BASE_URL = `http://${E2E_TENANT}.${CENTRAL_DOMAIN}:${APP_PORT}`;

export default defineConfig({
    testDir: './tests/e2e/specs',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: Number(process.env.WORKERS) || (process.env.CI ? 2 : 1),
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
    timeout: 30_000,
    expect: { timeout: 5_000 },

    use: {
        baseURL: BASE_URL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        viewport: { width: 1440, height: 900 },
        actionTimeout: 10_000,
        navigationTimeout: 15_000,
        launchOptions: {
            slowMo: Number(process.env.SLOW_MO) || 0,
        },
    },

    globalSetup: './tests/e2e/global-setup.ts',

    projects: [
        {
            name: 'admin',
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'tests/e2e/.auth/admin.json',
            },
            testMatch: /.*\.spec\.ts/,
        },
    ],
});
