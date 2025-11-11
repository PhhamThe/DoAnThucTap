<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
            return response()->json(['success' => true, 'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'full_name' => $user->full_name,
                'role' => $user->role
            ]]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    
}
