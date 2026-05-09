import type { Page } from '@playwright/test';

export class LoginPage {
    constructor(private readonly page: Page) {}

    async goto(): Promise<void> {
        await this.page.goto('/login');
    }

    async login(email: string, password: string): Promise<void> {
        await this.page.fill('#email', email);
        await this.page.fill('#password', password);
        await Promise.all([
            this.page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 }),
            this.page.click('button[type="submit"]'),
        ]);
    }

    async logout(): Promise<void> {
        // Logout es POST a /logout. Hacemos un fetch desde la propia sesión.
        await this.page.request.post('/logout');
    }
}
