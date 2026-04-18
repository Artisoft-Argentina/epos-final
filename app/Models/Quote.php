<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Quote extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'pos_number',
        'voucher_letter',
        'quote_number',
        'tax_id',
        'date',
        'discount',
        'surcharge',
        'subtotal',
        'total',
        'expiration_date',
        'customer_id',
        'user_id',
        'active',
    ];

    protected $casts = [
        'date'   => 'date',
        'active' => 'boolean',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_quotes')
                    ->withPivot(['supplier_code', 'sku', 'name', 'unit', 'quantity', 'discount', 'tax_rate', 'unit_price', 'subtotal'])
                    ->withTimestamps();
    }
}
