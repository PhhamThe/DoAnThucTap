<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    /**
     * Cập nhật thông tin cá nhân
     */
    public function update(Request $request)
    {
        try {
            $userId = Auth::id();
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Người dùng không tồn tại'
                ], 404);
            }

            $userRole = DB::table('users')
                ->where('id', $userId)
                ->value('role');

            // Validate dữ liệu đầu vào
            $validator = Validator::make($request->all(), [
                'full_name' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255|unique:users,email,' . $userId,
                'phone' => 'nullable|string|max:20',
                'birth_date' => 'nullable|date',
                'gender' => 'nullable|in:male,female,other',
                'address' => 'nullable|string|max:500',
                'description' => 'nullable|string',
                'current_password' => 'nullable|string|min:6',
                'new_password' => 'nullable|string|min:6',
                'confirm_password' => 'nullable|string|min:6|same:new_password',
                'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:20480',
            ], [
                'email.unique' => 'Email này đã được sử dụng',
                'confirm_password.same' => 'Mật khẩu xác nhận không khớp',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();
            try {
                $userData = [];
                if ($request->has('full_name') && $request->full_name) {
                    $userData['full_name'] = $request->full_name;
                }
                if ($request->has('email') && $request->email) {
                    $userData['email'] = $request->email;
                }
                
                if (!empty($userData)) {
                    DB::table('users')
                        ->where('id', $userId)
                        ->update($userData);
                }

                if ($request->hasFile('avatar')) {
                    $this->handleAvatarUpload($userId, $request->file('avatar'));
                }
                $detailData = [];
                $detailFields = ['phone', 'birth_date', 'gender', 'address', 'description'];
                
                foreach ($detailFields as $field) {
                    if ($request->has($field) && !is_null($request->$field)) {
                        $detailData[$field] = $request->$field;
                    }
                }

                if (!empty($detailData)) {
                    if ($userRole === 'student') {
                        DB::table('students')
                            ->where('user_id', $userId)
                            ->update($detailData);
                    } elseif ($userRole === 'teacher') {
                        DB::table('teachers')
                            ->where('user_id', $userId)
                            ->update($detailData);
                    }
                }

                // Xử lý đổi mật khẩu nếu có
                if ($request->filled('current_password') && $request->filled('new_password')) {
                    $this->updatePassword($userId, $request);
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Cập nhật thông tin thành công'
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Xử lý upload avatar
     */
    private function handleAvatarUpload($userId, $file)
    {

        $fileName = 'avatar_' . $userId . '_' . time() . '.' . $file->getClientOriginalExtension();
        $filePath = $file->storeAs('avatars', $fileName, 'public');
        $avatarData = [
            'path' => $filePath,
            'name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
        ];

        DB::table('users')
            ->where('id', $userId)
            ->update(['avatar' => json_encode($avatarData)]);
    }

    /**
     * Cập nhật mật khẩu
     */
    private function updatePassword($userId, $request)
    {
        $currentUser = DB::table('users')
            ->where('id', $userId)
            ->first();
            
        if (!Hash::check($request->current_password, $currentUser->password)) {
            throw new \Exception('Mật khẩu hiện tại không đúng');
        }
        DB::table('users')
            ->where('id', $userId)
            ->update([
                'password' => Hash::make($request->new_password)
            ]);
    }

    /**
     * Tải avatar
     */
    public function getAvatar()
    {
        try {
            $userId = Auth::id();
            
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Người dùng không tồn tại'
                ], 404);
            }

            $user = DB::table('users')
                ->where('id', $userId)
                ->first();
                
            if (!$user || !$user->avatar) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không có ảnh đại diện'
                ], 404);
            }

            $avatarData = json_decode($user->avatar, true);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'url' => asset('storage/' . $avatarData['path']),
                    'metadata' => $avatarData
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }
}