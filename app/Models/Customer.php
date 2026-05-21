<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'business_name',
        'fantasy_name',
        'person_type',
        'tax_id',
        'dni',
        'phone',
        'cellphone',
        'email',
        'address',
        'zip_code',
        'city_id',
        'state_id',
        'tax_status',
        'fiscal_name',
        'fiscal_address',
        'notes',
        'credit',
        'active',
    ];

    protected $casts = [
        'tax_id'  => 'string',
        'dni'     => 'string',
        'credit'  => 'decimal:2',
        'active'  => 'boolean',
    ];

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
