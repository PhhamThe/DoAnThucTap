<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Major extends Model
{
    use HasFactory;

    protected $fillable = [
        'faculty_id',
        'name',
        'description',
    ];

    /**
     * Quan hệ: Ngành thuộc về 1 khoa
     */
    public function faculty()
    {
        return $this->belongsTo(Faculty::class);
    }

    /**
     * Quan hệ: 1 ngành có nhiều học phần (subjects)
     */
  
    public function subjects()
{
    return $this->belongsToMany(Subject::class, 'major_subject');
}

}
