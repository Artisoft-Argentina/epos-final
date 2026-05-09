import { expect, type Page } from '@playwright/test';

export class SalesPage {
    constructor(private readonly page: Page) {}

    async gotoIndex(): Promise<void> {
        await this.page.goto('/ventas');
    }

    async gotoCreate(): Promise<void> {
        await this.page.goto('/ventas/create');
    }

    async expectInvoiceInList(invoiceNumber: number): Promise<void> {
        await this.gotoIndex();
        await expect(this.page.getByText(`#${invoiceNumber}`).first()).toBeVisible({ timeout: 10_000 });
    }

    async expectCustomerInList(customerBusinessName: string): Promise<void> {
        await this.gotoIndex();
        await expect(this.page.getByText(customerBusinessName).first()).toBeVisible({ timeout: 10_000 });
    }

    /** Crea una venta vía el POS UI (camino crítico). */
    async createViaPosUi(opts: { customerName: string; productSku: string; productName: string }): Promise<void> {
        await this.gotoCreate();

        // Cliente: Select shadcn con placeholder.
        await this.page.getByText('Seleccionar cliente').click();
        await this.page.getByRole('option', { name: opts.customerName, exact: false }).click();

        // Buscar artículo en el input de búsqueda y elegir el resultado.
        const search = this.page.getByPlaceholder('Buscar artículo por código o nombre...');
        await search.fill(opts.productSku);
        await this.page.getByText(opts.productName, { exact: false }).first().click();

        // Finalizar venta (botón al pie del panel derecho).
        await Promise.all([
            this.page.waitForURL(/\/ventas(\/?$|\?|\/\d+)/, { timeout: 20_000 }),
            this.page.getByRole('button', { name: /finalizar venta/i }).click(),
        ]);
    }
}
