<?php

namespace App\Enums;

/**
 * Condición de venta. Se fija al crear la venta y no transiciona.
 * Reemplaza los strings libres 'CONTADO'/'contado'/'CUENTA CORRIENTE'.
 */
enum SaleCondition: string
{
    case Cash = 'cash';      // Contado (payment_amount >= total al crear)
    case Credit = 'credit';  // Cuenta corriente (queda saldo al crear)

    /** Etiqueta visible para el usuario (español). */
    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Contado',
            self::Credit => 'Cuenta corriente',
        };
    }
}
