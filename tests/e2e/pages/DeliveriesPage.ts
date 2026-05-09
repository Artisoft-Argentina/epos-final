import { expect, type Page } from '@playwright/test';

export class DeliveriesPage {
    constructor(private readonly page: Page) {}

    async gotoIndex(): Promise<void> {
        await this.page.goto('/entregas');
    }

    async gotoForSale(saleId: number): Promise<void> {
        await this.page.goto(`/entregas?sale_id=${saleId}`);
    }

    async expectInvoiceVisible(invoiceNumber: number): Promise<void> {
        await expect(this.page.getByText(`#${invoiceNumber}`).first()).toBeVisible({ timeout: 10_000 });
    }

    /**
     * Marca una entrega pendiente como entregada.
     * Requiere que el producto tenga stock en al menos un almacén (ver e2e:set-stock).
     * Asume que el almacén default ya está pre-seleccionado en el modal.
     */
    async markFirstPendingAsDelivered(saleId?: number): Promise<void> {
        if (saleId) await this.gotoForSale(saleId);
        else await this.gotoIndex();
        await this.page.getByRole('button', { name: /marcar entregada/i }).first().click();

        await this.page.getByText('Almacén desde el que se entrega').waitFor({ timeout: 5_000 });

        const confirmar = this.page.getByRole('button', { name: /confirmar entrega/i });
        await expect(confirmar).toBeEnabled({ timeout: 5_000 });

        await Promise.all([
            this.page.waitForResponse((r) => r.url().includes('/marcar-entregada') && r.request().method() === 'POST'),
            confirmar.click(),
        ]);

        // Esperar el toast de éxito (sonner puede renderizar 2 nodos al mismo tiempo).
        await expect(this.page.getByText('Entrega marcada como completada').first()).toBeVisible({ timeout: 5_000 });
    }
}
