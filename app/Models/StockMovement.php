<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class StockMovement extends Model
{
    use SoftDeletes;

    const TYPE_PURCHASE_ENTRY   = 'purchase_entry';
    const TYPE_ASSISTANT_ENTRY  = 'assistant_entry';
    const TYPE_ADJUSTMENT_ENTRY = 'adjustment_entry';
    const TYPE_DELIVERY_EXIT    = 'delivery_exit';
    const TYPE_POS_SALE_EXIT    = 'pos_sale_exit';
    const TYPE_ADJUSTMENT_EXIT  = 'adjustment_exit';
    const TYPE_RETURN           = 'return';

    const TYPES = [
        self::TYPE_PURCHASE_ENTRY   => 'Ingreso por orden de compra',
        self::TYPE_ASSISTANT_ENTRY  => 'Ingreso por asistente IA',
        self::TYPE_ADJUSTMENT_ENTRY => 'Ajuste manual positivo',
        self::TYPE_DELIVERY_EXIT    => 'Egreso por entrega',
        self::TYPE_POS_SALE_EXIT    => 'Egreso por venta POS directa',
        self::TYPE_ADJUSTMENT_EXIT  => 'Ajuste manual negativo',
        self::TYPE_RETURN           => 'Devolución / reversión',
    ];

    const ENTRY_TYPES = [
        self::TYPE_PURCHASE_ENTRY,
        self::TYPE_ASSISTANT_ENTRY,
        self::TYPE_ADJUSTMENT_ENTRY,
        self::TYPE_RETURN,
    ];

    const EXIT_TYPES = [
        self::TYPE_DELIVERY_EXIT,
        self::TYPE_POS_SALE_EXIT,
        self::TYPE_ADJUSTMENT_EXIT,
    ];

    protected $fillable = [
        'stock_id',
        'user_id',
        'type',
        'quantity',
        'referenceable_type',
        'referenceable_id',
        'reason',
        'voucher_number',
        'date',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function stock(): BelongsTo
    {
        return $this->belongsTo(Stock::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function referenceable(): MorphTo
    {
        return $this->morphTo();
    }

    public function isEntry(): bool
    {
        return in_array($this->type, self::ENTRY_TYPES);
    }

    public function isExit(): bool
    {
        return in_array($this->type, self::EXIT_TYPES);
    }

    public function getTypeDescriptionAttribute(): string
    {
        return self::TYPES[$this->type] ?? $this->type;
    }

    public function scopeEntries($query)
    {
        return $query->whereIn('type', self::ENTRY_TYPES);
    }

    public function scopeExits($query)
    {
        return $query->whereIn('type', self::EXIT_TYPES);
    }
}
