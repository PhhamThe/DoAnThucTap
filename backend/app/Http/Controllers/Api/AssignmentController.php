<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\ClassModel;
use App\Models\Student;
use App\Models\Teacher;
use ErrorException;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

use Mockery\Expectation;
use function Laravel\Prompts\error;

class AssignmentController extends Controller
{
    // Lấy danh sách
    public function index(Request $request)
    {
        $query = Assignment::query();
        $assignments = $query->paginate(5);
        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => 'Lấy danh sách nhiệm vụ thành công',
            'data' => $assignments
        ]);
    }

    // Thêm mới 
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([

                'class_id' => 'required|integer|exists:classes,id',
                'title' => 'required|string|max:250',
                'description' => 'nullable|string|max:1000',
                'due_date' => 'required|date',
                'file_upload' => 'nullable|file|max:102400'
            ]);

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

            $validated['file_upload'] = $fileData;
            $assignment = Assignment::create($validated);

            return response()->json([
                'success' => true,
                'statusCode' => 201,
                'message' => 'Tạo bài tập thành công',
                'data' => $assignment
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'statusCode' => 400,
                'message' => 'Thông tin không hợp lệ',
                'errors' => $e->errors()
            ], 400);
        }
    }

    // Cập nhật 
    public function update(Request $request, $id)
    {
        $assignment = Assignment::find($id);
        if (!$assignment) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy bài tập'
            ], 404);
        }

        try {
            $validated = $request->validate([
                'class_id' => 'required|integer|exists:classes,id',
                'title' => 'required|string|max:250',
                'description' => 'nullable|string|max:1000',
                'due_date' => 'required|date',
                'file_upload' => 'nullable|file|max:102400'
            ]);

            // Nếu có file mới upload thì xử lý và lưu thông tin file mới
            if ($request->hasFile('file_upload')) {
                $filePath = $request->file('file_upload')->store('assignments', 'public');
                $fileData = [
                    'path' => $filePath,
                    'name' => $request->file('file_upload')->getClientOriginalName(),
                    'size' => $request->file('file_upload')->getSize(),
                    'mime_type' => $request->file('file_upload')->getMimeType(),
                ];

                $validated['file_upload'] = $fileData;
            } else {
                // Nếu không có file mới thì giữ nguyên file_upload cũ
                $validated['file_upload'] = $assignment->file_upload;
            }

            $assignment->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật bài tập thành công',
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors'  => $e->errors()
            ], 422);
        }
    }


    // Xóa 
    public function destroy($id)
    {
        $assignment = Assignment::find($id);
        if (!$assignment) {
            return response()->json([
                'success' => false,
                'statusCode' => 404,
                'message' => 'Không tìm thấy bài tập'
            ], 404);
        }

        $assignment->delete();

        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => 'Xóa bài tập thành công'
        ]);
    }

    public function show($id)
    {
        $assignment = Assignment::where('id', $id)->first();
        if (!$assignment) {
            return response()->json(
                [
                    'success' => false,
                    'message' => ' Lấy bài tập thất bại',
                ]
            );
        }
        return response()->json([
            'success' => true,
            'message' => 'Lấy assignment thành công',
            'data' => $assignment

        ]);
    }

    public function getAssignmentByTeacher($id)
    {
        $assignment = Assignment::where('class_id', $id)->get();
        if (!$assignment) {
            return response()->json(
                [
                    'success' => false,
                    'message' => ' Lấy bài tập thất bại',
                ]
            );
        }
        return response()->json([
            'success' => true,
            'message' => 'Lấy assignment thành công',
            'data' => $assignment

        ]);
    }

    public function getAllSubmission($assignmentId)
    {
        try {
            $userId = Auth::id();
            $teacherId = Teacher::where('user_id', $userId)->value('id');

            $data = Student::join('class_students', 'class_students.student_id', '=', 'students.id')
                ->join('classes', 'classes.id', '=', 'class_students.class_id')
                ->join('assignments', 'assignments.class_id', '=', 'classes.id')
                ->leftJoin('submissions', function ($join) {
                    $join->on('submissions.assignment_id', '=', 'assignments.id')
                        ->on('submissions.student_id', '=', 'students.id'); 
                })
                ->where('assignments.id', $assignmentId)
                ->where('classes.teacher_id', $teacherId)
                ->select([
                    'students.*',
                    'submissions.status as submitted',
                    'submissions.updated_at as submitted_at'
                ])
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách nộp bài thành công',
                'data' => $data
            ]);
        } catch (\Exception $err) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi không thể lấy danh sách',
                'errors' => $err->getMessage()
            ]);
        }
    }


    public function getAssignmentByStudent($classId)
    {
        try {
            $userId = Auth::id();
            $studentId = Student::where('user_id', $userId)->value('id');

            $assignments = Assignment::join('classes', 'classes.id', '=', 'assignments.class_id')
                ->join('class_students', 'class_students.class_id', '=', 'classes.id')
                ->join('students', 'students.id', '=', 'class_students.student_id')
                ->where('students.id', $studentId)
                ->where('classes.id', $classId)
                ->select('assignments.*')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách bài tập thành công',
                'data' => $assignments
            ]);
        } catch (Exception $err) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách bài tập',
                'errors' => $err->getMessage()
            ]);
        }
    }
}
