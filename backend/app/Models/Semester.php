<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Semester extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'year',
        'start_date',
        'end_date',
    ];

    /**
     * Một kỳ học có thể có nhiều lớp.
     */
    public function classes()
    {
        return $this->hasMany(ClassModel::class, 'semester_id');
    }
}
