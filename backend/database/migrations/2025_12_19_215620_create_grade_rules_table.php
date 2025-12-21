<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_rules', function (Blueprint $table) {
            $table->id();
            
            // Tham chiếu
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->foreignId('class_id')->nullable()->constrained()->onDelete('cascade');
            
            // Cấu hình điểm
            $table->decimal('pass_grade', 5, 2)->default(5.0)->comment('Điểm đậu tối thiểu');
            
            // Điều kiện thi cuối kỳ
            $table->decimal('min_video_progress', 5, 2)->default(80.0)
                  ->comment('Tiến độ video tối thiểu (%) để được thi cuối kỳ');
            $table->boolean('require_video_progress')->default(false)
                  ->comment('Có yêu cầu tiến độ video không');
            $table->integer('min_assignments')->default(0)
                  ->comment('Số bài tập tối thiểu phải nộp');
            $table->integer('min_attendance_rate')->default(80)
                  ->comment('Tỷ lệ chuyên cần tối thiểu (%)');
            
            // Trọng số (lưu dạng JSON để linh hoạt)
            $table->json('weights')->nullable()->comment('VD: {"attendance":10,"assignment":20,"midterm":20,"final":50}');
            
            // Thông tin khác
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            // Unique: mỗi môn/lớp chỉ có 1 quy tắc
            $table->unique(['subject_id', 'class_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_rules');
    }
};