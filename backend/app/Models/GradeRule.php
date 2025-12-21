<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradeRule extends Model
{
    protected $table = 'grade_rules';

    protected $fillable = [
        'subject_id',
        'class_id',
        'pass_grade',
        'min_video_progress',
        'require_video_progress',
        'min_assignments',
        'min_attendance_rate',
        'weights',
        'notes',
        'is_active'
    ];

    protected $casts = [
        'pass_grade' => 'decimal:2',
        'min_video_progress' => 'decimal:2',
        'require_video_progress' => 'boolean',
        'min_assignments' => 'integer',
        'min_attendance_rate' => 'integer',
        'weights' => 'array',
        'is_active' => 'boolean'
    ];

    // Quan hệ với Subject
    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    // Quan hệ với Class
    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }
}