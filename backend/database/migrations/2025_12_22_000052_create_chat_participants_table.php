<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('chat_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('role', ['teacher', 'student'])->default('student');
            $table->boolean('is_active')->default(true);
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('last_seen')->nullable();
            $table->integer('unread_count')->default(0);
            $table->timestamps();
            
            $table->unique(['class_id', 'user_id']);
            $table->index('class_id');
            $table->index('user_id');
            $table->index('last_seen');
        });
    }

    public function down()
    {
        Schema::dropIfExists('chat_participants');
    }
};