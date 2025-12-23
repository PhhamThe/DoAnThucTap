<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MessageRead extends Model
{
    use HasFactory;

    protected $fillable = [
        'message_id',
        'user_id',
        'read_at'
    ];

    protected $casts = [
        'read_at' => 'datetime'
    ];

    // Quan hệ với tin nhắn
    public function message()
    {
        return $this->belongsTo(Message::class, 'message_id');
    }

    // Quan hệ với người dùng
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}