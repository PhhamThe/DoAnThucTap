<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use Exception;
use Illuminate\Support\Facades\Request;
use Illuminate\Validation\ValidationException;

class TeacherController extends Controller
{

    public function index()
    {

        $teacher = Teacher::paginate(5);
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách học giáo viên thành công',
            'data' => $teacher
        ]);
    }
}
