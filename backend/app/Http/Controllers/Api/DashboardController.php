<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\ClassModel;
use App\Models\Quiz;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Submission;
use App\Models\Teacher;
 class DashboardController extends Controller
{
public function getStats()
{
    $stats = [
        'summary' => [
            'totalStudents' => Student::count(),
            'totalTeachers' => Teacher::count(),
            'totalClasses' => ClassModel::count(),
            'totalSubjects' => Subject::count(),
            'activeQuizzes' => Quiz::count(),
            'completedAssignments' => Submission::where('status', 'graded')->count(),
        ],
    ];

    return response()->json([
        'success' => true,
        'data' => $stats
    ]);
}
}
