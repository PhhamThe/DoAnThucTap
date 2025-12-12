<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'quiz_id',
        'student_id',
        'score',
        'completed_at',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
        'score' => 'decimal:2',
    ];

    // Thuộc về 1 đề thi
    public function quiz()
    {
        return $this->belongsTo(Quiz::class);
    }

    // Thuộc về 1 sinh viên
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    // 1 lần làm bài có nhiều đáp án được chọn
    public function answers()
    {
        return $this->hasMany(StudentAnswer::class, 'result_id');
    }
}
