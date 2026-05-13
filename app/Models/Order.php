<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'pos_number',
        'order_number',
        'date',
        'surcharge',
        'discount',
        'subtotal',
        'total',
        'supplier_receipt_number',
        'notes',
        'converted_to_inventory',
        'supplier_id',
        'warehouse_id',
        'user_id',
        'active',
    ];

    protected $casts = [
        'date'                   => 'date',
        'converted_to_inventory' => 'boolean',
        'active'                 => 'boolean',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function products()
    {
        return $this->hasMany(OrderProduct::class);
    }

    public function movements()
    {
        return $this->morphMany(StockMovement::class, 'referenceable');
    }
}
