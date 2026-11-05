<?php

namespace App\Enums;

/**
 * Estado de pago del ciclo de vida de una venta (Sale).
 *
 * Reemplaza los strings libres 'SI'/'NO' del sistema original.
 * `cancelled` es terminal: solo lo setea SaleService::cancel() y
 * Sale::recalcPaymentStatus() nunca lo modifica.
 */
enum PaymentStatus: string
{
    case Pending = 'pending';     // total_paid == 0
    case Partial = 'partial';     // 0 < total_paid < total
    case Paid = 'paid';           // total_paid >= total
    case Cancelled = 'cancelled'; // venta anulada (terminal)

    /** Etiqueta visible para el usuario (español). */
    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pendiente',
            self::Partial => 'Parcial',
            self::Paid => 'Pagada',
            self::Cancelled => 'Cancelada',
        };
    }

    /** Variante de Badge del design system asociada al estado. */
    public function badgeVariant(): string
    {
        return match ($this) {
            self::Pending => 'warning',
            self::Partial => 'info',
            self::Paid => 'success',
            self::Cancelled => 'destructive',
        };
    }

    /** Estados que representan una venta con saldo pendiente de cobro. */
    public static function owingCases(): array
    {
        return [self::Pending->value, self::Partial->value];
    }
}
