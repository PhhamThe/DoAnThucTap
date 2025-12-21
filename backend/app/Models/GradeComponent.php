<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradeComponent extends Model
{
    protected $table = 'grade_components';

    protected $fillable = [
        'code',
        'name', 
        'default_weight',
        'description',
        'is_active',
        'order'
    ];

    protected $casts = [
        'default_weight' => 'decimal:2',
        'is_active' => 'boolean'
    ];

    // Quan hệ với Grade
    public function grades()
    {
        return $this->hasMany(Grade::class, 'type', 'code');
    }
}