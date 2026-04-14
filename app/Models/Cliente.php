<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cliente extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'razonsocial',
        'documentounico',
        'direccion',
        'telefono',
        'email',
        'codigopostal',
        'localidad',
        'provincia',
        'condicioniva',
    ];

    /**
     * Accessor para obtener CUIT (alias de documentounico)
     */
    public function getCuitAttribute(): ?string
    {
        return $this->documentounico ? (string) $this->documentounico : null;
    }

    public function facturas()
    {
        return $this->hasMany(Factura::class);
    }
}
