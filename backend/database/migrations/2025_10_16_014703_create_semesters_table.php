<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('semesters', function (Blueprint $table) {
            $table->id();
            $table->string('name');                // Ví dụ: "Học kỳ 1"
            $table->integer('year');               // Ví dụ: 2025
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();
        });

        // Thêm cột semester_id vào bảng classes
        Schema::table('classes', function (Blueprint $table) {
            $table->foreignId('semester_id')
                ->after('teacher_id')
                ->constrained('semesters')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropForeign(['semester_id']);
            $table->dropColumn('semester_id');
        });

        Schema::dropIfExists('semesters');
    }
};
