<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_components', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique()->comment('Mã loại: attendance, assignment, midterm, final');
            $table->string('name', 100)->comment('Tên loại điểm');
            $table->decimal('default_weight', 5, 2)->default(0)->comment('Trọng số mặc định (%)');
            $table->text('description')->nullable()->comment('Mô tả');
            $table->boolean('is_active')->default(true);
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        // Dữ liệu mẫu
        DB::table('grade_components')->insert([
            [
                'code' => 'attendance',
                'name' => 'Chuyên cần',
                'default_weight' => 10,
                'description' => 'Điểm chuyên cần, điểm danh',
                'order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'assignment',
                'name' => 'Bài tập',
                'default_weight' => 20,
                'description' => 'Điểm bài tập về nhà, bài thực hành',
                'order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'midterm',
                'name' => 'Giữa kỳ',
                'default_weight' => 20,
                'description' => 'Điểm thi giữa kỳ',
                'order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'final',
                'name' => 'Cuối kỳ',
                'default_weight' => 50,
                'description' => 'Điểm thi cuối kỳ',
                'order' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_components');
    }
};