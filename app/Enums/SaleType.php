<?php

namespace App\Enums;

/**
 * Origen de la venta. Se fija al crear y no transiciona.
 * Ramifica la creación de entregas (ecommerce siempre pendiente).
 */
enum SaleType: string
{
    case Pos = 'pos';
    case Ecommerce = 'ecommerce';

    /** Etiqueta visible para el usuario (español). */
    public function label(): string
    {
        return match ($this) {
            self::Pos => 'POS',
            self::Ecommerce => 'Ecommerce',
        };
    }
}
