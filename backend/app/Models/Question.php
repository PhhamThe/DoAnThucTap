<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'quiz_id',
        'question_text',
        'question_type',
    ];

    // Mỗi câu hỏi thuộc về một đề thi
    public function quiz()
    {
        return $this->belongsTo(Quiz::class);
    }

    // 1 câu hỏi có nhiều đáp án
    public function answers()
    {
        return $this->hasMany(Answer::class);
    }

    // Đáp án sinh viên chọn
    public function studentAnswers()
    {
        return $this->hasMany(StudentAnswer::class);
    }
}
