<?php

use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\ChaptersController;
use App\Http\Controllers\Api\ClassModelController;
use App\Http\Controllers\Api\ClassStudentController;
use App\Http\Controllers\Api\FacultyController;
use App\Http\Controllers\Api\LessonsController;
use App\Http\Controllers\Api\TeacherController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\LoginController;
use App\Http\Controllers\Api\MajorController;
use App\Http\Controllers\Api\UserAccountController;
use App\Http\Controllers\Api\SemesterController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\SubmissionController;
use App\Http\Controllers\Api\LearningProgressController;
use App\Http\Controllers\Api\SubjectTimeLineController;
use App\Models\Assignment;
use App\Models\ClassModel;
use App\Models\Lesson;
use App\Models\Submission;

Route::post('login', [LoginController::class, 'login']);


Route::middleware('auth:api')->group(function () {

    Route::get('/me', [LoginController::class, 'me']);

    //Admin
    Route::resource('users', UserAccountController::class);
    Route::resource('faculties', FacultyController::class);
    Route::resource('majors', MajorController::class);
    Route::resource('semesters', SemesterController::class);
    Route::resource('subjects', SubjectController::class);
    Route::resource('classes', ClassModelController::class);
    Route::resource('teachers', TeacherController::class);
    Route::resource('assignments', AssignmentController::class);


    //Sinh viên 
    Route::get('/class_list_by_student', [ClassModelController::class, 'getClassByStudent']);
    Route::get('/student_assigntment_list/{classId}', [AssignmentController::class, 'getAssignmentByStudent']);
    Route::get('/teacher_assignment_list/{classId}', [AssignmentController::class, 'getAssignmentByTeacher']);
    Route::post('/submissions/{assignmentId}', [SubmissionController::class, 'store']);
    Route::get('/submission-by-student/{assignmentId}', [SubmissionController::class, 'getSubmissionByStudent']);
    Route::post('/submission/{assignmentId}/update', [SubmissionController::class, 'update']);
    Route::get('/get_all_chapters/{classId}', [ChaptersController::class, 'getChapterOfStudents']);

    //Giáo viên
    Route::apiResource('class_student', ClassStudentController::class);
    Route::post('/class_student/{classId}', [ClassStudentController::class, 'createStudentByClass']);
    Route::get('/class_list_by_teacher', [ClassModelController::class, 'getClassByTeacher']);
    Route::get('/student_by_class/{classId}', [ClassStudentController::class, 'getStudentByClass']);
    Route::get('/get_all_submission/{assignmentId}', [AssignmentController::class, 'getAllSubmission']);
    Route::get('/submission_detail_by_teacher/{submissionId}', [SubmissionController::class, 'getSubmissionDetailByTeacher']);
    Route::resource('chapters', ChaptersController::class);
    Route::resource('lessons', LessonsController::class);
    Route::get('/get_subject_timeline', [SubjectTimeLineController::class, 'getCourseTimeLineByTeacher']);

    Route::post('/progress/update', [LearningProgressController::class, 'updateLessonProgress']);
    Route::post('/progress/mark-complete', [LearningProgressController::class, 'markLessonComplete']);
    Route::get('/progress/get/{lessonId}', [LearningProgressController::class, 'getLessonProgress']);
});
