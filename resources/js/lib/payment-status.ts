// Estados de pago de una venta (Sale.payment_status) — espejo de App\Enums\PaymentStatus.
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'cancelled';

type BadgeVariant = 'success' | 'warning' | 'info' | 'destructive' | 'secondary';

interface PaymentStatusMeta {
    label: string;
    variant: BadgeVariant;
}

const META: Record<PaymentStatus, PaymentStatusMeta> = {
    pending: { label: 'Pendiente', variant: 'warning' },
    partial: { label: 'Parcial', variant: 'info' },
    paid: { label: 'Pagada', variant: 'success' },
    cancelled: { label: 'Cancelada', variant: 'destructive' },
};

/** Devuelve label + variante de Badge para un estado de pago. */
export function paymentStatusMeta(status: string): PaymentStatusMeta {
    return META[status as PaymentStatus] ?? { label: status, variant: 'secondary' };
}

/** true si la venta tiene saldo pendiente de cobro (habilita registrar pago). */
export function isOwing(status: string): boolean {
    return status === 'pending' || status === 'partial';
}

/** true si la venta está cancelada (estado terminal). */
export function isCancelled(status: string): boolean {
    return status === 'cancelled';
}
