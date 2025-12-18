<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\Answer;
use App\Models\Student;
use App\Models\QuizResult;
use App\Models\ResultAnswer;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class QuizStudentController extends Controller
{
    /**
     * Kiểm tra trạng thái quiz có thể làm không
     */
    public function checkQuizStatus($quizId)
    {
        try {
            $userId = Auth::id();
            $student = Student::where('user_id', $userId)->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông tin học sinh'
                ], 404);
            }

            $quiz = Quiz::find($quizId);
            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Đề thi không tồn tại'
                ], 404);
            }

            $now = now();
            $status = 'available';

            if ($now < $quiz->start_time) {
                $status = 'not_started';
            } elseif ($quiz->end_time && $now > $quiz->end_time) {
                $status = 'ended';
            }

            $existingResult = QuizResult::where('quiz_id', $quizId)
                ->where('student_id', $student->id)
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Kiểm tra trạng thái thành công',
                'data' => [
                    'quiz_status' => $status,
                    'has_taken' => $existingResult !== null,
                    'result_id' => $existingResult ? $existingResult->id : null,
                    'quiz' => $quiz
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi kiểm tra trạng thái',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy đề thi để làm bài (không bao gồm đáp án đúng)
     */
    public function getQuizForExam($quizId)
    {
        try {
            $userId = Auth::id();
            $student = Student::where('user_id', $userId)->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông tin học sinh'
                ], 404);
            }

            $quiz = Quiz::with(['questions.answers' => function ($query) {
                $query->select('id', 'question_id', 'answer_text');
            }])->find($quizId);

            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Đề thi không tồn tại'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Lấy đề thi thành công',
                'data' => $quiz
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy đề thi',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Nộp bài thi
     */
    public function submitQuiz(Request $request, $quizId)
    {
        $validator = Validator::make($request->all(), [
            'answers' => 'nullable|array',
            'answers.*.question_id' => 'required|exists:questions,id',
            'answers.*.answer_ids' => 'nullable|array',
            'answers.*.answer_ids.*' => 'exists:answers,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            $student = Student::where('user_id', Auth::id())->first();
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông tin học sinh'
                ], 404);
            }

            $quiz = Quiz::find($quizId);
            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Đề thi không tồn tại'
                ], 404);
            }

            $now = now();
            if ($now < $quiz->start_time) {
                return response()->json([
                    'success' => false,
                    'message' => 'Đề thi chưa mở'
                ], 403);
            }

            if ($quiz->end_time && $now > $quiz->end_time) {
                return response()->json([
                    'success' => false,
                    'message' => 'Đề thi đã đóng'
                ], 403);
            }

            $exists = QuizResult::where('quiz_id', $quizId)
                ->where('student_id', $student->id)
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn đã nộp bài thi này'
                ], 403);
            }

            $totalQuestions = Question::where('quiz_id', $quizId)->count();
            $totalScore = 0;
            $correctCount = 0;

            foreach ($request->answers ?? [] as $answerData) {
                $question = Question::with('answers')->find($answerData['question_id']);
                if (!$question) continue;

                $studentAnswerIds = $answerData['answer_ids'] ?? [];
                $correctAnswerIds = $question->answers
                    ->where('is_correct', true)
                    ->pluck('id')
                    ->toArray();

                $isCorrect = false;

                if ($question->question_type === 'single') {
                    if (count($studentAnswerIds) === 1 && count($correctAnswerIds) === 1) {
                        $isCorrect = $studentAnswerIds[0] == $correctAnswerIds[0];
                    }
                } else {
                    sort($studentAnswerIds);
                    sort($correctAnswerIds);
                    $isCorrect = $studentAnswerIds === $correctAnswerIds;
                }

                if ($isCorrect) {
                    $totalScore++;
                    $correctCount++;
                }
            }

            $result = QuizResult::create([
                'quiz_id' => $quizId,
                'student_id' => $student->id,
                'score' => $totalScore,
                'completed_at' => $now
            ]);

            foreach ($request->answers ?? [] as $answerData) {
                if (empty($answerData['answer_ids'])) continue;

                foreach ($answerData['answer_ids'] as $answerId) {
                    ResultAnswer::create([
                        'result_id' => $result->id,
                        'question_id' => $answerData['question_id'],
                        'answer_id' => $answerId
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Nộp bài thành công',
                'data' => [
                    'result_id' => $result->id,
                    'score' => $totalScore,
                    'correct_answers' => $correctCount,
                    'total_questions' => $totalQuestions,
                    'percentage' => $totalQuestions > 0
                        ? round(($correctCount / $totalQuestions) * 100, 2)
                        : 0
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi nộp bài',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy kết quả bài thi
     */
    public function getResult($resultId)
    {
        try {
            $userId = Auth::id();
            $student = Student::where('user_id', $userId)->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông tin học sinh'
                ], 404);
            }

            $result = QuizResult::with(['quiz', 'resultAnswers.answer', 'resultAnswers.question'])
                ->where('id', $resultId)
                ->where('student_id', $student->id)
                ->first();

            if (!$result) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy kết quả'
                ], 404);
            }

            $quizDetails = Quiz::with(['questions.answers'])
                ->find($result->quiz_id);

            $detailedResults = [];
            foreach ($quizDetails->questions as $question) {
                $studentAnswerIds = $result->resultAnswers
                    ->where('question_id', $question->id)
                    ->pluck('answer_id')
                    ->toArray();

                $correctAnswerIds = $question->answers
                    ->where('is_correct', true)
                    ->pluck('id')
                    ->toArray();

                $isCorrect = false;
                if ($question->question_type === 'single') {
                    if (count($studentAnswerIds) === 1 && count($correctAnswerIds) === 1) {
                        $isCorrect = $studentAnswerIds[0] == $correctAnswerIds[0];
                    }
                } else {
                    sort($studentAnswerIds);
                    sort($correctAnswerIds);
                    $isCorrect = $studentAnswerIds === $correctAnswerIds;
                }

                $detailedResults[] = [
                    'question_id' => $question->id,
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'student_answer_ids' => $studentAnswerIds,
                    'correct_answer_ids' => $correctAnswerIds,
                    'is_correct' => $isCorrect,
                    'answers' => $question->answers->map(function ($answer) use ($studentAnswerIds) {
                        return [
                            'id' => $answer->id,
                            'answer_text' => $answer->answer_text,
                            'is_correct' => $answer->is_correct,
                            'is_selected' => in_array($answer->id, $studentAnswerIds)
                        ];
                    })
                ];
            }

            return response()->json([
                'success' => true,
                'message' => 'Lấy kết quả thành công',
                'data' => [
                    'result' => $result,
                    'quiz' => $result->quiz,
                    'detailed_results' => $detailedResults,
                    'summary' => [
                        'score' => $result->score,
                        'completed_at' => $result->completed_at,
                        'total_questions' => count($detailedResults),
                        'correct_answers' => count(array_filter($detailedResults, fn($item) => $item['is_correct'])),
                        'percentage' => count($detailedResults) > 0 ?
                            round((count(array_filter($detailedResults, fn($item) => $item['is_correct'])) / count($detailedResults)) * 100, 2) : 0
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy kết quả',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy danh sách quiz có thể làm
     */
    public function getAvailableQuizzes($classId)
    {
        try {
            $userId = Auth::id();
            $student = Student::where('user_id', $userId)->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông tin học sinh'
                ], 404);
            }

            $now = now();
            $quizzes = Quiz::where('class_id', $classId)
                ->where('start_time', '<=', $now)
                ->where(function ($query) use ($now) {
                    $query->where(function ($q) use ($now) {
                        $q->whereNotNull('start_time')
                         ->whereNotNull('time_limit')
                         ->whereRaw("DATE_ADD(start_time, INTERVAL time_limit MINUTE) >= ?", [$now]);
                    })->orWhere(function ($q) use ($now) {
                        $q->whereNotNull('start_time')
                         ->whereNull('time_limit');
                    });
                })
                ->withCount(['quizResults' => function ($query) use ($student) {
                    $query->where('student_id', $student->id);
                }])
                ->orderBy('start_time', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách đề thi thành công',
                'data' => $quizzes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách đề thi',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy danh sách tất cả quiz của lớp học
     */
    public function getAllQuizzes($classId)
    {
        try {
            $userId = Auth::id();
            $student = Student::where('user_id', $userId)->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông tin học sinh'
                ], 404);
            }

            $quizzes = Quiz::where('class_id', $classId)
                ->withCount(['quizResults' => function ($query) use ($student) {
                    $query->where('student_id', $student->id);
                }])
                ->orderBy('start_time', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách đề thi thành công',
                'data' => $quizzes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách đề thi',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}