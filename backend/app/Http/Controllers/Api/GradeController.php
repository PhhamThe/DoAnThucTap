<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassModel;
use App\Models\ClassStudent;
use App\Models\Grade;
use App\Models\GradeComponent;
use App\Models\GradeRule;
use App\Models\FinalGrade;
use App\Models\SubjectProgress;
use App\Models\Teacher;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    /**
     * Lấy danh sách sinh viên và điểm hiện tại của lớp
     */
    public function getStudentGrades($classId)
    {
        try {
            // Lấy danh sách sinh viên trong lớp
            $students = ClassStudent::with(['student'])
                ->where('class_id', $classId)
                ->get()
                ->map(function ($classStudent) {
                    return [
                        'id' => $classStudent->student->id,
                        'mssv' => $classStudent->student->mssv,
                        'name' => $classStudent->student->name,
                    ];
                });

            // Lấy các loại điểm
            $gradeTypes = GradeComponent::where('is_active', 1)
                ->orderBy('order')
                ->get(['id', 'code', 'name', 'default_weight']);

            // Lấy điểm hiện có, nhóm theo student_id và type
            $existingGrades = Grade::where('class_id', $classId)
                ->get()
                ->groupBy(['student_id', 'type']);

            // Lấy điểm tổng kết (final_grades) nếu có
            $finalGrades = FinalGrade::where('class_id', $classId)
                ->get()
                ->keyBy('student_id');

            $result = [];
            foreach ($students as $student) {
                $studentRow = [
                    'student_id' => $student['id'],
                    'mssv' => $student['mssv'],
                    'name' => $student['name'],
                    'final_grade' => null,
                ];

                // Thêm điểm từng loại
                foreach ($gradeTypes as $type) {
                    $grade = $existingGrades[$student['id']][$type->code] ?? null;
                    $grade = $grade ? $grade->first() : null;

                    $studentRow[$type->code] = [
                        'score' => $grade ? (float)$grade->score : null,
                        'max_score' => $grade ? (float)$grade->max_score : ($type->code === 'final' ? 100 : 10),
                    ];
                }

                // Thêm điểm tổng kết nếu có
                if (isset($finalGrades[$student['id']])) {
                    $final = $finalGrades[$student['id']];
                    $studentRow['final_grade'] = [
                        'total_score' => (float)$final->total_score,
                        'letter_grade' => $final->letter_grade,
                        'status' => $final->status,
                    ];
                }

                $result[] = $studentRow;
            }

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách điểm thành công',
                'data' => [
                    'students' => $result,
                    'grade_types' => $gradeTypes
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách điểm',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lưu điểm và tự động tính điểm tổng kết
     */
    public function saveGrade(Request $request, $classId, $studentId)
    {
        try {
            // Validate dữ liệu đầu vào
            $validated = $request->validate([
                'type' => 'required|string|in:attendance,assignment,midterm,final',
                'score' => 'required|numeric|min:0',
                'max_score' => 'required|numeric|min:1',
            ]);

            // Kiểm tra điểm hợp lệ
            if ($validated['score'] > $validated['max_score']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Điểm không được lớn hơn điểm tối đa'
                ], 400);
            }

            // Lấy teacher_id
            $userId = Auth::id();
            $teacherId = Teacher::where('user_id', $userId)->value('id');

            // Tạo hoặc cập nhật điểm
            $grade = Grade::updateOrCreate(
                [
                    'class_id' => $classId,
                    'student_id' => $studentId,
                    'type' => $validated['type'],
                ],
                [
                    'score' => $validated['score'],
                    'max_score' => $validated['max_score'],
                    'teacher_id' => $teacherId,
                    'graded_at' => now(),
                ]
            );

            // Tự động tính lại điểm tổng kết sau khi lưu điểm
            $this->calculateFinalGrade($classId, $studentId);

            return response()->json([
                'success' => true,
                'message' => 'Lưu điểm thành công',
                'data' => $grade
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lưu điểm',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tính điểm tổng kết cho một học sinh trong lớp
     */
    private function calculateFinalGrade($classId, $studentId)
    {
        // Lấy tất cả điểm thành phần của học sinh
        $grades = Grade::where('class_id', $classId)
            ->where('student_id', $studentId)
            ->where('is_finalized', 1)
            ->get()
            ->keyBy('type');

        // Lấy môn học của lớp
        $class = ClassModel::with('subject')->find($classId);
        if (!$class || !$class->subject) {
            return false;
        }

        // Lấy quy tắc tính điểm
        $gradeRule = GradeRule::where('subject_id', $class->subject_id)
            ->where(function ($query) use ($classId) {
                $query->where('class_id', $classId)
                    ->orWhereNull('class_id');
            })
            ->first();

        // Mặc định weights và điểm đậu
        $defaultWeights = [
            'attendance' => 10,
            'assignment' => 20,
            'midterm' => 20,
            'final' => 50
        ];

        $weights = $defaultWeights;
        $passGrade = 5.00;
        $requireVideoProgress = 0;
        $minVideoProgress = 80.00;

        if ($gradeRule) {
            if (is_array($gradeRule->weights)) {
                $weights = $gradeRule->weights;
            } elseif (is_string($gradeRule->weights) && !empty($gradeRule->weights)) {
                $weights = json_decode($gradeRule->weights, true) ?? $defaultWeights;
            }

            $passGrade = $gradeRule->pass_grade ?? 5.00;
            $requireVideoProgress = $gradeRule->require_video_progress ?? 0;
            $minVideoProgress = $gradeRule->min_video_progress ?? 80.00;
        }

        // Tính điểm tổng theo trọng số
        $totalScore = 0;
        foreach ($weights as $type => $weight) {
            $score = isset($grades[$type]) ? $grades[$type]->score : 0;
            $totalScore += $score * ($weight / 100);
        }

        $letterGrade = $this->convertToLetterGrade($totalScore);
        $status = $totalScore >= $passGrade ? 'passed' : 'failed';

        // Lấy tiến độ video
        $videoProgress = SubjectProgress::where('student_id', $studentId)
            ->where('subject_id', $class->subject_id)
            ->value('progress') ?? 0;

        // Kiểm tra điều kiện thi cuối kỳ
        $canTakeFinal = 1;
        if ($requireVideoProgress) {
            $canTakeFinal = $videoProgress >= $minVideoProgress ? 1 : 0;
        }

        // Lấy điểm từng loại (dùng cho lưu vào final_grades)
        $attendanceScore = isset($grades['attendance']) ? $grades['attendance']->score : 0;
        $assignmentScore = isset($grades['assignment']) ? $grades['assignment']->score : 0;
        $midtermScore = isset($grades['midterm']) ? $grades['midterm']->score : 0;
        $finalScore = isset($grades['final']) ? $grades['final']->score : 0;

        // Lưu điểm tổng kết
        FinalGrade::updateOrCreate(
            [
                'student_id' => $studentId,
                'class_id' => $classId,
            ],
            [
                'subject_id' => $class->subject_id,
                'attendance_score' => $attendanceScore,
                'assignment_score' => $assignmentScore,
                'midterm_score' => $midtermScore,
                'final_score' => $finalScore,
                'total_score' => $totalScore,
                'letter_grade' => $letterGrade,
                'video_progress' => $videoProgress,
                'can_take_final' => $canTakeFinal,
                'status' => $status,
                'calculated_at' => now(),
            ]
        );

        return true;
    }

    /**
     * Chuyển điểm số thành điểm chữ
     */
    private function convertToLetterGrade($score)
    {
        if ($score >= 8.5) return 'A';
        if ($score >= 7.0) return 'B';
        if ($score >= 5.5) return 'C';
        if ($score >= 4.0) return 'D';
        return 'F';
    }

    /**
     * Tính lại điểm tổng kết cho cả lớp
     */
    public function recalculateAllGrades($classId)
    {
        try {
            // Lấy tất cả học sinh trong lớp
            $students = ClassStudent::where('class_id', $classId)->get();

            foreach ($students as $student) {
                $this->calculateFinalGrade($classId, $student->student_id);
            }

            return response()->json([
                'success' => true,
                'message' => 'Đã tính lại điểm tổng kết cho cả lớp'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tính lại điểm',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
