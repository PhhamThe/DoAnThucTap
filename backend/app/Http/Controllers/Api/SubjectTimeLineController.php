<?php

namespace App\Http\Controllers\Api;

use App\Models\ClassModel;
use App\Models\Teacher;
use Illuminate\Support\Facades\Auth;

class SubjectTimeLineController
{

    public function getCourseTimeLineByTeacher()
    {
        $userId = Auth::id();
        $teacher_id = Teacher::where('user_id', $userId)->value('id');
        $subject_list = ClassModel::join('teachers', 'teachers.id', '=', 'classes.teacher_id')
            ->join('subjects', 'subjects.id', '=', 'classes.subject_id')
            ->join('semesters', 'semesters.id', '=', 'classes.semester_id')
            ->select([
                'subjects.*',
                'classes.id as class_id',
                'semesters.start_date',
                'semesters.end_date'
            ])
            ->where('teachers.id', $teacher_id)->get();
        return response()->json(
            [
                'success' => true,
                'message' => 'Lấy danh sách course thành công',
                'data' => $subject_list
            ]
        );
    }
}
