/**
 * Número de comprobante en formato AFIP: letra + punto de venta + número.
 *
 * La lista mostraba sólo "#N" (el invoice_number pelado), que se confunde con
 * el id interno que va en las URLs — y no coinciden: si la numeración arrancó
 * en 0, la factura #1 vive en /ventas/2. Mostrar el comprobante completo saca
 * esa ambigüedad de una acción destructiva como cancelar.
 */
export function formatVoucher(letter: string | null | undefined, posNumber: number | string | null | undefined, invoiceNumber: number | string): string {
    const pos = String(posNumber ?? 0).padStart(4, '0');
    const number = String(invoiceNumber ?? 0).padStart(8, '0');

    return `${(letter ?? 'B').toUpperCase()} ${pos}-${number}`;
}
