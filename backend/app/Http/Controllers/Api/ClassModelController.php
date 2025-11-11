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
            $classes = ClassModel::with(['subject', 'semester', 'teacher'])
                ->paginate(5);

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
                'teacher_id'  => 'required|exists:users,id',
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

    public function update(Request $request, $id)
    {
        $class = ClassModel::find($id);
        if (!$class) {
            return response()->json(
                [
                    'success' => false,
                    'message' => 'Không tồn tại lớp học'
                ]
            );
        }
        try {
            $validator = $request->validate(
                [
                    'name'        => 'required|string|max:50|unique:classes,name,' . $id,
                    'description' => 'nullable|string',
                    'subject_id'  => 'required|exists:subjects,id',
                    'teacher_id'  => 'required|exists:users,id',
                    'semester_id' => 'required|exists:semesters,id',
                ]
            );

            $class->update($validator);
            return response()->json(
                [
                    'success' => true,
                    'message' => 'Cập nhật lớp học thành công',
                ],
                200
            );
        } catch (ValidationException $e) {
            return response()->json(
                [
                    'success' => false,
                    'message' => 'Lỗi cập nhật lớp học',
                    'error' => $e
                ]
            );
        }
    }

    public function destroy($id)
    {
        $class = ClassModel::find($id);
        if (!$class) {
            return response()->json([

                'success' => false,
                'messgae' => 'không tồn tại lớp'
            ]);
        }
        $class->delete();
        return response()->json([

            'success' => true,
            'statusCode' => 200,
            'messgae' => 'Xóa lớp thành công'
        ]);
    }

    public function show($id)
    {
        $teacherId = Teacher::where('user_id', Auth::id())->value('id');
        $class = ClassModel::join('subjects', 'subjects.id', '=', 'classes.subject_id')
            ->where('classes.id', $id)
            ->where('classes.teacher_id', $teacherId)->first(['classes.name as class_name', 'subjects.name as subject_name']);
        if (!$class) {
            return response()->json(
                [
                    'success' => false,
                    'message' => 'Lớp không tồn tại',
                ]
            );
        }
        return response()->json([
            'success' => true,
            'message' => 'Lấy lớp học thành công',
            'data' => $class
        ], 200);
    }

    public function getClassByStudent()
    {
        $userId = Auth::id();
        $studentId = Student::where('user_id', $userId)->value('id');
        $class = ClassModel::join('class_students', 'class_students.class_id', '=', 'classes.id')
            ->join('subjects', 'subjects.id', '=', 'classes.subject_id')
            ->join('students', 'students.id', '=', 'class_students.student_id')->where('students.id', $studentId)->select([
                'classes.*',
                'subjects.id as subject_id',
                'subjects.name as subject_name'
            ])
            ->get();
        return response()->json([

            'success' => true,
            'message' => 'Lấy danh sách lớp học theo teacher thành công',
            'data' => $class
        ]);
    }
    public function getClassByTeacher()
    {
        $userId = Auth::id();
        $teacherId = Teacher::where('user_id', $userId)->value('id');
        $class = ClassModel::with('subject', 'semester')->where('teacher_id', $teacherId)->get();
        return response()->json([

            'success' => true,
            'message' => 'Lấy danh sách lớp học theo teacher thành công',
            'data' => $class
        ]);
    }
}
