<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    use HasFactory;

    protected $table = 'submissions';

    protected $fillable = [
        'assignment_id',
        'student_id',
        'file_upload',
        'status',
        'submitted_at',
        'content',
    ];

    protected $casts = [
        'file_upload' => 'array',
    ];

    /**
     * Bài nộp thuộc về bài thực hành (Assignment)
     */
    public function assignment()
    {
        return $this->belongsTo(Assignment::class);
    }

    /**
     * Bài nộp thuộc về sinh viên (Student)
     */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Kiểm tra xem bài nộp có bị trễ không (so với hạn nộp của bài tập)
     */
    public function getIsLateAttribute()
    {
        if (!$this->assignment || !$this->assignment->due_date || !$this->submitted_at) {
            return false;
        }

        return $this->submitted_at->gt($this->assignment->due_date);
    }
   
}
