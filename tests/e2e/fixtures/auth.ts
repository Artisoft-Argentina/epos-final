import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';

type Role = 'admin' | 'vendedor' | 'cliente';

type AuthFixtures = {
    adminPage: Page;
    vendedorPage: Page;
    clientePage: Page;
};

async function contextForRole(browser: BrowserContext['browser'], role: Role): Promise<BrowserContext> {
    if (!browser) throw new Error('Browser instance no disponible');
    return browser.newContext({ storageState: `tests/e2e/.auth/${role}.json` });
}

/**
 * Test extendido con páginas pre-autenticadas por rol.
 * Cada test recibe `adminPage`, `vendedorPage`, `clientePage` ya logueadas.
 *
 * Uso:
 *   test('algo', async ({ adminPage }) => { await adminPage.goto('/customers'); ... });
 */
export const test = base.extend<AuthFixtures>({
    adminPage: async ({ browser }, use) => {
        const ctx = await contextForRole(browser, 'admin');
        const page = await ctx.newPage();
        await use(page);
        await ctx.close();
    },
    vendedorPage: async ({ browser }, use) => {
        const ctx = await contextForRole(browser, 'vendedor');
        const page = await ctx.newPage();
        await use(page);
        await ctx.close();
    },
    clientePage: async ({ browser }, use) => {
        const ctx = await contextForRole(browser, 'cliente');
        const page = await ctx.newPage();
        await use(page);
        await ctx.close();
    },
});

export { expect };
