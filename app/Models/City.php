<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class City extends Model
{
    use SoftDeletes;

    protected $fillable = ['name', 'state_id', 'afip_id', 'active'];

    protected $casts = ['active' => 'boolean'];

    public function state()
    {
        return $this->belongsTo(State::class);
    }
}
