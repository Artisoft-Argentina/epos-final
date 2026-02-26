<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\User;

return new class extends Migration
{
    public function up(): void
    {
        // Asignar rol de Usuario (ID 3) a todos los usuarios que no tienen rol
        User::whereNull('role_id')->update(['role_id' => 3]);
    }

    public function down(): void
    {
        // No revertir
    }
};
