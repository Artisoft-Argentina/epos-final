import { test, expect } from '../fixtures/auth';
import { createSaleViaApi } from '../fixtures/api';
import { SalesPage } from '../pages/SalesPage';
import { ProductsPage } from '../pages/ProductsPage';
import { CustomersPage } from '../pages/CustomersPage';
import { generateBusinessName, generateSku, generateTaxId } from '../utils/testData';

test.describe('Sales @regression', () => {
    test('admin abre el POS y ve clientes y artículos disponibles', async ({ adminPage }) => {
        const sales = new SalesPage(adminPage);
        await sales.gotoCreate();

        await expect(adminPage.getByText('Seleccionar cliente')).toBeVisible();
        await expect(adminPage.getByPlaceholder('Buscar artículo por código o nombre...')).toBeVisible();
    });

    test('venta creada vía API aparece en el listado', async ({ adminPage }) => {
        const customers = new CustomersPage(adminPage);
        const products = new ProductsPage(adminPage);
        const sales = new SalesPage(adminPage);

        const taxId = generateTaxId('30');
        const businessName = generateBusinessName('Sale');
        const sku = generateSku('SLPROD');

        await customers.create({
            businessName,
            personType: 'juridica',
            taxId,
            taxStatus: 'Responsable Inscripto',
        });

        await products.create({
            sku,
            name: 'Artículo para venta',
            description: 'desc',
            price: 1000,
            category: 'E2E Category',
            brand: 'E2E Brand',
        });

        const saleId = createSaleViaApi({ customerTaxId: taxId, productSku: sku, quantity: 2 });
        expect(saleId).toBeGreaterThan(0);

        await sales.expectCustomerInList(businessName);
    });
});
