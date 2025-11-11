<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Mockery\Matcher\Subset;

class SubjectController extends Controller
{

    // Lấy danh sách
    public function index()
    {

        $subject = Subject::with('major')->paginate(5);
        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => 'Lấy danh sách học phần thành công',
            'data' => $subject
        ]);
    }
    // Thêm mới
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'major_id' => 'required|exists:majors,id',
                'name' => 'required|string|max:255|unique:subjects,name',
                'description' => 'nullable|string|max:500',
                'code' => 'required|String|max:255',
                'credit' => 'required|integer'
            ]);
            $subject = Subject::create($validated);
          
            return response()->json([
                'success' => true,
                'statusCode' => 201,
                'message' => 'Tạo học phần thành công',
                'data' => $subject
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'statusCode' => 400,
                'message' => 'Thông tin không hợp lệ',
                'errors' => $e->errors(),
            ], 400);
        }
    }
    //Sửa 
    public function update(Request $request, $id): JsonResponse{
        $subject = Subject::find(id: $id);
        if(!$subject){
            return response() -> json(data:[
                'success' => false,
                'statusCode' => 404,
                'message' => 'Không tin thấy học phần'
            ],status:404);
        }
        try{
            $validated = $request->validate(rules:[
                'major_id'  => 'sometimes|required|exists:majors,id',
                'code'      => 'sometimes|required|string|max:255',
                'name'      => 'sometimes|required|string|max:255|unique:subjects,name,' .$id,
                'description' => 'nullable|string|max:500',
                'credit'    => 'sometimes|required|integer',
            ]);
            $subject->update($validated);
            $subject->load(relations:'major');
            return response() ->json(data:[
                'success' => true,
                'statusCode' => 200,
                'message' => 'Cập nhật thành công',
                'data' => $subject,
            ]);
        }
        catch(ValidationException $e){
            return response() ->json(data:[
                'success' => false,
                'statusCode' => 400,
                'message' => 'Thông tin không hợp lệ',
                'errors' => $e->errors()
            ],status:400);
        }
    }

    //Xóa
    public function destroy($id){
        $subject = Subject::find(id: $id);
        if(!$subject){
            return response() ->json(data:[
                'success' =>false,
                'statusCode' => 404,
                'message' => 'Không tìm thấy học phần'
            ],status:404);
        }
        $subject->delete();
        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => 'Xóa học phần thành công'
        ]);
    }
}
