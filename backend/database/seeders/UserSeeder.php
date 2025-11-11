<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('users')->insert([
            [
                'username' => 'admin',
                'password' => Hash::make('123456'),
                'full_name' => 'Quản trị viên',
                'email' => 'admin@example.com',
                'role' => 'admin',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'username' => 'teacher1',
                'password' => Hash::make('123456'),
                'full_name' => 'Giáo viên A',
                'email' => 'teacher1@example.com',
                'role' => 'teacher',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'username' => 'student1',
                'password' => Hash::make('123456'),
                'full_name' => 'Sinh viên 1',
                'email' => 'student1@example.com',
                'role' => 'student',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'username' => 'student2',
                'password' => Hash::make('123456'),
                'full_name' => 'Sinh viên 2',
                'email' => 'student2@example.com',
                'role' => 'student',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
