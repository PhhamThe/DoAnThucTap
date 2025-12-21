<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GradeRule;
use App\Models\Subject;
use App\Models\Classes;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;

class GradeRuleController extends Controller
{
    // Lấy danh sách quy tắc điểm
    public function index(Request $request)
    {
        $query = GradeRule::with(['subject', 'class']);

        // Tìm kiếm
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('subject', function($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%")
                       ->orWhere('code', 'like', "%{$search}%");
                })
                ->orWhereHas('class', function($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%");
                })
                ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Lọc theo môn học
        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        // Lọc theo lớp học
        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        // Lọc theo trạng thái
        if ($request->has('is_active') && in_array($request->is_active, ['0', '1'])) {
            $query->where('is_active', $request->is_active);
        }

        // Sắp xếp
        $query->orderBy('subject_id')
              ->orderBy('class_id', 'desc') // Ưu tiên rule cụ thể trước rule chung
              ->orderBy('created_at', 'desc');

        // Phân trang
        $perPage = $request->limit ?? 5;
        $rules = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => 'Lấy danh sách quy tắc điểm thành công',
            'data' => $rules
        ]);
    }

    // Thêm mới quy tắc điểm
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'subject_id' => 'required|integer|exists:subjects,id',
                'class_id' => 'nullable|integer|exists:classes,id',
                'pass_grade' => 'required|numeric|min:0|max:10',
                'min_video_progress' => 'nullable|numeric|min:0|max:100',
                'require_video_progress' => 'required|boolean',
                'min_assignments' => 'nullable|integer|min:0',
                'min_attendance_rate' => 'nullable|integer|min:0|max:100',
                'weights' => 'required|array',
                'notes' => 'nullable|string',
                'is_active' => 'required|boolean',
            ]);

            // Validate weights structure
            $weights = $validated['weights'];
            $requiredComponents = ['attendance', 'assignment', 'midterm', 'final'];
            
            foreach ($requiredComponents as $component) {
                if (!isset($weights[$component])) {
                    return response()->json([
                        'success' => false,
                        'statusCode' => 400,
                        'message' => "Thiếu trọng số cho: {$component}"
                    ], 400);
                }
                
                if (!is_numeric($weights[$component]) || $weights[$component] < 0 || $weights[$component] > 100) {
                    return response()->json([
                        'success' => false,
                        'statusCode' => 400,
                        'message' => "Trọng số {$component} phải là số từ 0-100"
                    ], 400);
                }
            }

            // Kiểm tra tổng trọng số = 100%
            $totalWeight = array_sum($weights);
            if (abs($totalWeight - 100) > 0.01) {
                return response()->json([
                    'success' => false,
                    'statusCode' => 400,
                    'message' => 'Tổng trọng số phải bằng 100%'
                ], 400);
            }

            // Kiểm tra xem đã tồn tại rule cho subject_id + class_id này chưa
            $existingRule = GradeRule::where('subject_id', $validated['subject_id'])
                ->where('class_id', $validated['class_id'])
                ->first();

            if ($existingRule) {
                return response()->json([
                    'success' => false,
                    'statusCode' => 400,
                    'message' => 'Đã tồn tại quy tắc điểm cho môn học và lớp học này'
                ], 400);
            }

            $rule = GradeRule::create($validated);
            
            // Load relationships
            $rule->load(['subject', 'class']);
            
            return response()->json([
                'success' => true,
                'statusCode' => 201,
                'message' => 'Tạo quy tắc điểm thành công',
                'data' => $rule
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'statusCode' => 400,
                'message' => 'Thông tin không hợp lệ',
                'errors' => $e->errors()
            ], 400);
        }
    }

    // Hiển thị chi tiết quy tắc điểm
    public function show($id)
    {
        $rule = GradeRule::with(['subject', 'class'])->find($id);
        
        if (!$rule) {
            return response()->json([
                'success' => false,
                'statusCode' => 404,
                'message' => 'Không tìm thấy quy tắc điểm'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => 'Lấy thông tin quy tắc điểm thành công',
            'data' => $rule
        ]);
    }

    // Cập nhật quy tắc điểm
    public function update(Request $request, $id)
    {
        try {
            $rule = GradeRule::find($id);
            if (!$rule) {
                return response()->json([
                    'success' => false,
                    'statusCode' => 404,
                    'message' => 'Không tìm thấy quy tắc điểm'
                ], 404);
            }

            $validated = $request->validate([
                'subject_id' => 'required|integer|exists:subjects,id',
                'class_id' => 'nullable|integer|exists:classes,id',
                'pass_grade' => 'required|numeric|min:0|max:10',
                'min_video_progress' => 'nullable|numeric|min:0|max:100',
                'require_video_progress' => 'required|boolean',
                'min_assignments' => 'nullable|integer|min:0',
                'min_attendance_rate' => 'nullable|integer|min:0|max:100',
                'weights' => 'required|array',
                'notes' => 'nullable|string',
                'is_active' => 'required|boolean',
            ]);

            // Validate weights structure
            $weights = $validated['weights'];
            $requiredComponents = ['attendance', 'assignment', 'midterm', 'final'];
            
            foreach ($requiredComponents as $component) {
                if (!isset($weights[$component])) {
                    return response()->json([
                        'success' => false,
                        'statusCode' => 400,
                        'message' => "Thiếu trọng số cho: {$component}"
                    ], 400);
                }
                
                if (!is_numeric($weights[$component]) || $weights[$component] < 0 || $weights[$component] > 100) {
                    return response()->json([
                        'success' => false,
                        'statusCode' => 400,
                        'message' => "Trọng số {$component} phải là số từ 0-100"
                    ], 400);
                }
            }

            // Kiểm tra tổng trọng số = 100%
            $totalWeight = array_sum($weights);
            if (abs($totalWeight - 100) > 0.01) {
                return response()->json([
                    'success' => false,
                    'statusCode' => 400,
                    'message' => 'Tổng trọng số phải bằng 100%'
                ], 400);
            }

            // Kiểm tra xem có rule khác trùng subject_id + class_id không (trừ chính nó)
            $existingRule = GradeRule::where('subject_id', $validated['subject_id'])
                ->where('class_id', $validated['class_id'])
                ->where('id', '!=', $id)
                ->first();

            if ($existingRule) {
                return response()->json([
                    'success' => false,
                    'statusCode' => 400,
                    'message' => 'Đã tồn tại quy tắc điểm khác cho môn học và lớp học này'
                ], 400);
            }

            $rule->update($validated);
            
            // Load relationships
            $rule->load(['subject', 'class']);

            return response()->json([
                'success' => true,
                'statusCode' => 200,
                'message' => 'Cập nhật quy tắc điểm thành công',
                'data' => $rule
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'statusCode' => 400,
                'message' => 'Thông tin không hợp lệ',
                'errors' => $e->errors()
            ], 400);
        }
    }

    // Xóa quy tắc điểm
    public function destroy($id)
    {
        $rule = GradeRule::find($id);
        if (!$rule) {
            return response()->json([
                'success' => false,
                'statusCode' => 404,
                'message' => 'Không tìm thấy quy tắc điểm'
            ], 404);
        }

        $rule->delete();

        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => 'Xóa quy tắc điểm thành công'
        ]);
    }

    // API phụ: Lấy quy tắc điểm cho môn học và lớp học cụ thể
    public function getForClass(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|integer|exists:subjects,id',
            'class_id' => 'nullable|integer|exists:classes,id'
        ]);

        $query = GradeRule::where('subject_id', $request->subject_id)
            ->where('is_active', true);

        if ($request->class_id) {
            $query->where(function($q) use ($request) {
                $q->where('class_id', $request->class_id)
                  ->orWhereNull('class_id');
            })
            ->orderBy('class_id', 'desc'); // Ưu tiên rule cụ thể trước
        } else {
            $query->whereNull('class_id');
        }

        $rule = $query->first();

        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => $rule ? 'Lấy quy tắc điểm thành công' : 'Không tìm thấy quy tắc điểm',
            'data' => $rule
        ]);
    }
}