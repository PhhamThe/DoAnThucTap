<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChapterProgress extends Model
{
    use HasFactory;

    protected $table = 'chapter_progress';

    protected $fillable = [
        'student_id',
        'chapter_id',
        'progress',
        'is_completed',
        'completed_at',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
        'progress' => 'decimal:2',
    ];

    // Quan hệ với User
    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    // Quan hệ với Chapter
    public function chapter()
    {
        return $this->belongsTo(Chapter::class, 'chapter_id');
    }
}
