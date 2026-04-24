<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'business_name',
        'tax_id',
        'address',
        'phone',
        'email',
        'zip_code',
        'city_id',
        'state_id',
        'tax_status',
        'credit',
        'active',
    ];

    protected $casts = [
        'tax_id'  => 'string',
        'credit'  => 'decimal:2',
        'active'  => 'boolean',
    ];

    public function getCuitAttribute(): ?string
    {
        return $this->tax_id ? (string) $this->tax_id : null;
    }

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    public function state()
    {
        return $this->belongsTo(State::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function quotes()
    {
        return $this->hasMany(Quote::class);
    }
}
