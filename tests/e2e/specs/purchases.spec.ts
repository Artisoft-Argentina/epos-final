import { test, expect } from '../fixtures/auth';

test.describe('Purchases (Orders) @regression', () => {
    test('admin abre el listado de órdenes de compra', async ({ adminPage }) => {
        await adminPage.goto('/orders');
        await expect(adminPage.getByRole('heading', { name: /órdenes de compra/i })).toBeVisible();
    });

    test('admin abre el formulario de nueva orden con campos cargados', async ({ adminPage }) => {
        await adminPage.goto('/orders/create');
        await expect(adminPage.locator('#pos_number')).toBeVisible();
        await expect(adminPage.locator('#date')).toBeVisible();
        await expect(adminPage.getByText('Seleccionar proveedor')).toBeVisible();
    });
});
