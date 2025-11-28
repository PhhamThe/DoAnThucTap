<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('lesson_progress', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('lesson_id');
            $table->integer('watched_seconds')->default(0);
            $table->boolean('is_completed')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->foreign('student_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('lesson_id')->references('id')->on('lessons')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('lesson_progress');
    }
};
