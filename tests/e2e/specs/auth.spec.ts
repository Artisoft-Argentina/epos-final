import { test, expect } from '../fixtures/auth';
import { LoginPage } from '../pages/LoginPage';

test.describe('Auth @smoke', () => {
    test('admin loguea y aterriza en el dashboard de admin', async ({ adminPage }) => {
        await adminPage.goto('/dashboard');
        await expect(adminPage).toHaveURL(/\/admin\/dashboard/);
    });

    test('vendedor loguea y queda autenticado', async ({ vendedorPage }) => {
        await vendedorPage.goto('/dashboard');
        await expect(vendedorPage).not.toHaveURL(/\/login/);
    });

    test('cliente es redirigido a su dashboard de cliente', async ({ clientePage }) => {
        await clientePage.goto('/dashboard');
        await expect(clientePage).toHaveURL(/\/client/);
    });

    test('login form rechaza credenciales inválidas', async ({ browser, baseURL }) => {
        const ctx = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
        const page = await ctx.newPage();
        const login = new LoginPage(page);

        await login.goto();
        await expect(page.locator('#email')).toBeVisible();

        await page.fill('#email', 'noexiste@mail.com');
        await page.fill('#password', 'wrong-password');
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/\/login/);
        await ctx.close();
    });
});
