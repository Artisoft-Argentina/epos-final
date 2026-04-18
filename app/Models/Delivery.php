<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Delivery extends Model
{
    use SoftDeletes;

    const STATUS_PENDING   = 'pending';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'sale_id',
        'product_id',
        'quantity',
        'delivery_date',
        'notes',
        'status',
        'actual_delivery_date',
        'active',
    ];

    protected $casts = [
        'delivery_date'        => 'date',
        'actual_delivery_date' => 'datetime',
        'active'               => 'boolean',
    ];

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeDelivered($query)
    {
        return $query->where('status', self::STATUS_DELIVERED);
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function markAsDelivered(): void
    {
        $this->update([
            'status'               => self::STATUS_DELIVERED,
            'actual_delivery_date' => now(),
        ]);
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isDelivered(): bool
    {
        return $this->status === self::STATUS_DELIVERED;
    }

    public function movements()
    {
        return $this->morphMany(StockMovement::class, 'referenceable');
    }
}
