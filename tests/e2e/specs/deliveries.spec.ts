import { test, expect } from '../fixtures/auth';
import { createSaleViaApi, setStockViaApi } from '../fixtures/api';
import { CustomersPage } from '../pages/CustomersPage';
import { DeliveriesPage } from '../pages/DeliveriesPage';
import { ProductsPage } from '../pages/ProductsPage';
import { generateBusinessName, generateSku, generateTaxId } from '../utils/testData';

test.describe('Deliveries @regression', () => {
    test('una venta auto-genera una entrega pendiente visible en /entregas', async ({ adminPage }) => {
        const customers = new CustomersPage(adminPage);
        const products = new ProductsPage(adminPage);
        const deliveries = new DeliveriesPage(adminPage);

        const taxId = generateTaxId('30');
        const sku = generateSku('DELPROD');

        await customers.create({
            businessName: generateBusinessName('Deliv'),
            personType: 'juridica',
            taxId,
            taxStatus: 'Responsable Inscripto',
        });
        await products.create({
            sku,
            name: 'Producto entregable',
            description: 'desc',
            price: 500,
            category: 'E2E Category',
            brand: 'E2E Brand',
        });

        const saleId = createSaleViaApi({ customerTaxId: taxId, productSku: sku, quantity: 1 });
        expect(saleId).toBeGreaterThan(0);

        await deliveries.gotoIndex();
        await expect(adminPage.getByRole('button', { name: /marcar entregada/i }).first()).toBeVisible();
    });

    test('admin marca una entrega como entregada cuando hay stock', async ({ adminPage }) => {
        const customers = new CustomersPage(adminPage);
        const products = new ProductsPage(adminPage);
        const deliveries = new DeliveriesPage(adminPage);

        const taxId = generateTaxId('30');
        const sku = generateSku('DELOK');

        await customers.create({
            businessName: generateBusinessName('Mark'),
            personType: 'juridica',
            taxId,
            taxStatus: 'Responsable Inscripto',
        });
        await products.create({
            sku,
            name: 'Producto con stock',
            description: 'desc',
            price: 800,
            category: 'E2E Category',
            brand: 'E2E Brand',
        });

        setStockViaApi({ productSku: sku, quantity: 10 });
        const saleId = createSaleViaApi({ customerTaxId: taxId, productSku: sku, quantity: 1 });

        await deliveries.markFirstPendingAsDelivered(saleId);

        // Después de marcar como entregada, esa entrega ya no aparece en el filtro pending.
        await deliveries.gotoForSale(saleId);
        await expect(adminPage.getByRole('button', { name: /marcar entregada/i })).toHaveCount(0);
    });
});
