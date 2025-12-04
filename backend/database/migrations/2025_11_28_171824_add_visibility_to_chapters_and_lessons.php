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
        Schema::table('chapters', function (Blueprint $table) {
            $table->boolean('is_public')->default(false);
            $table->unsignedBigInteger('owner_teacher_id')->nullable();

            $table->foreign('owner_teacher_id')->references('id')->on('teachers');
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->boolean('is_public')->default(false);
            $table->unsignedBigInteger('owner_teacher_id')->nullable();
            $table->foreign('owner_teacher_id')->references('id')->on('teachers');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chapters_and_lessons', function (Blueprint $table) {
            //
        });
    }
};
