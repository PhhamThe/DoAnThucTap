<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassStudent;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use Tymon\JWTAuth\Facades\JWTAuth;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        try {
            $validate = $request->validate([
                'username' => 'required|string|max:30',
                'password' => 'required|string|max:20',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'statusCode' => 400,
                'message' => 'Không được để trống thông tin',
                'errors' => $e->errors()
            ], 400);
        }

        $user = User::where('username', $validate['username'])->first();

        if (!$user || !Hash::check($validate['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'statusCode' => 404,
                'message' => 'Tài khoản hoặc mật khẩu không đúng'
            ]);
        }

        // Tạo JWT token
        $token = JWTAuth::fromUser($user);

        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => 'Đăng nhập thành công',
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60
        ]);
    }
    public function me()
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            if (!$user) return response()->json(['success' => false, 'message' => 'User not found'], 404);

            $responseData = [
                'id' => $user->id,
                'username' => $user->username,
                'full_name' => $user->full_name,
                'role' => $user->role,
                'email' => $user->email,
                'avatar' => $user->avatar,
            ];

            if ($user->role === 'student') {
                $student = Student::with(['major.faculty'])
                    ->where('user_id', $user->id)
                    ->first();

                if ($student) {
                    $responseData['detail_info'] = [
                        'mssv' => $student->mssv,
                        'address' => $student->address,
                        'phone' => $student->phone,
                        'birth_date' => $student->birth_date,
                        'gender' => $student->gender,
                        'description' => $student->description,
                        'major_id' => $student->major_id,
                    ];

                    if ($student->major) {
                        $responseData['detail_info']['major'] = [
                            'id' => $student->major->id,
                            'name' => $student->major->name,
                            'description' => $student->major->description
                        ];

                        if ($student->major->faculty) {
                            $responseData['detail_info']['faculty'] = [
                                'id' => $student->major->faculty->id,
                                'name' => $student->major->faculty->name,
                                'description' => $student->major->faculty->description
                            ];
                        }
                    }
                }
            } elseif ($user->role === 'teacher') {
                $teacher = Teacher::where('user_id', $user->id)->first();

                if ($teacher) {
                    $responseData['detail_info'] = [
                        'address' => $teacher->address,
                        'phone' => $teacher->phone,
                        'birth_date' => $teacher->birth_date,
                        'gender' => $teacher->gender,
                        'description' => $teacher->description,
                    ];
                }
            }

            return response()->json(['success' => true, 'user' => $responseData]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
