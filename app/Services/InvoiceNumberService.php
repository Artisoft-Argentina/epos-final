<?php

namespace App\Services;

use App\Models\PointOfSale;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

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
            $column = "next_invoice_number_{$letter}";
            $number = (int) $locked->$column;
            $locked->update([$column => $number + 1]);
            return $number;
        });
    }
}
