<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SalePayment extends Model
{
    use SoftDeletes;

    /** Métodos de pago aceptados. Fuente única de verdad para validación back y front. */
    public const METHODS = [
        'efectivo',
        'tarjeta_debito',
        'tarjeta_credito',
        'transferencia',
        'mercadopago',
        'cheque',
    ];

    protected $fillable = [
        'sale_id',
        'amount',
        'payment_method',
        'payment_date',
        'notes',
        'user_id',
        'active',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'amount'       => 'decimal:2',
        'active'       => 'boolean',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
