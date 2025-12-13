<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResultAnswer extends Model
{
    protected $table = 'result_answers';
    
    protected $fillable = [
        'result_id',
        'question_id',
        'answer_id'
    ];

    public function quizResult()
    {
        return $this->belongsTo(QuizResult::class, 'result_id');
    }

    public function question()
    {
        return $this->belongsTo(Question::class);
    }

    public function answer()
    {
        return $this->belongsTo(Answer::class);
    }
}