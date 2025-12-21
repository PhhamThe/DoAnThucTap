<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            
            // Tham chiếu 
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('class_id')->constrained()->onDelete('cascade');
            
            // Điểm 
            $table->string('type', 20)->comment('Loại: attendance, assignment, midterm, final');
            $table->decimal('score', 5, 2)->comment('Điểm số (ví dụ: 8.5/10)');
            $table->decimal('max_score', 5, 2)->default(10.0)->comment('Điểm tối đa');
            
            // Người nhập điểm
            $table->foreignId('teacher_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamp('graded_at')->nullable();
            
            // Trạng thái 
            $table->boolean('is_finalized')->default(true)->comment('Điểm đã chốt');
            $table->text('notes')->nullable()->comment('Ghi chú');
            
            $table->timestamps();
            
            // mỗi sinh viên chỉ có 1 điểm cho từng loại trong lớp
            $table->unique(['student_id', 'class_id', 'type'], 'unique_student_class_grade');
            
            // Index
            $table->index(['student_id', 'class_id']);
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};