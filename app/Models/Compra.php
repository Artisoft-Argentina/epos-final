<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Compra extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'numero_remito',
        'fecha',
        'supplier_id',
        'subtotal',
        'total',
        'observaciones',
    ];

    protected $casts = [
        'fecha' => 'date',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function detalles()
    {
        return $this->hasMany(CompraDetalle::class);
    }
}