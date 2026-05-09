/**
 * Generadores de datos únicos para que los tests no choquen entre sí
 * cuando corren en paralelo.
 */

const seedSuffix = () => `${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 100)}`;

/**
 * Genera un CUIT válido argentino (11 dígitos con dígito verificador).
 * Tipo 30 (jurídicas) por defecto.
 */
export function generateTaxId(prefix: '20' | '23' | '27' | '30' = '30'): string {
    const body = String(Math.floor(10_000_000 + Math.random() * 89_999_999));
    const base = prefix + body;
    const mults = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const sum = base.split('').reduce((acc, d, i) => acc + Number(d) * mults[i], 0);
    let check = 11 - (sum % 11);
    if (check === 11) check = 0;
    if (check === 10) check = 9;
    return base + check;
}

export function generateDni(): string {
    return String(Math.floor(20_000_000 + Math.random() * 60_000_000));
}

export function generateBarcode(): string {
    return '779' + String(Math.floor(1_000_000_000 + Math.random() * 8_999_999_999));
}

export function generateSku(prefix = 'E2E'): string {
    return `${prefix}-${seedSuffix()}`;
}

export function generateEmail(prefix = 'e2e'): string {
    return `${prefix}-${seedSuffix()}@test.local`;
}

export function generateBusinessName(prefix = 'Test'): string {
    return `${prefix} ${seedSuffix()} SA`;
}
