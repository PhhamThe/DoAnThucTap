<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Major;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MajorController extends Controller
{
    public function index(Request $request)
    {
        $majors = Major::with('faculty')->paginate(10);

        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => 'Lấy danh sách ngành thành công',
            'data' => $majors
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'faculty_id'  => 'required|exists:faculties,id',
                'name'        => 'required|string|max:255|unique:majors,name',
                'description' => 'nullable|string|max:500',
            ]);

            $major = Major::create($validated);

            // Load quan hệ faculty
            $major->load('faculty');

            return response()->json([
                'success' => true,
                'statusCode' => 201,
                'message' => 'Tạo ngành thành công',
                'data' => $major
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

    // Cập nhật ngành
    public function update(Request $request, $id)
    {
        $major = Major::find($id);
        if (!$major) {
            return response()->json([
                'success' => false,
                'statusCode' => 404,
                'message' => 'Không tìm thấy ngành'
            ], 404);
        }

        try {
            $validated = $request->validate([
                'faculty_id'  => 'sometimes|required|exists:faculties,id',
                'name'        => 'sometimes|required|string|max:255|unique:majors,name,' . $id,
                'description' => 'nullable|string|max:500',
            ]);

            $major->update($validated);

            // Load quan hệ faculty
            $major->load('faculty');

            return response()->json([
                'success' => true,
                'statusCode' => 200,
                'message' => 'Cập nhật ngành thành công',
                'data' => $major
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

    // Xóa ngành
    public function destroy($id)
    {
        $major = Major::find($id);
        if (!$major) {
            return response()->json([
                'success' => false,
                'statusCode' => 404,
                'message' => 'Không tìm thấy ngành'
            ], 404);
        }

        $major->delete();

        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => 'Xóa ngành thành công'
        ]);
    }
}
