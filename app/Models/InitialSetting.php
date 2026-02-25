<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InitialSetting extends Model
{
    protected $table = 'inicialsettings';

    protected $fillable = [
        'cuit',
        'razonsocial',
        'direccion',
        'telefono',
        'email',
        'codigopostal',
        'localidad',
        'provincia',
        'condicioniva',
        'iibb',
        'inicioactividades',
        'puntoventa',
        'afip_ambiente',
        'nombrefantasia',
        'domiciliocomercial',
        'tagline',
        'logo',
        'numfactura',
        'numremito',
        'numpresupuesto',
        'numpago',
        'numrecibo',
    ];

    protected $casts = [
        'cuit' => 'string',
        'codigopostal' => 'integer',
        'puntoventa' => 'integer',
        'numfactura' => 'integer',
        'numremito' => 'integer',
        'numpresupuesto' => 'integer',
        'numpago' => 'integer',
        'numrecibo' => 'integer',
    ];
}