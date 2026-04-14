<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Movimiento extends Model
{
    use SoftDeletes;

    // Tipos de movimiento (enum)
    const TIPO_ENTRADA_COMPRA    = 'entrada_compra';
    const TIPO_ENTRADA_ASISTENTE = 'entrada_asistente';
    const TIPO_ENTRADA_AJUSTE    = 'entrada_ajuste';
    const TIPO_SALIDA_ENTREGA    = 'salida_entrega';
    const TIPO_SALIDA_VENTA_POS  = 'salida_venta_pos';
    const TIPO_SALIDA_AJUSTE     = 'salida_ajuste';
    const TIPO_DEVOLUCION        = 'devolucion';

    const TIPOS = [
        self::TIPO_ENTRADA_COMPRA    => 'Ingreso por remito de compra',
        self::TIPO_ENTRADA_ASISTENTE => 'Ingreso por asistente IA',
        self::TIPO_ENTRADA_AJUSTE    => 'Ajuste manual positivo',
        self::TIPO_SALIDA_ENTREGA    => 'Egreso por entrega',
        self::TIPO_SALIDA_VENTA_POS  => 'Egreso por venta POS directa',
        self::TIPO_SALIDA_AJUSTE     => 'Ajuste manual negativo',
        self::TIPO_DEVOLUCION        => 'Devolución / reversión',
    ];

    const TIPOS_ENTRADA = [
        self::TIPO_ENTRADA_COMPRA,
        self::TIPO_ENTRADA_ASISTENTE,
        self::TIPO_ENTRADA_AJUSTE,
        self::TIPO_DEVOLUCION,
    ];

    const TIPOS_SALIDA = [
        self::TIPO_SALIDA_ENTREGA,
        self::TIPO_SALIDA_VENTA_POS,
        self::TIPO_SALIDA_AJUSTE,
    ];

    protected $fillable = [
        'inventario_id',
        'user_id',
        'tipo',
        'cantidad',
        'referenciable_type',
        'referenciable_id',
        'motivo',
        'numcomprobante',
        'fecha',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function inventario(): BelongsTo
    {
        return $this->belongsTo(Inventario::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function referenciable(): MorphTo
    {
        return $this->morphTo();
    }

    public function esEntrada(): bool
    {
        return in_array($this->tipo, self::TIPOS_ENTRADA);
    }

    public function esSalida(): bool
    {
        return in_array($this->tipo, self::TIPOS_SALIDA);
    }

    public function getDescripcionTipoAttribute(): string
    {
        return self::TIPOS[$this->tipo] ?? $this->tipo;
    }

    // Scopes
    public function scopeEntradas($query)
    {
        return $query->whereIn('tipo', self::TIPOS_ENTRADA);
    }

    public function scopeSalidas($query)
    {
        return $query->whereIn('tipo', self::TIPOS_SALIDA);
    }
}
