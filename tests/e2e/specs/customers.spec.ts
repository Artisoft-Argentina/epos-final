import { test, expect } from '../fixtures/auth';
import { CustomersPage } from '../pages/CustomersPage';
import { generateBusinessName, generateDni, generateEmail, generateTaxId } from '../utils/testData';

test.describe('Customers @regression', () => {
    test('admin crea un cliente persona jurídica con CUIT', async ({ adminPage }) => {
        const customers = new CustomersPage(adminPage);
        const taxId = generateTaxId('30');
        const businessName = generateBusinessName('Acme');

        await customers.create({
            businessName,
            personType: 'juridica',
            taxId,
            email: generateEmail('acme'),
            phone: '11-1234-5678',
            address: 'Av. Siempre Viva 742',
            taxStatus: 'Responsable Inscripto',
        });

        await customers.expectInList(taxId);
        await expect(adminPage.getByText(businessName).first()).toBeVisible();
    });

    test('admin crea un cliente persona física con DNI', async ({ adminPage }) => {
        const customers = new CustomersPage(adminPage);
        const dni = generateDni();

        await customers.create({
            businessName: generateBusinessName('Pablo'),
            personType: 'fisica',
            dni,
            email: generateEmail('pablo'),
            taxStatus: 'Consumidor Final',
        });

        await customers.expectInList(dni);
    });

    test('rechaza alta sin condición IVA', async ({ adminPage }) => {
        const customers = new CustomersPage(adminPage);
        await customers.gotoCreate();

        await adminPage.locator('input[name="person_type"][value="juridica"]').click({ force: true });
        await adminPage.fill('#business_name', generateBusinessName('Sin IVA'));
        await adminPage.fill('#tax_id', generateTaxId('30'));

        await adminPage.getByRole('button', { name: /^guardar cliente$/i }).first().click();

        // No redirige — sigue en /create.
        await expect(adminPage).toHaveURL(/\/customers\/create/);
    });
});
