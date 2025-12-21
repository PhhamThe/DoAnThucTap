<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassStudent;
use App\Models\Grade;
use App\Models\GradeComponent;
use App\Models\Teacher;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    /**
     *Lấy danh sách sinh viên và điểm hiện tại của lớp
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

            // Lấy các loại điểm (attendance, assignment, midterm, final)
            $gradeTypes = GradeComponent::where('is_active', 1)
                ->orderBy('order')
                ->get(['id', 'code', 'name', 'default_weight']);

            // Lấy điểm hiện tại (nếu có)
            $existingGrades = Grade::where('class_id', $classId)
                ->get()
                ->groupBy(['student_id', 'type']);

            // Tạo dữ liệu trả về
            $result = [];
            foreach ($students as $student) {
                $studentRow = [
                    'student_id' => $student['id'],
                    'mssv' => $student['mssv'],
                    'name' => $student['name'],
                ];

                // Thêm điểm từng loại
                foreach ($gradeTypes as $type) {
                    $grade = $existingGrades[$student['id']][$type->code] ?? null;
                    $grade = $grade ? $grade->first() : null;
                    
                    $studentRow[$type->code] = [
                        'score' => $grade ? (float)$grade->score : null,
                        'max_score' => $grade ? (float)$grade->max_score : 
                            ($type->code === 'final' ? 100 : 10),
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
     *  Lưu điểm 
     */
    public function saveGrade(Request $request, $classId, $studentId)
    {
        try {
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
}