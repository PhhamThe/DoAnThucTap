<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        /**
         * 1. Tạo bảng pivot major_subject
         */
        Schema::create('major_subject', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('major_id');
            $table->unsignedBigInteger('subject_id');
            $table->timestamps();

            $table->unique(['major_id', 'subject_id']);

            $table->foreign('major_id')->references('id')->on('majors')->onDelete('cascade');
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
        });

        /**
         * 2. Di chuyển dữ liệu từ subjects.major_id sang bảng major_subject
         */
        $subjects = DB::table('subjects')->select('id', 'major_id')->get();

        foreach ($subjects as $subject) {
            if ($subject->major_id) {
                DB::table('major_subject')->insert([
                    'major_id'   => $subject->major_id,
                    'subject_id' => $subject->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        /**
         * 3. Xóa khóa ngoại và xóa cột major_id
         */
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropForeign(['major_id']);
            $table->dropColumn('major_id');
        });
    }

    public function down(): void
    {
        /**
         * 1. Thêm lại cột major_id vào bảng subjects
         */
        Schema::table('subjects', function (Blueprint $table) {
            $table->foreignId('major_id')
                ->nullable()
                ->constrained('majors')
                ->onDelete('set null');
        });

        /**
         * 2. Di chuyển dữ liệu ngược lại từ pivot về subjects.major_id
         * (Chỉ lấy 1 major — trường hợp nhiều major thì lấy major đầu tiên)
         */
        $pivotData = DB::table('major_subject')->get();

        foreach ($pivotData as $row) {
            DB::table('subjects')
                ->where('id', $row->subject_id)
                ->update(['major_id' => $row->major_id]);
        }

        /**
         * 3. Xóa bảng pivot
         */
        Schema::dropIfExists('major_subject');
    }
};
