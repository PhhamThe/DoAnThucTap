<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('final_grades', function (Blueprint $table) {
            $table->id();
            
            // Tham chiếu
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('class_id')->constrained()->onDelete('cascade');
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            
            // Điểm thành phần (lấy từ bảng grades)
            $table->decimal('attendance_score', 5, 2)->default(0);
            $table->decimal('assignment_score', 5, 2)->default(0);
            $table->decimal('midterm_score', 5, 2)->default(0);
            $table->decimal('final_score', 5, 2)->default(0);
            
            // Điểm tổng kết
            $table->decimal('total_score', 5, 2)->nullable()->comment('Điểm tổng kết');
            $table->string('letter_grade', 5)->nullable()->comment('Điểm chữ: A, B, C, D, F');
            
            // Tiến độ học (link với subject_progress)
            $table->decimal('video_progress', 5, 2)->default(0)
                  ->comment('Tiến độ video (%) - từ subject_progress');
            
            // Điều kiện thi
            $table->boolean('can_take_final')->default(false)
                  ->comment('Được phép thi cuối kỳ không');
            
            // Trạng thái
            $table->enum('status', ['in_progress', 'passed', 'failed', 'incomplete'])
                  ->default('in_progress');
            
            // Thông tin tính toán
            $table->timestamp('calculated_at')->nullable();
            $table->text('calculation_notes')->nullable();
            
            $table->timestamps();
            
            // Constraint
            $table->unique(['student_id', 'class_id']);
            
            // Index
            $table->index(['student_id', 'status']);
            $table->index(['class_id', 'status']);
            $table->index(['subject_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('final_grades');
    }
};