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

    /** Etiqueta visible de cada método. Mismas claves que METHODS. */
    public const METHOD_LABELS = [
        'efectivo'        => 'Efectivo',
        'tarjeta_debito'  => 'Tarjeta de Débito',
        'tarjeta_credito' => 'Tarjeta de Crédito',
        'transferencia'   => 'Transferencia',
        'mercadopago'     => 'MercadoPago',
        'cheque'          => 'Cheque',
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

    /** Etiqueta del método de pago; cae al valor crudo si es uno legacy. */
    public function methodLabel(): string
    {
        return self::METHOD_LABELS[$this->payment_method] ?? (string) $this->payment_method;
    }
}
