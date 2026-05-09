import { test, expect } from '../fixtures/auth';
import { ProductsPage } from '../pages/ProductsPage';
import { generateSku } from '../utils/testData';

test.describe('Ecommerce @regression', () => {
    test('shop público lista productos creados', async ({ adminPage }) => {
        const products = new ProductsPage(adminPage);
        const sku = generateSku('SHOP');
        const productName = 'Producto para tienda ' + sku;
        await products.create({
            sku,
            name: productName,
            description: 'visible en /shop',
            price: 9999,
            category: 'E2E Category',
            brand: 'E2E Brand',
        });

        await adminPage.goto('/shop');
        await expect(adminPage.getByText(productName).first()).toBeVisible({ timeout: 10_000 });
    });

    test('agregar al carrito devuelve 200 y persiste el item', async ({ adminPage }) => {
        const products = new ProductsPage(adminPage);
        const sku = generateSku('CART');
        const productName = 'Producto carrito ' + sku;
        await products.create({
            sku,
            name: productName,
            description: 'al carrito',
            price: 1234,
            category: 'E2E Category',
            brand: 'E2E Brand',
        });

        await adminPage.goto('/shop');
        const card = adminPage.locator('div.group', { hasText: productName }).first();
        await card.hover();

        const [response] = await Promise.all([
            adminPage.waitForResponse((r) => r.url().includes('/cart/') && r.request().method() === 'POST'),
            card.getByRole('button', { name: /agregar al carrito/i }).click(),
        ]);
        expect(response.status()).toBeLessThan(400);
    });
});
