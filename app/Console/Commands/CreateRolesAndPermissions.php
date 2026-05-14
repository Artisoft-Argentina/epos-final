<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class CreateRolesAndPermissions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:create-roles-and-permissions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create roles and permissions, and assign those roles to users';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $permissions = config('custom.permissions');
        
        if (empty($permissions)) {
            $this->warn('No permissions configuration found.');
            return Command::SUCCESS;
        }

        foreach ($permissions as $role_name => $values) {
            $role = Role::findOrCreate($role_name, 'web');
            $this->info("Role created: {$role->name}");

            $validPermissions = collect($values)->filter()->unique();
            
            // Batch create permissions
            foreach ($validPermissions as $permissionName) {
                Permission::findOrCreate($permissionName, 'web');
            }

            // Sync all permissions at once
            $role->syncPermissions($validPermissions->toArray());

            if ($validPermissions->isNotEmpty()) {
                $this->info("Permissions assigned to {$role->name}: " . $validPermissions->implode(', '));
            }
        }

        return Command::SUCCESS;
    }
}

