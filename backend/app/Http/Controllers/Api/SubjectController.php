<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use DateTime;
use Illuminate\Http\Request;

class SubjectController extends Controller
{

    public function index()
    {
        $subjects = Subject::with('majors')->paginate(5);

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách môn học thành công',
            'data' => $subjects
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'major_ids'   => 'required|array',
            'major_ids.*' => 'exists:majors,id',
            'name'        => 'required|string|max:255|unique:subjects,name',
            'code'        => 'required|string|max:255|unique:subjects,code',
            'credit'      => 'required|integer',
            'description' => 'nullable|string|max:500',
        ]);
        $subject = Subject::create([
            'name'        => $validated['name'],
            'code'        => $validated['code'],
            'credit'      => $validated['credit'],
            'description' => $validated['description'] ?? null,
        ]);

        // Gán nhiều ngành
        $subject->majors()->sync($validated['major_ids']);

        return response()->json([
            'success' => true,
            'message' => 'Tạo môn học thành công',
            'data'    => $subject->load('majors'),
        ], 201);
    }


    public function update(Request $request, $id)
    {
        $subject = Subject::find($id);
        if (!$subject) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy môn học'
            ], 404);
        }

        $validated = $request->validate([
            'major_ids'   => 'sometimes|array',
            'major_ids.*' => 'exists:majors,id',
            'name'        => 'sometimes|required|string|max:255|unique:subjects,name,' . $id,
            'code'        => 'sometimes|required|string|max:255|unique:subjects,code,' . $id,
            'credit'      => 'sometimes|required|integer',
            'description' => 'nullable|string|max:500',
        ]);

        $subject->update($validated);

        if (isset($validated['major_ids'])) {
            $subject->majors()->sync($validated['major_ids']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thành công',
            'data'    => $subject->load('majors'),
        ]);
    }

    public function destroy($id)
    {
        $subject = Subject::find($id);
        if (!$subject) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy môn học'
            ], 404);
        }

        $subject->majors()->detach();
        $subject->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa môn học thành công'
        ]);
    }
}
