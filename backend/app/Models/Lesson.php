<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    use HasFactory;

    protected $table = 'lessons';

    protected $fillable = [
        'chapter_id',
        'title',
        'content',
        'video_url',
        'attachment',
        'position',
    ];

    /**
     * Relationship: Lesson belongs to a Chapter
     */
    public function chapter()
    {
        return $this->belongsTo(Chapter::class);
    }

    /**
     * Scope: Sắp xếp theo position tăng dần
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('position', 'asc');
    }
     protected $casts = [
        'video_url' => 'array',
        'attachment' => 'array'
    ];
}
