import { test } from '../fixtures/auth';
import { ProductsPage } from '../pages/ProductsPage';
import { generateSku } from '../utils/testData';

test.describe('Products @regression', () => {
    test('admin crea un artículo nuevo', async ({ adminPage }) => {
        const products = new ProductsPage(adminPage);
        const sku = generateSku('PROD');

        await products.create({
            sku,
            name: 'Artículo de prueba',
            description: 'Descripción de prueba',
            price: 1500,
            taxRate: 21,
            minStock: 5,
            category: 'E2E Category',
            brand: 'E2E Brand',
        });

        await products.expectInList(sku);
    });
});
