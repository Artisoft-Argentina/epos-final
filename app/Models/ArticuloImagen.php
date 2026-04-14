<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ArticuloImagen extends Model
{
    use SoftDeletes;

    protected $table = 'articulo_imagenes';

    protected $fillable = [
        'articulo_id',
        'nombre_archivo',
        'ruta',
        'ruta_thumb',
        'es_principal',
        'orden'
    ];

    protected $casts = [
        'es_principal' => 'boolean'
    ];

    public function articulo(): BelongsTo
    {
        return $this->belongsTo(Articulo::class);
    }

    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->ruta);
    }

    public function getUrlThumbAttribute(): ?string
    {
        return $this->ruta_thumb ? asset('storage/' . $this->ruta_thumb) : null;
    }

    protected $appends = ['url', 'url_thumb'];
}
