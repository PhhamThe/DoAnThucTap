<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ChatParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_id',
        'user_id',
        'role',
        'is_active',
        'joined_at',
        'last_seen',
        'unread_count'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'joined_at' => 'datetime',
        'last_seen' => 'datetime',
        'unread_count' => 'integer'
    ];

    // Quan hệ với lớp học
    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    // Quan hệ với người dùng
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}