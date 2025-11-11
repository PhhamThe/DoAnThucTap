<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_id',
        'title',
        'description',
        'due_date',
        'file_upload'
    ];

    /**
     * Bài tập thuộc về một lớp học
     */
    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }
    protected $casts = [
        'file_upload' => 'array',
    ];
}
