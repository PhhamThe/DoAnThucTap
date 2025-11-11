<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Semester;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SemesterController extends Controller
{
    // Lấy danh sách ngành
    public function index(Request $request)
    {
        $query = Semester::query();
        $semesters = $query->paginate(5);
        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => 'Lấy danh sách kỳ học thành công',
            'data' => $semesters
        ]);
    }

    // Thêm mới kì học
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([

                'name'       => 'required|string|max:255|unique:semesters,name',
                'year' => 'required|int',
                'start_date' => 'required|string',
                'end_date' => 'required|string',
            ]);

            $major = Semester::create($validated);

            return response()->json([
                'success' => true,
                'statusCode' => 201,
                'message' => 'Tạo kì học thành công',
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

    // Cập nhật kì học
    public function update(Request $request, $id)
    {
        $semester = Semester::find($id);
        if (!$semester) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy kỳ học'
            ], 404);
        }

        try {
            $validated = $request->validate([
                'name'       => 'required|string|max:255|unique:semesters,name,' . $id,
                'year'       => 'required|integer',
                'start_date' => 'required|date',
                'end_date'   => 'required|date',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors'  => $e->errors()
            ], 422);
        }

        $semester->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật kỳ học thành công',
            'data'    => $semester
        ]);
    }

    // Xóa kỳ học
    public function destroy($id)
    {
        $semester = Semester::find($id);
        if (!$semester) {
            return response()->json([
                'success' => false,
                'statusCode' => 404,
                'message' => 'Không tìm thấy kỳ học'
            ], 404);
        }

        $semester->delete();

        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => 'Xóa kỳ học thành công'
        ]);
    }
}
