<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GradeComponent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;

class GradeComponentController extends Controller
{

    public function index(Request $request)
    {
        $query = GradeComponent::query();
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active') && in_array($request->is_active, ['0', '1'])) {
            $query->where('is_active', $request->is_active);
        }


        $query->orderBy('order')->orderBy('created_at', 'desc');

        $perPage = $request->limit ?? 5;
        $components = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => 'Lấy danh sách loại thành phần điểm thành công',
            'data' => $components
        ]);
    }


    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'code' => 'required|string|max:20|unique:grade_components,code',
                'name' => 'required|string|max:100',
                'default_weight' => 'required|numeric|min:0|max:100',
                'description' => 'nullable|string',
                'order' => 'required|integer|min:0',
                'is_active' => 'required|boolean',
            ]);


            $validated['default_weight'] = floatval($validated['default_weight']);
            $component = GradeComponent::create($validated);
            
            return response()->json([
                'success' => true,
                'statusCode' => 201,
                'message' => 'Tạo loại thành phần điểm thành công',
                'data' => $component
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


    public function show($id)
    {
        $component = GradeComponent::find($id);
        
        if (!$component) {
            return response()->json([
                'success' => false,
                'statusCode' => 404,
                'message' => 'Không tìm thấy loại thành phần điểm'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => 'Lấy thông tin loại thành phần điểm thành công',
            'data' => $component
        ]);
    }


    public function update(Request $request, $id)
    {
        try {
            $component = GradeComponent::find($id);
            if (!$component) {
                return response()->json([
                    'success' => false,
                    'statusCode' => 404,
                    'message' => 'Không tìm thấy loại thành phần điểm'
                ], 404);
            }

            $validated = $request->validate([
                'code' => [
                    'required',
                    'string',
                    'max:20',
                    Rule::unique('grade_components')->ignore($component->id)
                ],
                'name' => 'required|string|max:100',
                'default_weight' => 'required|numeric|min:0|max:100',
                'description' => 'nullable|string',
                'order' => 'required|integer|min:0',
                'is_active' => 'required|boolean',
            ]);

            $validated['default_weight'] = floatval($validated['default_weight']);

            $component->update($validated);

            return response()->json([
                'success' => true,
                'statusCode' => 200,
                'message' => 'Cập nhật loại thành phần điểm thành công',
                'data' => $component
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


    public function destroy($id)
    {
        $component = GradeComponent::find($id);
        if (!$component) {
            return response()->json([
                'success' => false,
                'statusCode' => 404,
                'message' => 'Không tìm thấy loại thành phần điểm'
            ], 404);
        }

        $gradeCount = $component->grades()->count();
        
        if ($gradeCount > 0) {
            return response()->json([
                'success' => false,
                'statusCode' => 400,
                'message' => 'Không thể xóa loại thành phần điểm vì đang có điểm sử dụng loại điểm này'
            ], 400);
        }

        $component->delete();

        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => 'Xóa loại thành phần điểm thành công'
        ]);
    }


    public function active(Request $request)
    {
        $components = GradeComponent::where('is_active', true)
            ->orderBy('order')
            ->get();
            
        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => 'Lấy danh sách loại thành phần điểm đang hoạt động thành công',
            'data' => $components
        ]);
    }
}