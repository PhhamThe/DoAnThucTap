<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserAccountController extends Controller
{
    // Lấy danh sách tài khoản
    public function index(Request $request)
    {
        $query = User::query();

        // Lọc theo vai trò (admin, teacher, student)
        if ($request->has('role') && in_array($request->role, ['admin', 'teacher', 'student'])) {
            $query->where('role', $request->role);
        }
        if($request->has('search'))
        {
            $query->where('username', $request->search)
            ->orWhere('email', $request->search);
        }


        $users = $query->paginate(5);

        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => 'Lấy danh sách người dùng thành công',
            'data' => $users
        ]);
    }

    // Thêm mới tài khoản
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'username'  => 'required|string|max:255|unique:users,username',
                'password'  => 'required|string|min:6',
                'full_name' => 'required|string|max:255',
                'email'     => 'nullable|email|unique:users,email',
                'role'      => 'required|in:admin,teacher,student',
            ]);

            $validated['password'] = Hash::make($validated['password']);
            $user = User::create($validated);

            if ($user->role === 'student') {

                //Tạo mã số sinh viên
                $latestStudent = Student::orderByDesc('id')->first();
                if ($latestStudent && isset($latestStudent->mssv)) {
                    $lastNumber = intval(substr($latestStudent->mssv, -3));
                    $newNumber = str_pad($lastNumber + 1, 3, '0', STR_PAD_LEFT);
                } else {
                    $newNumber = '001';
                }
                $mssv = 'SV' . date('Y') . $newNumber;

                Student::create([
                    'user_id' => $user->id,
                    'mssv'    => $mssv,
                    'name'=>$user->full_name,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else if ($request->role === 'teacher') {
                Teacher::create([
                    'user_id' => $user->id,
                    'name' => $user->full_name,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return response()->json([
                'success' => true,
                'statusCode' => 201,
                'message' => 'Tạo tài khoản thành công',
                'data' => $user
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

    // Cập nhật tài khoản
    public function update(Request $request, $id)
    {
        try {
            $user = User::find($id);
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'statusCode' => 404,
                    'message' => 'Không tìm thấy người dùng'
                ], 404);
            }

            $validated = $request->validate([
                'username'  => 'sometimes|required|string|max:255|unique:users,username,' . $id,
                'password'  => 'sometimes|string|min:6',
                'full_name' => 'sometimes|required|string|max:255',
                'email'     => 'nullable|email|unique:users,email,' . $id,
                'role'      => 'sometimes|required|in:admin,teacher,student',
            ]);

            if (isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            }

            $user->update($validated);

            return response()->json([
                'success' => true,
                'statusCode' => 200,
                'message' => 'Cập nhật tài khoản thành công',
                'data' => $user
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
    // Xóa tài khoản
    public function destroy($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'success' => false,
                'statusCode' => 404,
                'message' => 'Không tìm thấy người dùng'
            ], 404);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'statusCode' => 200,
            'message' => 'Xóa tài khoản thành công'
        ]);
    }
}
