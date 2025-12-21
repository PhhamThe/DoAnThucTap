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
        return $this->belongsTo(Teacher::class, 'teacher_id'); // Sửa thành Teacher::class
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

    /**
     * Lớp học có nhiều sinh viên thông qua bảng class_students
     */
    public function classStudents()
    {
        return $this->hasMany(ClassStudent::class, 'class_id');
    }

    /**
     * Lấy danh sách sinh viên trong lớp (many-to-many)
     */
    public function students()
    {
        return $this->belongsToMany(
            Student::class,
            'class_students', 
            'class_id',     
            'student_id'      
        )->withTimestamps();
    }

    /**
     * Lớp học có nhiều chương
     */
    public function chapters()
    {
        return $this->hasMany(Chapter::class, 'class_id');
    }

    /**
     * Lớp học có nhiều bài kiểm tra
     */
    public function quizzes()
    {
        return $this->hasMany(Quiz::class, 'class_id');
    }
}