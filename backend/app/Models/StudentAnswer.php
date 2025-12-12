<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'result_id',
        'question_id',
        'answer_id',
    ];

    // Lần làm bài
    public function result()
    {
        return $this->belongsTo(QuizResult::class, 'result_id');
    }

    // Câu hỏi
    public function question()
    {
        return $this->belongsTo(Question::class);
    }

    // Đáp án sinh viên đã chọn
    public function answer()
    {
        return $this->belongsTo(Answer::class);
    }
}
