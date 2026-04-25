<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrderProduct extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'supplier_code',
        'sku',
        'name',
        'unit',
        'quantity',
        'discount',
        'tax_rate',
        'unit_price',
        'subtotal',
        'batch',
        'product_id',
        'order_id',
        'active',
    ];

    protected $casts = ['active' => 'boolean'];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
