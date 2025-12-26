<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Grade;
use App\Models\GradeComponent;
use App\Models\ClassModel;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudentGradeController extends Controller
{
    public function getStudentGrades($classId)
    {
        try {
            $userId = Auth::id();
            
            // Lấy thông tin sinh viên
            $student = Student::where('user_id', $userId)->first();
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy sinh viên'
                ], 404);
            }
            
            // Lấy thông tin lớp học
            $class = ClassModel::with('subject')->find($classId);
            if (!$class) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lớp học không tồn tại'
                ], 404);
            }
            
            // Lấy các loại điểm
            $gradeTypes = GradeComponent::where('is_active', 1)
                ->orderBy('order')
                ->get();
            
            // Lấy điểm của sinh viên trong lớp
            $grades = Grade::where('student_id', $student->id)
                ->where('class_id', $classId)
                ->get()
                ->keyBy('type');
            
            // Tính điểm tổng kết
            $totalScore = $this->calculateTotalScore($grades, $gradeTypes);
            
            // Lấy điểm cuối kỳ (nếu có)
            $finalGrade = $this->getFinalGrade($student->id, $classId);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'grades' => $grades,
                    'grade_types' => $gradeTypes,
                    'student' => [
                        'id' => $student->id,
                        'name' => $student->name,
                        'mssv' => $student->mssv
                    ],
                    'class_info' => $class,
                    'total_score' => $totalScore,
                    'final_grade' => $finalGrade
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy điểm: ' . $e->getMessage()
            ], 500);
        }
    }
    
    private function calculateTotalScore($grades, $gradeTypes)
    {
        $totalScore = 0;
        $hasGrades = false;
        
        foreach ($gradeTypes as $type) {
            $grade = $grades->get($type->code);
            if ($grade && $grade->score !== null) {
                $weight = $type->default_weight / 100;
                $scorePercent = ($grade->score / $grade->max_score) * 100;
                $totalScore += $scorePercent * $weight;
                $hasGrades = true;
            }
        }
        
        return $hasGrades ? ($totalScore / 10) : null; // Chuyển về thang điểm 10
    }
    
    private function getFinalGrade($studentId, $classId)
    {
        // Logic lấy điểm cuối kỳ từ bảng final_grades nếu có
        // Hoặc tính toán dựa trên các điểm thành phần
        
        return null; // Hoặc trả về dữ liệu final_grade nếu có
    }
}