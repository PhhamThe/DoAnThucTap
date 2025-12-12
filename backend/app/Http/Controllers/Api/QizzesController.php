<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class QizzesController extends Controller
{
    public function index(Request $request)
    {
        $classId = $request->get('class_id');
        $userId = Auth::id();
        $teacherId = Teacher::where('user_id', $userId)->value('id');

        $limit = $request->get('limit', 10);

        $quizzes = Quiz::join('classes', 'classes.id', '=', 'quizzes.class_id')
            ->join('teachers', 'teachers.id', '=', 'classes.teacher_id')
            ->where('classes.id', $classId)
            ->where('teachers.id', $teacherId)
            ->select('quizzes.*')
            ->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => $quizzes,
            'message' => 'Lấy danh sách bài kiểm tra thành công'
        ]);
    }

    public function store(Request $request)
    {
        try {

            $validated = $request->validate([
                'class_id' => 'required|integer|exists:classes,id',
                'title' => 'required|string|max:255',
                'time_limit' => 'required|integer|max:90',
                'start_time' => 'required|string',
                'end_time' => 'nullable|string',
            ]);

            $quizz = Quiz::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Tạo bài kiểm tra thành công'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'statusCode' => 400,
                'message' => 'Thông tin không hợp lệ',
                'errors' => $e->errors()
            ], 400);
        }
    }

    public function update(Request $request, $id)
    {
        try {

            $validated = $request->validate([
                'class_id' => 'required|integer|exists:classes,id',
                'title' => 'required|string|max:255',
                'time_limit' => 'required|integer|max:90',
                'start_time' => 'required|string',
                'end_time' => 'nullable|string',
            ]);
            $teacherId = Teacher::where('user_id', Auth::id())->value('id');
            $quiz = Quiz::join('classes', 'classes.id', '=', 'quizzes.class_id')
                ->join('teachers', 'teachers.id', '=', 'classes.teacher_id')
                ->where('quizzes.id', $id)
                ->where('teachers.id', $teacherId)
                ->select('quizzes.*')
                ->first();

            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy bài kiểm tra hoặc bạn không có quyền sửa.',
                ], 403);
            }

            $quiz->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật bài kiểm tra thành công',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'statusCode' => 400,
                'message' => 'Thông tin không hợp lệ',
                'errors' => $e->errors()
            ], 400);
        }
    }

    public function destroy($id)
    {

        $teacherId = Teacher::where('user_id', Auth::id())->value('id');
        $quiz = Quiz::join('classes', 'classes.id', '=', 'quizzes.class_id')
            ->join('teachers', 'teachers.id', '=', 'classes.teacher_id')
            ->where('quizzes.id', $id)
            ->where('teachers.id', $teacherId)
            ->select('quizzes.*')
            ->first();

        if (!$quiz) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy bài kiểm tra hoặc bạn không có quyền xoá.',
            ], 403);
        }

        $quiz->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xoá bài kiểm tra thành công',
        ]);
    }
}
