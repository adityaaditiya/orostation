<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::create([
            'name' => 'Aditya',
            'email' => 'aditya@gmail.com',
            'password' => bcrypt('password'),
        ]);

        // get admin role
        $role = Role::where('name', 'super-admin')->first();

        // get all permissions
        $permissions = Permission::all();

        // assign role to user
        $user->syncPermissions($permissions);

        // assign a role to user
        $user->assignRole($role);

        $cashier = User::create([
            'name' => 'cashier',
            'email' => 'cashier@gmail.com',
            'password' => bcrypt('password'),
        ]);

        $cashierRole = Role::where('name', 'cashier')->first();

        if ($cashierRole) {
            $cashier->assignRole($cashierRole);
        }
    }
}
