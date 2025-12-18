<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class QizzesController extends Controller // Sửa tên class
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
    
    public function getQuizByStudent(Request $request)
    {
        $classId = $request->get('class_id');
        $userId = Auth::id();
        $studentId = Student::where('user_id', $userId)->value('id');

        $limit = $request->get('limit', 10);
        $quizzes = Quiz::join('classes', 'classes.id', 'quizzes.class_id')
            ->join('class_students', 'class_students.class_id', 'classes.id')
            ->join('students', 'students.id', 'class_students.student_id')
            ->where('classes.id', $classId)
            ->where('students.id', $studentId)
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
                'time_limit' => 'required|integer|min:1|max:180', // Tăng max lên 180 phút (3 tiếng)
                'start_time' => 'required|date_format:Y-m-d H:i:s',
                // Đã xóa 'end_time' vì không còn trong migration mới
            ]);

            // Tự động tính end_time nếu cần (không lưu vào DB)
            $startTime = new \DateTime($validated['start_time']);
            $endTime = (clone $startTime)->modify("+{$validated['time_limit']} minutes");
            
            // Tạo quiz
            $quiz = Quiz::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Tạo bài kiểm tra thành công',
                'data' => [
                    'quiz' => $quiz,
                    'calculated_end_time' => $endTime->format('Y-m-d H:i:s') // Chỉ để hiển thị
                ]
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'statusCode' => 400,
                'message' => 'Thông tin không hợp lệ',
                'errors' => $e->errors()
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'statusCode' => 500,
                'message' => 'Lỗi khi tạo bài kiểm tra',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'class_id' => 'required|integer|exists:classes,id',
                'title' => 'required|string|max:255',
                'time_limit' => 'required|integer|min:1|max:180',
                'start_time' => 'required|date_format:Y-m-d H:i:s',
                // Đã xóa 'end_time' vì không còn trong migration mới
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

            // Kiểm tra xem quiz đã bắt đầu chưa (không cho sửa nếu đã bắt đầu)
            $now = now();
            if ($now >= $quiz->start_time) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể sửa bài kiểm tra đã bắt đầu hoặc đã kết thúc.',
                ], 400);
            }

            $quiz->update($validated);

            // Tính toán end_time mới
            $startTime = new \DateTime($validated['start_time']);
            $endTime = (clone $startTime)->modify("+{$validated['time_limit']} minutes");

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật bài kiểm tra thành công',
                'data' => [
                    'quiz' => $quiz,
                    'calculated_end_time' => $endTime->format('Y-m-d H:i:s')
                ]
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'statusCode' => 400,
                'message' => 'Thông tin không hợp lệ',
                'errors' => $e->errors()
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'statusCode' => 500,
                'message' => 'Lỗi khi cập nhật bài kiểm tra',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
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
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'statusCode' => 500,
                'message' => 'Lỗi khi xoá bài kiểm tra',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy thông tin chi tiết một quiz
     */
    public function show($id)
    {
        try {
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
                    'message' => 'Không tìm thấy bài kiểm tra.',
                ], 404);
            }

            // Thêm thông tin tính toán end_time
            $quiz->end_time = $quiz->end_time; // Sử dụng accessor từ Model
            $quiz->is_active = $quiz->is_active;
            $quiz->is_ended = $quiz->is_ended;
            $quiz->is_upcoming = $quiz->is_upcoming;

            return response()->json([
                'success' => true,
                'data' => $quiz,
                'message' => 'Lấy thông tin bài kiểm tra thành công'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'statusCode' => 500,
                'message' => 'Lỗi khi lấy thông tin bài kiểm tra',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy danh sách quiz của lớp học (dành cho quản lý)
     */
    public function getQuizzesByClass($classId)
    {
        try {
            $teacherId = Teacher::where('user_id', Auth::id())->value('id');
            
            $quizzes = Quiz::join('classes', 'classes.id', '=', 'quizzes.class_id')
                ->join('teachers', 'teachers.id', '=', 'classes.teacher_id')
                ->where('classes.id', $classId)
                ->where('teachers.id', $teacherId)
                ->select('quizzes.*')
                ->orderBy('start_time', 'desc')
                ->get()
                ->map(function ($quiz) {
                    // Thêm các trường tính toán
                    $quiz->end_time = $quiz->end_time;
                    $quiz->is_active = $quiz->is_active;
                    $quiz->is_ended = $quiz->is_ended;
                    $quiz->is_upcoming = $quiz->is_upcoming;
                    $quiz->status = $quiz->status;
                    $quiz->status_text = $quiz->status_text;
                    
                    return $quiz;
                });

            return response()->json([
                'success' => true,
                'data' => $quizzes,
                'message' => 'Lấy danh sách bài kiểm tra thành công'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'statusCode' => 500,
                'message' => 'Lỗi khi lấy danh sách bài kiểm tra',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy thống kê bài kiểm tra
     */
    public function getQuizStatistics($id)
    {
        try {
            $teacherId = Teacher::where('user_id', Auth::id())->value('id');
            $quiz = Quiz::withCount(['quizResults', 'questions'])
                ->join('classes', 'classes.id', '=', 'quizzes.class_id')
                ->join('teachers', 'teachers.id', '=', 'classes.teacher_id')
                ->where('quizzes.id', $id)
                ->where('teachers.id', $teacherId)
                ->select('quizzes.*')
                ->first();

            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy bài kiểm tra.',
                ], 404);
            }

            // Thêm các thông tin tính toán
            $quiz->end_time = $quiz->end_time;
            $quiz->is_active = $quiz->is_active;
            $quiz->is_ended = $quiz->is_ended;
            $quiz->is_upcoming = $quiz->is_upcoming;

            // Thống kê kết quả
            $resultsStats = [
                'total_students_completed' => $quiz->quiz_results_count,
                'total_questions' => $quiz->questions_count,
                'quiz_status' => $quiz->status,
                'quiz_status_text' => $quiz->status_text,
                'time_info' => [
                    'start_time' => $quiz->start_time->format('Y-m-d H:i:s'),
                    'end_time' => $quiz->end_time ? $quiz->end_time->format('Y-m-d H:i:s') : null,
                    'time_limit' => $quiz->time_limit,
                    'remaining_time' => $quiz->is_active && $quiz->end_time 
                        ? now()->diffInMinutes($quiz->end_time, false) 
                        : null
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'quiz' => $quiz,
                    'statistics' => $resultsStats
                ],
                'message' => 'Lấy thống kê bài kiểm tra thành công'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'statusCode' => 500,
                'message' => 'Lỗi khi lấy thống kê bài kiểm tra',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}