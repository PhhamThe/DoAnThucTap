<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_id',
        'title',
        'time_limit',
        'start_time',
        'end_time',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    // Mỗi đề thi thuộc về 1 lớp
    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    // 1 đề thi có nhiều câu hỏi
    public function questions()
    {
        return $this->hasMany(Question::class);
    }

    // 1 đề thi có nhiều kết quả của sinh viên
    public function results()
    {
        return $this->hasMany(QuizResult::class);
    }
}
