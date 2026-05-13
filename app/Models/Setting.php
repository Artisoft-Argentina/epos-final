<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Setting extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'tax_id',
        'business_name',
        'address',
        'phone',
        'email',
        'zip_code',
        'city_id',
        'state_id',
        'tax_status',
        'gross_income_tax',
        'activity_start_date',
        'pos_number',
        'afip_environment',
        'trade_name',
        'commercial_address',
        'tagline',
        'logo',
        'next_invoice_number',
        'next_order_number',
        'next_quote_number',
        'next_payment_number',
        'next_receipt_number',
        'mp_access_token',
        'mp_public_key',
        'mp_environment',
        'default_ecommerce_warehouse_id',
        'default_ecommerce_point_of_sale_id',
        'active',
    ];

    protected $casts = [
        'tax_id'               => 'string',
        'zip_code'             => 'string',
        'pos_number'           => 'integer',
        'next_invoice_number'  => 'integer',
        'next_order_number'    => 'integer',
        'next_quote_number'    => 'integer',
        'next_payment_number'  => 'integer',
        'next_receipt_number'  => 'integer',
        'active'               => 'boolean',
    ];

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    public function state()
    {
        return $this->belongsTo(State::class);
    }

    public function defaultEcommerceWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'default_ecommerce_warehouse_id');
    }

    public function defaultEcommercePointOfSale()
    {
        return $this->belongsTo(PointOfSale::class, 'default_ecommerce_point_of_sale_id');
    }
}
