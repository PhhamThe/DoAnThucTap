<?php

namespace App\Http\Controllers\Api;

use App\Models\ClassModel;
use App\Models\Student;
use App\Models\Subject;
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
    public function getCourseTimeLineByStudent()
    {
        $userId = Auth::id();
        $studentId = Student::where('user_id', $userId)->value('id');

        $subject_list = ClassModel::join('class_students', 'class_students.class_id', '=', 'classes.id')
            ->join('students', 'students.id', 'class_students.student_id')
            ->join('subjects', 'subjects.id', 'classes.subject_id')
            ->join('semesters', 'semesters.id', 'classes.semester_id')
            ->leftJoin('subject_progress', 'subject_progress.subject_id', 'subjects.id')
            ->where('students.id', $studentId)
            ->select(
                'subjects.*',
                'subjects.name as subject_name',
                'classes.*',
                'semesters.start_date',
                'semesters.end_date',
                'subject_progress.progress'
            )->get();
        return response()->json(
            [
                'success' => true,
                'message' => 'Lấy danh sách course thành công',
                'data' => $subject_list
            ]
        );
    }
}
