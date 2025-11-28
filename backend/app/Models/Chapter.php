<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Chapter extends Model
{
    use HasFactory;


    protected $table = 'chapters';

    protected $fillable = [
        'class_id',
        'title',
        'description',
        'content',
        'video_url',
        'attachment',
        'position',
    ];

    public function lessons()
    {
        return $this->hasMany(Lesson::class);
    }
    public function classes()
    {
        return $this->belongsTo(ClassModel::class);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('position', 'asc');
    }
    protected $casts = [
        'video_url' => 'array',
        'attachment' => 'array'
    ];
}
