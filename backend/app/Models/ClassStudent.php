<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassStudent extends Model
{
    use HasFactory;

    // Tên bảng (nếu khác với tên mặc định là "class_students")
    protected $table = 'class_students';

    // Các cột có thể gán giá trị hàng loạt
    protected $fillable = [
        'class_id',
        'student_id',
    ];

    /**
     * Quan hệ: Mỗi bản ghi thuộc về một lớp học.
     */
    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    /**
     * Quan hệ: Mỗi bản ghi thuộc về một học sinh.
     */
    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}
