<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Presupuesto extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'ptoventa',
        'letracomprobante',
        'numpresupuesto',
        'cuit',
        'fecha',
        'bonificacion',
        'recargo',
        'subtotal',
        'total',
        'cliente_id',
        'user_id',
    ];

    protected $casts = [
        'fecha' => 'date',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function articulos()
    {
        return $this->belongsToMany(Articulo::class, 'articulo_presupuesto')
                    ->withPivot(['codprov', 'codarticulo', 'articulo', 'medida', 'cantidad', 'bonificacion', 'alicuota', 'preciounitario', 'subtotal'])
                    ->withTimestamps();
    }
}
