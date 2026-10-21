<?php

namespace App\Services;

use App\Models\PointOfSale;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class InvoiceNumberService
{
    public function next(PointOfSale $pos, string $letter): int
    {
        $letter = strtoupper($letter);
        if (! in_array($letter, ['A', 'B', 'C'], true)) {
            throw new InvalidArgumentException("Letra de comprobante inválida: {$letter}");
        }

        return DB::transaction(function () use ($pos, $letter) {
            $locked = PointOfSale::lockForUpdate()->find($pos->id);

            // La columna es minúscula (next_invoice_number_a). Con la letra en
            // mayúscula el atributo no existe: se leía null (número 0) y el
            // update quedaba fuera de $fillable, así que el contador no avanzaba.
            $column = 'next_invoice_number_' . strtolower($letter);
            $number = (int) $locked->$column;

            if ($number < 1) {
                throw new RuntimeException("El punto de venta {$locked->pos_number} no tiene inicializado el contador de comprobantes {$letter}.");
            }

            $locked->update([$column => $number + 1]);

            return $number;
        });
    }
}
