<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassStudent;
use App\Models\Quiz;
use App\Models\QuizResult;
use App\Models\Student;
use App\Models\Teacher;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

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
                'time_limit' => 'required|integer|min:1|max:180',
                'start_time' => 'required',
            ]);


            // Tạo quiz
            $quiz = Quiz::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Tạo bài kiểm tra thành công',
                'data' => [
                    'quiz' => $quiz,
                ]
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'statusCode' => 400,
                'message' => 'Thông tin không hợp lệ',
                'errors' => $e->errors()
            ], 400);
        } catch (Exception $e) {
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
                'start_time' => 'required',
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
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'statusCode' => 400,
                'message' => 'Thông tin không hợp lệ',
                'errors' => $e->errors()
            ], 400);
        } catch (Exception $e) {
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
        } catch (Exception $e) {
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
                ->get();


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
    public function getQuizResults($quizId)
    {
        try {
            $teacherId = Teacher::where('user_id', Auth::id())->value('id');

            // Kiểm tra quyền truy cập và lấy thông tin lớp
            $quiz = Quiz::with('class.classStudents.student.user') // Load class và students
                ->join('classes', 'classes.id', '=', 'quizzes.class_id')
                ->join('teachers', 'teachers.id', '=', 'classes.teacher_id')
                ->where('quizzes.id', $quizId)
                ->where('teachers.id', $teacherId)
                ->select('quizzes.*')
                ->first();

            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy bài kiểm tra hoặc bạn không có quyền truy cập.',
                ], 403);
            }

            // Lấy danh sách sinh viên trong lớp
            $classId = $quiz->class_id;
            $students = ClassStudent::where('class_id', $classId)
                ->with(['student.user', 'student.quizResults' => function ($query) use ($quizId) {
                    $query->where('quiz_id', $quizId);
                }])
                ->get();

            // Format dữ liệu trả về
            $formattedResults = $students->map(function ($classStudent) use ($quizId) {
                $student = $classStudent->student;
                $quizResult = $student->quizResults->first(); // Lấy kết quả nếu có

                return [
                    'student_id' => $student->id,
                    'student_name' => $student->name ?? $student->user->full_name ?? 'N/A',
                    'student_code' => $student->mssv ?? 'N/A',
                    'has_attempted' => !is_null($quizResult), // Đã làm bài hay chưa
                    'quiz_result' => $quizResult ? [
                        'id' => $quizResult->id,
                        'score' => (float) $quizResult->score,
                        'completed_at' => $quizResult->completed_at?->format('Y-m-d H:i:s'),
                        'created_at' => $quizResult->created_at?->format('Y-m-d H:i:s'),
                    ] : null,
                    'status' => $quizResult ? 'completed' : 'not_attempted'
                ];
            });

            // Sắp xếp: sinh viên đã làm bài lên trước
            $sortedResults = $formattedResults->sortByDesc('has_attempted')->values();

            return response()->json([
                'success' => true,
                'data' => $sortedResults,
                'total_students' => $students->count(),
                'total_completed' => $sortedResults->where('has_attempted', true)->count(),
                'total_not_attempted' => $sortedResults->where('has_attempted', false)->count(),
                'quiz_info' => [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'class_id' => $classId,
                    'class_name' => $quiz->class->name ?? 'N/A',
                ],
                'message' => 'Lấy kết quả bài kiểm tra thành công'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'statusCode' => 500,
                'message' => 'Lỗi khi lấy kết quả bài kiểm tra',
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

            // Lấy bài kiểm tra với các mối quan hệ cần thiết
            $quiz = Quiz::with(['class', 'questions'])
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

            $totalQuestions = $quiz->questions->count();
            $totalStudentsCompleted = QuizResult::where('quiz_id', $id)->count();
            $now = now();
            $startTime = \Carbon\Carbon::parse($quiz->start_time);

            $status = 'unknown';
            $statusText = 'Không xác định';

            if ($now < $startTime) {
                $status = 'upcoming';
                $statusText = 'Sắp diễn ra';
            } elseif ($quiz->time_limit && $quiz->start_time) {
                $endTime = $startTime->copy()->addMinutes($quiz->time_limit);

                if ($now <= $endTime) {
                    $status = 'active';
                    $statusText = 'Đang diễn ra';
                } else {
                    $status = 'ended';
                    $statusText = 'Đã kết thúc';
                }
            }

            $resultsStats = [
                'total_students_completed' => $totalStudentsCompleted,
                'total_questions' => $totalQuestions,
                'quiz_status' => $status,
                'quiz_status_text' => $statusText,
                'time_info' => [
                    'start_time' => $quiz->start_time ? $quiz->start_time->format('Y-m-d H:i:s') : null,
                    'time_limit' => $quiz->time_limit,
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'quiz' => [
                        'id' => $quiz->id,
                        'title' => $quiz->title,
                        'class_id' => $quiz->class_id,
                        'class_name' => $quiz->class->name ?? 'N/A',
                        'time_limit' => $quiz->time_limit,
                        'start_time' => $quiz->start_time,
                        'created_at' => $quiz->created_at,
                        'updated_at' => $quiz->updated_at
                    ],
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
