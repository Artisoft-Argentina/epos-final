import { expect, type Page } from '@playwright/test';

export interface ProductData {
    sku: string;
    name: string;
    description: string;
    price: number;
    taxRate?: number;
    minStock?: number;
    /** Opción visible del select de Categoría. Default: la primera disponible. */
    category?: string;
    /** Opción visible del select de Marca. Default: la primera disponible. */
    brand?: string;
}

export class ProductsPage {
    constructor(private readonly page: Page) {}

    async gotoIndex(): Promise<void> {
        await this.page.goto('/articulos');
    }

    async gotoCreate(): Promise<void> {
        await this.page.goto('/articulos/create');
    }

    private async pickFromSelect(placeholder: string, optionName?: string): Promise<void> {
        await this.page.getByText(placeholder, { exact: false }).first().click();

        if (optionName) {
            await this.page.getByRole('option', { name: optionName, exact: true }).click();
        } else {
            // Default: primera opción disponible.
            await this.page.getByRole('option').first().click();
        }
    }

    async create(data: ProductData): Promise<void> {
        await this.gotoCreate();
        await this.page.fill('#sku', data.sku);
        await this.page.fill('#name', data.name);
        await this.page.fill('#description', data.description);
        await this.page.fill('#price', String(data.price));
        await this.page.fill('#tax_rate', String(data.taxRate ?? 21));
        await this.page.fill('#min_stock', String(data.minStock ?? 0));

        await this.pickFromSelect('Seleccionar categoría', data.category);
        await this.pickFromSelect('Seleccionar marca', data.brand);

        await Promise.all([
            this.page.waitForURL(/\/articulos(\/?$|\?|\/\d+)/, { timeout: 15_000 }),
            this.page.getByRole('button', { name: /^crear$/i }).click(),
        ]);
    }

    async expectInList(textOrSku: string): Promise<void> {
        await this.gotoIndex();
        await expect(this.page.getByText(textOrSku).first()).toBeVisible({ timeout: 10_000 });
    }
}
