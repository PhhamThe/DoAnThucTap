<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'address',
        'phone',
        'birth_date',
        'gender',
        'description',
        'mssv',
        'name'
    ];

    /**
     * Quan hệ: Student thuộc về một User
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

   
    /**
     * Accessor: Lấy tên đầy đủ từ bảng users (nếu có)
     */
    public function getFullNameAttribute()
    {
        return $this->user?->name ?? '';
    }
}
