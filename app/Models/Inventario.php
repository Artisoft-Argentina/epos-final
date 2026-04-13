<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Inventario extends Model
{
    protected $fillable = [
        'cantidad',
        'lote',
        'vencimiento',
        'articulo_id',
        'supplier_id',
    ];

    protected $casts = [
        'vencimiento' => 'date',
    ];

    public function articulo()
    {
        return $this->belongsTo(Articulo::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(Movimiento::class);
    }

    /**
     * Calcula el stock a partir de la suma algebraica de movimientos registrados.
     * Útil para auditoría y verificación de consistencia.
     */
    public function stockCalculado(): int
    {
        $entradas = $this->movimientos()->entradas()->sum('cantidad');
        $salidas  = $this->movimientos()->salidas()->sum('cantidad');
        return (int) ($entradas - $salidas);
    }
}
