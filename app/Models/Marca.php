<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Marca extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'marca',
    ];

    public function articulos()
    {
        return $this->hasMany(Articulo::class);
    }
}
