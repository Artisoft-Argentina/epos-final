import { execSync } from 'node:child_process';

const TENANT = process.env.E2E_TENANT ?? 'e2e';
const ARTISAN_CMD = process.env.E2E_ARTISAN_CMD ?? 'docker exec local-epos-app php artisan';

/**
 * Ejecuta un comando artisan dentro del tenant e2e usando `tenants:run`.
 * Las opciones del comando interno se pasan vía `--option=key=value`.
 *
 * En CI sin Docker, exportar E2E_ARTISAN_CMD="php artisan".
 */
export function runInTenant(commandName: string, options: Record<string, string | number> = {}): string {
    const optFlags = Object.entries(options)
        .map(([k, v]) => `--option=${shellEscape(`${k}=${v}`)}`)
        .join(' ');

    const cmd = `${ARTISAN_CMD} tenants:run ${commandName} --tenants=${TENANT} ${optFlags}`.trim();
    return execSync(cmd, { encoding: 'utf-8' });
}

function shellEscape(s: string): string {
    return `'${s.replace(/'/g, "'\\''")}'`;
}

/**
 * Suma stock a un producto vía el helper `e2e:set-stock`.
 * Retorna la cantidad final tras el ajuste.
 */
export function setStockViaApi(opts: { productSku: string; quantity: number; warehouseCode?: string }): number {
    const options: Record<string, string | number> = {
        'product-sku': opts.productSku,
        quantity: opts.quantity,
    };
    if (opts.warehouseCode) options['warehouse-code'] = opts.warehouseCode;

    const out = runInTenant('e2e:set-stock', options);
    const lines = out.split('\n').map((l) => l.trim()).filter(Boolean);
    const qty = lines.reverse().find((l) => /^\d+$/.test(l));
    if (!qty) throw new Error(`No se pudo parsear stock final de:\n${out}`);
    return Number(qty);
}

/**
 * Crea una venta vía el comando helper `e2e:create-sale`.
 * Retorna el ID numérico de la venta creada.
 */
export function createSaleViaApi(opts: {
    customerTaxId?: string;
    customerDni?: string;
    productSku?: string;
    quantity?: number;
    autoDelivery?: boolean;
}): number {
    const options: Record<string, string | number> = {};
    if (opts.customerTaxId) options['customer-tax-id'] = opts.customerTaxId;
    if (opts.customerDni) options['customer-dni'] = opts.customerDni;
    if (opts.productSku) options['product-sku'] = opts.productSku;
    if (opts.quantity) options.quantity = opts.quantity;
    if (opts.autoDelivery === false) options['auto-delivery'] = 0;

    const out = runInTenant('e2e:create-sale', options);
    // Filtrar la línea "Tenant: e2e" que `tenants:run` imprime arriba.
    const lines = out.split('\n').map((l) => l.trim()).filter(Boolean);
    const idLine = lines.reverse().find((l) => /^\d+$/.test(l));
    if (!idLine) throw new Error(`No se pudo parsear el ID de venta de:\n${out}`);
    return Number(idLine);
}
