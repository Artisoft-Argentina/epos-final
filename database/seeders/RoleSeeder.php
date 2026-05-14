<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = config('custom.permissions');

        foreach ($permissions as $role_name => $values) {
            $role = Role::findOrCreate($role_name);

            $validPermissions = collect($values)->filter()->unique();

            foreach ($validPermissions as $permissionName) {
                Permission::findOrCreate($permissionName);
            }

            $role->syncPermissions($validPermissions->toArray());
        }
    }
}
