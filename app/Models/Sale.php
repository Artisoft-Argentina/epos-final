<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Sale extends Model
{
    use SoftDeletes, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logFillable();
    }

    protected $fillable = [
        'pos_number',
        'voucher_code',
        'voucher_letter',
        'invoice_number',
        'tax_id',
        'date',
        'discount',
        'surcharge',
        'additional_discount',
        'subtotal',
        'total',
        'payment_status',
        'sale_condition',
        'afip_voucher',
        'cae',
        'cae_expiration',
        'due_date',
        'barcode_string',
        'payment_code',
        'sale_type',
        'afip_authorized',
        'customer_id',
        'user_id',
        'price_list_id',
        'active',
    ];

    protected $casts = [
        'date'            => 'date',
        'due_date'        => 'date',
        'cae_expiration'  => 'date',
        'tax_id'          => 'string',
        'afip_authorized' => 'boolean',
        'active'          => 'boolean',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function priceList()
    {
        return $this->belongsTo(PriceList::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'sale_products')
                    ->withPivot(['supplier_code', 'sku', 'name', 'unit', 'quantity', 'discount', 'tax_rate', 'unit_price', 'subtotal'])
                    ->withTimestamps();
    }

    public function payments()
    {
        return $this->hasMany(SalePayment::class);
    }

    public function deliveries()
    {
        return $this->hasMany(Delivery::class);
    }

    public function movements()
    {
        return $this->morphMany(StockMovement::class, 'referenceable');
    }

    public function getTotalPaidAttribute()
    {
        return $this->payments->sum('amount');
    }

    public function getPendingBalanceAttribute()
    {
        return $this->total - $this->total_paid;
    }
}
