<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassModel extends Model
{
    use HasFactory;

    protected $table = 'classes'; // tên bảng trong DB

    protected $fillable = [
        'name',
        'subject_id',
        'teacher_id',
        'semester_id',
        'description'
    ];

    /**
     * Lớp học thuộc về một môn học
     */
    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Lớp học thuộc về một giáo viên
     */
    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    /**
     * Lớp học thuộc về một học kỳ
     */
    public function semester()
    {
        return $this->belongsTo(Semester::class, 'semester_id');
    }

    /**
     * Lớp học có nhiều bài tập
     */
    public function assignments()
    {
        return $this->hasMany(Assignment::class, 'class_id');
    }
}
