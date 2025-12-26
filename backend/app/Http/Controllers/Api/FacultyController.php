<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faculty;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class FacultyController extends Controller
{
    // Lấy danh sách khoa viện
    public function index(Request $request)
    {
        $query = Faculty::query();

        $users = $query->paginate(10);

        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => 'Lấy danh sách khoa - viện thành công',
            'data' => $users
        ]);
    }

    // Thêm mới khoa viện
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name'  => 'required|string|max:255|unique:faculties,name',
                'description'  => 'string|max:1000',

            ]);

            $faculty = Faculty::create($validated);
            
            return response()->json([
                'success' => true,
                'statusCode' => 201,
                'message' => 'Tạo khoa viện thành công',
                'data' => $faculty
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
    // Cập nhật khoa viện
    public function update(Request $request, $id)
    {
        try {
            $faculty = Faculty::find($id);
            if (!$faculty) {
                return response()->json([
                    'success' => false,
                    'statusCode' => 404,
                    'message' => 'Không tìm thấy khoa-viện'
                ], 404);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:faculties,name,' . $id,
                'description' => 'string|max:500',
            ]);


            $faculty->update($validated);

            return response()->json([
                'success' => true,
                'statusCode' => 200,
                'message' => 'Cập nhật khoa viện-thành công',
                'data' => $faculty
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
    // Xóa thông tin khoa viện
    public function destroy($id)
    {
        $faculty = Faculty::find($id);
        if (!$faculty) {
            return response()->json([
                'success' => false,
                'statusCode' => 404,
                'message' => 'Không tìm thấy người dùng'
            ], 404);
        }

        $faculty->delete();

        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => 'Xóa khoa viện thành công'
        ]);
    }
}
