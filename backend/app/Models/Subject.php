<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;

    // Tên bảng (nếu khác tên mặc định suy ra từ model)
    protected $table = 'subjects';

    // Các cột có thể gán giá trị hàng loạt (mass assignment)
    protected $fillable = [
        'code',
        'name',
        'description',
        'major_id',
        'credit'
    ];

    /**
     * Quan hệ: Môn học thuộc về một ngành
     */
    public function major()
    {
        return $this->belongsTo(Major::class);
    }
    public function classes()
    {
        return $this->hasMany(ClassModel::class); // hoặc tên model class chính xác
    }

    /**
     * Ví dụ quan hệ mở rộng: Môn học có nhiều bài tập (assignments)
     * (nếu bạn đã có bảng assignments)
     */

    // public function assignments()
    // {
    //     return $this->hasMany(Assignment::class);
    // }

    public function assignments()
    {
        return $this->hasMany(Assignment::class);
    }
}
