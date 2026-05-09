import { expect, type Page } from '@playwright/test';

export type PersonType = 'fisica' | 'juridica';

export type TaxStatus = 'Responsable Inscripto' | 'Monotributo' | 'Exento' | 'Consumidor Final';

export interface CustomerData {
    businessName: string;
    personType?: PersonType;
    taxId?: string;
    dni?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxStatus: TaxStatus;
}

export class CustomersPage {
    constructor(private readonly page: Page) {}

    async gotoIndex(): Promise<void> {
        await this.page.goto('/customers');
    }

    async gotoCreate(): Promise<void> {
        await this.page.goto('/customers/create');
    }

    async fillCreateForm(data: CustomerData): Promise<void> {
        const personType: PersonType = data.personType ?? 'juridica';

        // Persona type es un radio sr-only, click forzado.
        await this.page.locator(`input[name="person_type"][value="${personType}"]`).click({ force: true });

        await this.page.fill('#business_name', data.businessName);

        if (personType === 'juridica') {
            if (!data.taxId) throw new Error('CUIT requerido para persona jurídica');
            await this.page.fill('#tax_id', data.taxId);
        } else {
            if (!data.dni) throw new Error('DNI requerido para persona física');
            await this.page.fill('#dni', data.dni);
            if (data.taxId) await this.page.fill('#tax_id', data.taxId);
        }

        if (data.email) await this.page.fill('#email', data.email);
        if (data.phone) await this.page.fill('#phone', data.phone);
        if (data.address) await this.page.fill('#address', data.address);

        // Select shadcn (radix): trigger por placeholder, opción por rol.
        await this.page.getByText('Seleccionar condición...').click();
        await this.page.getByRole('option', { name: data.taxStatus, exact: true }).click();
    }

    async submitCreate(): Promise<void> {
        await Promise.all([
            this.page.waitForURL(/\/customers(\/?$|\?|\/\d+)/, { timeout: 15_000 }),
            this.page.getByRole('button', { name: /^guardar cliente$/i }).first().click(),
        ]);
    }

    async create(data: CustomerData): Promise<void> {
        await this.gotoCreate();
        await this.fillCreateForm(data);
        await this.submitCreate();
    }

    /** Verifica que un cliente con un identificador concreto aparezca en el listado. */
    async expectInList(identifier: string): Promise<void> {
        await this.gotoIndex();
        await expect(this.page.getByText(identifier).first()).toBeVisible();
    }
}
