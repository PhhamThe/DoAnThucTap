<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('chapter_id');
            $table->string('title', 255);
            $table->longText('content')->nullable();
            $table->string('video_url', 500)->nullable();
            $table->string('attachment', 500)->nullable();
            $table->integer('position')->default(0);
            $table->timestamps();

            // Khóa ngoại
            $table->foreign('chapter_id')
                ->references('id')->on('chapters')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};
