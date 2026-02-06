<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
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
