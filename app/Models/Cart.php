<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'articulo_id',
        'quantity',
        'session_id',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'user_id' => 'integer',
            'articulo_id' => 'integer',
        ];
    }

    public function articulo()
    {
        return $this->belongsTo(Articulo::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
