<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Answer extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_id',
        'answer_text',
        'is_correct',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
    ];

    // Thuộc về 1 câu hỏi
    public function question()
    {
        return $this->belongsTo(Question::class);
    }

    // Đáp án này có thể được chọn bởi sinh viên
    public function studentAnswers()
    {
        return $this->hasMany(StudentAnswer::class);
    }
}
