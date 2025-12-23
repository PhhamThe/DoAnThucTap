<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->boolean('chat_enabled')->default(true);
            $table->boolean('chat_teacher_only')->default(false);
            $table->timestamp('last_message_at')->nullable();
            $table->foreignId('last_message_id')->nullable()->constrained('messages')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropColumn(['chat_enabled', 'chat_teacher_only', 'last_message_at', 'last_message_id']);
        });
    }
};