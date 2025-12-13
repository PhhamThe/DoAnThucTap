<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Question;
use App\Models\Answer;
use App\Models\Quiz;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class QuestionController extends Controller
{
    /**
     * Lấy danh sách câu hỏi của một quiz
     */
    public function index($quizId)
    {
        try {
            $questions = Question::where('quiz_id', $quizId)
                ->with('answers')
                ->orderBy('created_at', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách câu hỏi thành công',
                'data' => $questions
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách câu hỏi',
                'error' => $e->getMessage()
            ], 500);
        }
    }

 


    /**
     * Cập nhật nhiều câu hỏi cho quiz (dùng trong form tạo/sửa quiz)
     */
    public function updateMultiQuestion(Request $request, $quizId)
    {
        $validator = Validator::make($request->all(), [
            'questions' => 'required|array|min:1',
            'questions.*.question_text' => 'required|string',
            'questions.*.question_type' => 'required|in:single,multiple',
            'questions.*.points' => 'nullable|numeric|min:0.5',
            'questions.*.answers' => 'required|array|min:2',
            'questions.*.answers.*.answer_text' => 'required|string',
            'questions.*.answers.*.is_correct' => 'required|boolean'
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
            // Lấy quiz để kiểm tra tồn tại
            $quiz = Quiz::find($quizId);
            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz không tồn tại'
                ], 404);
            }

            // Xóa tất cả questions cũ và answers liên quan
            $questionIds = $quiz->questions()->pluck('id');
            Answer::whereIn('question_id', $questionIds)->delete();
            $quiz->questions()->delete();

            $createdQuestions = [];

            // Tạo questions và answers mới
            foreach ($request->questions as $questionData) {
                $question = Question::create([
                    'quiz_id' => $quizId,
                    'question_text' => $questionData['question_text'],
                    'question_type' => $questionData['question_type']
                ]);

                // Tạo các đáp án
                $answers = [];
                foreach ($questionData['answers'] as $answerData) {
                    $answers[] = [
                        'question_id' => $question->id,
                        'answer_text' => $answerData['answer_text'],
                        'is_correct' => $answerData['is_correct'],
                        'created_at' => now(),
                        'updated_at' => now()
                    ];
                }

                Answer::insert($answers);

                // Load lại câu hỏi với đáp án
                $question->load('answers');
                $createdQuestions[] = $question;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật câu hỏi thành công',
                'data' => $createdQuestions
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật câu hỏi',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
