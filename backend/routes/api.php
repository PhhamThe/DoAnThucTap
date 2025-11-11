<?php

use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\ClassModelController;
use App\Http\Controllers\Api\ClassStudentController;
use App\Http\Controllers\Api\FacultyController;
use App\Http\Controllers\Api\TeacherController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\LoginController;
use App\Http\Controllers\Api\MajorController;
use App\Http\Controllers\Api\UserAccountController;
use App\Http\Controllers\Api\SemesterController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\SubmissionController;
use App\Models\Assignment;
use App\Models\ClassModel;
use App\Models\Submission;

Route::post('login', [LoginController::class, 'login']);


Route::middleware('auth:api')->group(function () {

    Route::resource('users', UserAccountController::class);
    Route::get('/me', [LoginController::class, 'me']);
    Route::resource('faculties', FacultyController::class);
    Route::resource('majors', MajorController::class);
    Route::resource('semesters', SemesterController::class);
    Route::resource('subjects', SubjectController::class);
    Route::resource('classes', ClassModelController::class);
    Route::resource('teachers', TeacherController::class);
    Route::resource('assignments', AssignmentController::class);
    Route::post('/submissions/{assignmentId}', [SubmissionController::class, 'store']);

    //Thêm  sinh viên vào 1 lớp nào đó
    Route::post('/class_student/{classId}', [ClassStudentController::class, 'createStudentByClass']);
    Route::apiResource('class_student', ClassStudentController::class);
    //Lấy danh sách sinh viên của 1 lớp nào đó
    Route::get('/student_by_class/{classId}', [ClassStudentController::class, 'getStudentByClass']);
    //Danh sách lớp học của giáo viên
    Route::get('/class_list_by_teacher', [ClassModelController::class, 'getClassByTeacher']);
    //Danh sách lớp học của sinh viên
    Route::get('/class_list_by_student', [ClassModelController::class, 'getClassByStudent']);

    //Lấy danh sách bài tập bên sinh viên
    Route::get('/student_assigntment_list/{classId}', [AssignmentController::class, 'getAssignmentByStudent']);
    Route::get('/teacher_assignment_list/{classId}', [AssignmentController::class, 'getAssignmentByTeacher']);
    Route::get('/submission-by-student/{assignmentId}', [SubmissionController::class, 'getSubmissionByStudent']);
    Route::post('/submission/{assignmentId}/update', [SubmissionController::class, 'update']);

    //Lấy danh sách nộp bài của sinh viên bên giáo viên
    Route::get('/get_all_submission/{assignmentId}', [AssignmentController::class, 'getAllSubmission']);
});
