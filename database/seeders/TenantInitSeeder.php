<?php

namespace Database\Seeders;

use App\Models\State;
use Illuminate\Database\Seeder;

class TenantInitSeeder extends Seeder
{
    public function run(): void
    {
        if (State::count() === 0) {
            $this->call(StatesSeeder::class);
        }
    }
}
