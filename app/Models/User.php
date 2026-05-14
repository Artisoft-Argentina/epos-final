<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'point_of_sale_id',
    ];

    protected $appends = ['role_id'];

    public function getRoleIdAttribute(): ?int
    {
        return $this->roles->first()?->id;
    }

    public function primaryRole()
    {
        return $this->roles->first();
    }

    public function pointOfSale()
    {
        return $this->belongsTo(PointOfSale::class);
    }

    public function isVendedor(): bool
    {
        return $this->primaryRole()?->name === 'vendedor';
    }

    public function isAdmin(): bool
    {
        return in_array($this->primaryRole()?->name, ['admin', 'superadmin'], true);
    }

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
