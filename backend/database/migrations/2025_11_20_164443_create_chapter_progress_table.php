<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  
    public function up()
    {
        Schema::create('chapter_progress', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('chapter_id');
            $table->decimal('progress', 5, 2)->default(0.00);

            $table->boolean('is_completed')->default(0);
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            // Foreign keys
            $table->foreign('student_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('chapter_id')->references('id')->on('chapters')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('chapter_progress');
    }
};
