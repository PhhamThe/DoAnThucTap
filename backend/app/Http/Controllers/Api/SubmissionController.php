<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Submission;
use App\Models\Teacher;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

use function Laravel\Prompts\error;

class SubmissionController extends Controller
{
    public function getSubmissionByStudent($assignmentId)
    {
        $userId = Auth::id();
        $studentId = Student::where('user_id', $userId)->value('id');
        $submisstion = Submission::where('student_id', $studentId)
            ->where('assignment_id', $assignmentId)->first();

        return response()->json(
            [
                'success' => true,
                'message' => 'Lấy bài nộp thành công',
                'data' => $submisstion
            ]
        );
    }
    public function update(Request $request, $assignment_id)
    {
        try {
            $validated = $request->validate([
                'file_upload' => 'nullable|file|max:102400',
                'content' => 'nullable|string|max:1000'
            ]);
            $userId = Auth::id();
            $studentId = Student::where('user_id', $userId)->value('id');
            $fileData = null;
            if ($request->hasFile('file_upload')) {
                $filePath = $request->file('file_upload')->store('assignments', 'public');
                $fileData = [
                    'path' => $filePath,
                    'name' => $request->file('file_upload')->getClientOriginalName(),
                    'size' => $request->file('file_upload')->getSize(),
                    'mime_type' => $request->file('file_upload')->getMimeType(),
                ];
            }

            $submission = Submission::where('student_id', $studentId)->where('assignment_id', $assignment_id)->first();
            $data = [
                'file_upload' => $fileData,
                'content' => $validated['content'] ?? "",
            ];
            $submission->fill($data)->save();
            return response()->json(
                [
                    'message' => 'Cập nhật bài tập thành công',
                    'success' => true,
                ]
            );
        } catch (ValidationException $err) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật bài tập',
                'errors' => $err
            ]);
        }
    }
    public function store(Request $request, $assignment_id)
    {
        try {
            $validated = $request->validate([
                'file_upload' => 'nullable|file|max:102400',
                'content' => 'nullable|string|max:1000'
            ]);

            $userId = Auth::id();
            $studentId = Student::where('user_id', $userId)->value('id');

            $fileData = null;
            if ($request->hasFile('file_upload')) {
                $filePath = $request->file('file_upload')->store('assignments', 'public');
                $fileData = [
                    'path' => $filePath,
                    'name' => $request->file('file_upload')->getClientOriginalName(),
                    'size' => $request->file('file_upload')->getSize(),
                    'mime_type' => $request->file('file_upload')->getMimeType(),
                ];
            }
            $data = [
                'assignment_id' => $assignment_id,
                'student_id' => $studentId,
                'status' => 'submitted',
                'file_upload' => $fileData,
                'content' => $validated['content'] ?? null,
            ];
            $submission = Submission::create($data);
            if ($submission) {
                return response()->json([
                    'success' => true,
                    'message' => 'Nạp bài thành công',
                ]);
            } else
                return response()->json([
                    'success' => false,
                    'message' => 'Nạp bài thất bại',
                ]);
        } catch (ValidationException $err) {

            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi nạp bài',
                'errors' => $err
            ]);
        }
    }
    public function getSubmissionDetailByTeacher($submissionId)
    {
        $userId = Auth::id();
        $teacherId = Teacher::where('user_id', $userId)->value('id');
        $studentId = request()->query('student_id');
        $submission = Submission::join('assignments', 'assignments.id', '=', 'submissions.assignment_id')
            ->join('classes', 'classes.id', '=', 'assignments.class_id')
            ->join('teachers', 'teachers.id', '=', 'classes.teacher_id')
            ->join('students', 'students.id', '=', 'submissions.student_id')
            ->where('teachers.id', $teacherId)
            ->where('submissions.id', $submissionId)
            ->where('students.id', $studentId)
            ->select([
                'submissions.*',
                'students.name as student_name',
                'students.mssv as student_mssv',
            ])
            ->first();

        if (!$submission) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy bài nộp'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lấy bài nộp của học sinh thành công',
            'data' => $submission
        ]);
    }
}
