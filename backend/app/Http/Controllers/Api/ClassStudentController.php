<?php

namespace App\Http\Controllers\Api;

use App\Models\ClassModel;
use App\Models\ClassStudent;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class ClassStudentController
{
    // Lấy danh sách lớp học, kèm quan hệ subject, semester, teacher
    public function index()
    {
        try {
            $students = ClassStudent::with(['class', 'student'])
                ->paginate(5);
            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách thành công',
                'data' => $students
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy danh sách',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getStudentByClass($classId)
    {
        try {
            if ($classId) {
                $students = ClassStudent::with(['class', 'student'])
                    ->where('class_id', $classId)
                    ->paginate(5);
            } else {
                $students = ClassStudent::with(['class', 'student'])
                    ->paginate(5);
            }

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách thành công',
                'data' => $students
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy danh sách',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    // Tạo mới lớp học
    public function createStudentByClass(Request $request, $classId)
    {
        try {
            $request->validate([
                'mssv' => 'required|string'
            ]);

            $studentId = Student::where('mssv', $request->mssv)->value('id');
            if (!$studentId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mã số sinh viên không tồn tại!',
                ], 404);
            }

            $exists = ClassStudent::where('class_id', $classId)
                ->where('student_id', $studentId)
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sinh viên này đã thuộc lớp này rồi!',
                ], 409);
            }

            $newStudent = ClassStudent::create([
                'student_id' => $studentId,
                'class_id' => $classId
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Thêm sinh viên vào lớp thành công!',
                'student' => $newStudent,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Thông tin không hợp lệ!',
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
        $class = ClassStudent::find($id);
        if (!$class) {
            return response()->json([

                'success' => false,
                'messgae' => 'không tồn tại sinh viên'
            ]);
        }
        $class->delete();
        return response()->json([

            'success' => true,
            'statusCode' => 200,
            'messgae' => 'Xóa sinh viên thành công'
        ]);
    }
}
