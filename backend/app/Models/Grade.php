<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    protected $table = 'grades';

    protected $fillable = [
        'student_id',
        'class_id',
        'type',
        'score',
        'max_score',
        'teacher_id',
        'graded_at',
        'is_finalized',
        'notes',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'max_score' => 'decimal:2',
        'graded_at' => 'datetime',
        'is_finalized' => 'boolean',
    ];

    /* ================== RELATIONSHIPS ================== */

    // Sinh viên
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    // Lớp học (đổi tên method cho an toàn)
    public function classRoom()
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    // Giáo viên nhập điểm
    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    // Loại điểm (attendance, midterm, final...)
    public function component()
    {
        return $this->belongsTo(GradeComponent::class, 'type', 'code');
    }
}
