<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class State extends Model
{
    use SoftDeletes, HasUuids;

    protected $fillable = ['name', 'afip_id', 'active'];

    protected $casts = ['active' => 'boolean'];

    public function cities()
    {
        return $this->hasMany(City::class);
    }
}
