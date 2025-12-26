<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Thêm cột major_id sau cột user_id
            $table->unsignedBigInteger('major_id')->nullable()->after('user_id');
            
            // Thêm khóa ngoại
            $table->foreign('major_id')
                  ->references('id')
                  ->on('majors')
                  ->onDelete('set null') 
                  ->onUpdate('cascade');
            
            // Thêm index để tối ưu query
            $table->index('major_id');
        });
    }


    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['major_id']);
            
            // Xóa index
            $table->dropIndex(['major_id']);
            
            // Xóa cột
            $table->dropColumn('major_id');
        });
    }
};