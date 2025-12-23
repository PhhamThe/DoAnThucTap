<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_id',
        'sender_id',
        'message',
        'message_type',
        'file_path',
        'file_name',
        'file_size',
        'file_mime',
        'is_read'
    ];

    protected $casts = [
        'is_read' => 'boolean'
    ];

    // Quan hệ với lớp học
    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    // Quan hệ với người gửi (user)
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    // Quan hệ với bản ghi đã đọc
    public function reads()
    {
        return $this->hasMany(MessageRead::class, 'message_id');
    }
}