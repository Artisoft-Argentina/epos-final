<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Factura extends Model
{
    use SoftDeletes, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logFillable();
    }

    protected $fillable = [
        'ptoventa',
        'codcomprobante',
        'letracomprobante',
        'numfactura',
        'cuit',
        'fecha',
        'bonificacion',
        'recargo',
        'descuento',
        'subtotal',
        'total',
        'pagada',
        'condicionventa',
        'comprobanteafip',
        'cae',
        'fechavto',
        'codbarra',
        'cliente_id',
        'user_id',
        'compago',
        'lista_precio_id',
        'tipo_venta',
        'vencimiento_cae',
        'autorizada_afip',
    ];

    protected $casts = [
        'fecha' => 'date',
        'fechavto' => 'date',
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
        return $this->belongsToMany(Articulo::class, 'articulo_factura')
                    ->withPivot(['codprov', 'codarticulo', 'articulo', 'medida', 'cantidad', 'bonificacion', 'alicuota', 'preciounitario', 'subtotal'])
                    ->withTimestamps();
    }

    public function pagos()
    {
        return $this->hasMany(FacturaPago::class);
    }

    public function getTotalPagadoAttribute()
    {
        return $this->pagos->sum('monto');
    }

    public function getSaldoPendienteAttribute()
    {
        return $this->total - $this->total_pagado;
    }

    public function entregas()
    {
        return $this->hasMany(Entrega::class);
    }

    public function listaPrecio()
    {
        return $this->belongsTo(ListaPrecio::class);
    }

    public function movimientos()
    {
        return $this->morphMany(Movimiento::class, 'referenciable');
    }
}
