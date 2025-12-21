<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinalGrade extends Model
{
    protected $table = 'final_grades';

    protected $fillable = [
        'student_id',
        'class_id',
        'subject_id',
        'attendance_score',
        'assignment_score',
        'midterm_score',
        'final_score',
        'total_score',
        'letter_grade',
        'video_progress',
        'can_take_final',
        'status',
        'calculated_at',
        'calculation_notes'
    ];

    protected $casts = [
        'attendance_score' => 'decimal:2',
        'assignment_score' => 'decimal:2',
        'midterm_score' => 'decimal:2',
        'final_score' => 'decimal:2',
        'total_score' => 'decimal:2',
        'video_progress' => 'decimal:2',
        'can_take_final' => 'boolean',
        'calculated_at' => 'datetime'
    ];

    // Quan hệ với Student
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    // Quan hệ với Class
    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    // Quan hệ với Subject
    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    // Quan hệ với Grade (thông qua student_id và class_id)
    public function grades()
    {
        return $this->hasMany(Grade::class, 'student_id', 'student_id')
                    ->where('class_id', $this->class_id);
    }
}