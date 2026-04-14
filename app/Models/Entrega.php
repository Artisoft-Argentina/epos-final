<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Entrega extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'factura_id',
        'articulo_id',
        'cantidad',
        'fecha_entrega',
        'observaciones',
        'estado',
        'fecha_entrega_real',
    ];

    protected $casts = [
        'fecha_entrega' => 'date',
        'fecha_entrega_real' => 'datetime',
    ];

    // Scopes
    public function scopePendientes($query)
    {
        return $query->where('estado', 'pendiente');
    }

    public function scopeEntregadas($query)
    {
        return $query->where('estado', 'entregada');
    }

    // Relaciones
    public function factura()
    {
        return $this->belongsTo(Factura::class);
    }

    public function articulo()
    {
        return $this->belongsTo(Articulo::class);
    }

    // Métodos
    public function marcarComoEntregada()
    {
        $this->update([
            'estado' => 'entregada',
            'fecha_entrega_real' => now(),
        ]);
    }

    public function isPendiente()
    {
        return $this->estado === 'pendiente';
    }

    public function isEntregada()
    {
        return $this->estado === 'entregada';
    }

    public function movimientos()
    {
        return $this->morphMany(Movimiento::class, 'referenciable');
    }
}
