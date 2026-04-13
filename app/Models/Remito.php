<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Remito extends Model
{
    protected $fillable = [
        'ptoventa',
        'numremito',
        'fecha',
        'recargo',
        'bonificacion',
        'subtotal',
        'total',
        'supplier_id',
        'user_id',
        'convertido_inventario',
    ];

    protected $casts = [
        'fecha' => 'date',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function detalles()
    {
        return $this->hasMany(ArticuloRemito::class);
    }

    public function movimientos()
    {
        return $this->morphMany(Movimiento::class, 'referenciable');
    }
}