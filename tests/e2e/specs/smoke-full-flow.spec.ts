import { test, expect } from '../fixtures/auth';
import { CustomersPage } from '../pages/CustomersPage';
import { ProductsPage } from '../pages/ProductsPage';
import { SalesPage } from '../pages/SalesPage';
import { DeliveriesPage } from '../pages/DeliveriesPage';
import { createSaleViaApi, setStockViaApi } from '../fixtures/api';
import { generateBusinessName, generateSku, generateTaxId } from '../utils/testData';

/**
 * SMOKE INTEGRADO — el "canario" del sistema.
 * Si este test falla, el corazón del flujo de negocio está roto.
 *
 * Flujo: alta de cliente → alta de artículo → set stock → venta → entrega → verificaciones.
 */
test.describe('Smoke E2E @smoke', () => {
    test('alta de cliente → artículo → venta → entrega total', async ({ adminPage }) => {
        const customers = new CustomersPage(adminPage);
        const products = new ProductsPage(adminPage);
        const sales = new SalesPage(adminPage);
        const deliveries = new DeliveriesPage(adminPage);

        const taxId = generateTaxId('30');
        const businessName = generateBusinessName('Smoke');
        const sku = generateSku('SMOKE');
        const productName = `Smoke prod ${sku}`;
        const quantity = 3;

        // 1) Alta de cliente
        await test.step('cliente: alta vía UI', async () => {
            await customers.create({
                businessName,
                personType: 'juridica',
                taxId,
                email: `${sku.toLowerCase()}@test.local`,
                taxStatus: 'Responsable Inscripto',
            });
            await customers.expectInList(taxId);
        });

        // 2) Alta de artículo (la redirección post-create ya confirma persistencia)
        await test.step('artículo: alta vía UI', async () => {
            await products.create({
                sku,
                name: productName,
                description: 'producto de smoke test',
                price: 750,
                taxRate: 21,
                minStock: 0,
                category: 'E2E Category',
                brand: 'E2E Brand',
            });
        });

        // 3) Stock para que la entrega pueda completarse
        await test.step('stock: cargar inventario', async () => {
            const finalQty = setStockViaApi({ productSku: sku, quantity: quantity + 5 });
            expect(finalQty).toBeGreaterThanOrEqual(quantity);
        });

        // 4) Venta vía helper (POST controlado, mismo path lógico que el POS)
        let saleId: number;
        await test.step('venta: crear via helper', async () => {
            saleId = createSaleViaApi({ customerTaxId: taxId, productSku: sku, quantity });
            expect(saleId).toBeGreaterThan(0);
            await sales.expectCustomerInList(businessName);
        });

        // 5) Entrega total: marcar como entregada
        await test.step('entrega: marcar como entregada', async () => {
            await deliveries.markFirstPendingAsDelivered(saleId!);
            // Tras entrega, el filtro pending para esa venta debe estar vacío.
            await deliveries.gotoForSale(saleId!);
            await expect(adminPage.getByRole('button', { name: /marcar entregada/i })).toHaveCount(0);
        });
    });
});
