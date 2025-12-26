<?php

namespace App\Http\Controllers\Api;

use App\Models\ClassModel;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ClassModelController
{
    // Lấy danh sách lớp học, kèm quan hệ subject, semester, teacher
    public function index()
    {
        try {
            $classes = ClassModel::query()
                ->join('subjects', 'subjects.id', '=', 'classes.subject_id')
                ->with(['subject', 'semester', 'teacher'])
                ->orderBy('subjects.name', 'asc')
                ->select('classes.*')
                ->paginate(10);


            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách lớp thành công',
                'data' => $classes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy danh sách lớp',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Tạo mới lớp học
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => [
                    'required',
                    'string',
                    'max:50',
                    Rule::unique('classes')
                        ->where('subject_id', $request->input('subject_id'))
                        ->where('semester_id', $request->input('semester_id')),
                ],
                'description' => 'nullable|string',
                'subject_id'  => 'required|exists:subjects,id',
                'teacher_id'  => 'required|exists:teachers,id',
                'semester_id' => 'required|exists:semesters,id',
            ]);

            $class = ClassModel::create($validated);
            $class->load(['subject', 'semester', 'teacher']);

            return response()->json([
                'success' => true,
                'message' => 'Tạo lớp học thành công!',
                'data' => $class,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Thông tin không hợp lệ',
                'errors' => $e->errors(),
            ], 400);
        }
    }

    // Cập nhật lớp học 
    public function update(Request $request, $id)
    {
        $class = ClassModel::find($id);
        if (!$class) {
            return response()->json([
                'success' => false,
                'message' => 'Không tồn tại lớp học'
            ], 404);
        }

        try {
            $validated = $request->validate([
                'name' => [
                    'required',
                    'string',
                    'max:50',
                    Rule::unique('classes')
                        ->where('subject_id', $request->input('subject_id'))
                        ->where('semester_id', $request->input('semester_id'))
                        ->ignore($id),
                ],
                'description' => 'nullable|string',
                'subject_id'  => 'required|exists:subjects,id',
                'teacher_id'  => 'required|exists:teachers,id',
                'semester_id' => 'required|exists:semesters,id',
            ]);

            $class->update($validated);
            $class->load(['subject', 'semester', 'teacher']);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật lớp học thành công',
                'data' => $class
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi cập nhật lớp học',
                'errors' => $e->errors()
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi khi cập nhật',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $class = ClassModel::find($id);
        if (!$class) {
            return response()->json([
                'success' => false,
                'message' => 'Không tồn tại lớp'
            ], 404);
        }

        try {
            $class->delete();
            return response()->json([
                'success' => true,
                'message' => 'Xóa lớp thành công'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa lớp',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $teacherId = Teacher::where('user_id', Auth::id())->value('id');

            if (!$teacherId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy giáo viên',
                ], 404);
            }

            $class = ClassModel::join('subjects', 'subjects.id', '=', 'classes.subject_id')
                ->where('classes.id', $id)
                ->where('classes.teacher_id', $teacherId)
                ->first(['classes.name as class_name', 'subjects.name as subject_name']);

            if (!$class) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lớp không tồn tại hoặc không thuộc quyền quản lý',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Lấy lớp học thành công',
                'data' => $class
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getClassByStudent()
    {
        try {
            $userId = Auth::id();
            $studentId = Student::where('user_id', $userId)->value('id');

            if (!$studentId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy sinh viên',
                ], 404);
            }

            $classes = ClassModel::join('class_students', 'class_students.class_id', '=', 'classes.id')
                ->join('subjects', 'subjects.id', '=', 'classes.subject_id')
                ->join('students', 'students.id', '=', 'class_students.student_id')
                ->where('students.id', $studentId)
                ->select([
                    'classes.*',
                    'subjects.id as subject_id',
                    'subjects.name as subject_name'
                ])
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách lớp học thành công',
                'data' => $classes
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getClassByTeacher()
    {
        try {
            $userId = Auth::id();
            $teacherId = Teacher::where('user_id', $userId)->value('id');

            if (!$teacherId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy giáo viên',
                ], 404);
            }

            $classes = ClassModel::with('subject', 'semester')
                ->where('teacher_id', $teacherId)
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách lớp học theo giáo viên thành công',
                'data' => $classes
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
