<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FacturaPago extends Model
{
    use SoftDeletes;

    protected $table = 'factura_pagos';

    protected $fillable = [
        'factura_id',
        'monto',
        'metodo_pago',
        'fecha_pago',
        'observaciones',
    ];

    protected $casts = [
        'fecha_pago' => 'date',
    ];

    public function factura()
    {
        return $this->belongsTo(Factura::class);
    }
}
