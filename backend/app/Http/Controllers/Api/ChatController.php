<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\ClassModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ChatController extends Controller
{
    public function getMessages(Request $request, $classId)
    {
        try {
            $class = ClassModel::find($classId);
            if (!$class) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lớp học không tồn tại'
                ], 404);
            }

            $limit = $request->input('limit', 100);
            $since = $request->input('since', 0);

            $query = Message::with(['sender'])
                ->where('class_id', $classId);

            if ($since > 0) {
                $query->where('created_at', '>', date('Y-m-d H:i:s', $since));
            }

            $messages = $query->orderBy('created_at', 'asc')->take($limit)->get();

            return response()->json([
                'success' => true,
                'messages' => $messages
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tải tin nhắn'
            ], 500);
        }
    }

    public function sendMessage(Request $request, $classId)
    {
        try {
            $user = Auth::user();

            $class = ClassModel::find($classId);
            if (!$class) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lớp học không tồn tại'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'message' => 'required|string|max:2000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $messageData = [
                'class_id' => $classId,
                'sender_id' => $user->id,
                'message' => $request->input('message'),
                'message_type' => 'text',
            ];

            $message = Message::create($messageData);
            $message->load('sender');

            return response()->json([
                'success' => true,
                'message' => $this->formatMessage($message)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi gửi tin nhắn'
            ], 500);
        }
    }

    public function updateMessage(Request $request, $messageId)
    {
        try {
            $user = Auth::user();
            $message = Message::find($messageId);

            if (!$message) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tin nhắn không tồn tại'
                ], 404);
            }

            if ($message->sender_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn chỉ có thể sửa tin nhắn của mình'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'message' => 'required|string|max:2000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $message->update([
                'message' => $request->input('message')
            ]);

            $message->load('sender');

            return response()->json([
                'success' => true,
                'message' => $this->formatMessage($message)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi sửa tin nhắn'
            ], 500);
        }
    }

    public function deleteMessage($messageId)
    {
        try {
            $user = Auth::user();
            $message = Message::find($messageId);

            if (!$message) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tin nhắn không tồn tại'
                ], 404);
            }

            if ($message->sender_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn chỉ có thể xoá tin nhắn của mình'
                ], 403);
            }

            $message->delete();

            return response()->json([
                'success' => true,
                'message' => 'Tin nhắn đã được xoá'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xoá tin nhắn'
            ], 500);
        }
    }

    private function formatMessage($message)
    {
        return [
            'id' => $message->id,
            'class_id' => $message->class_id,
            'message' => $message->message,
            'message_type' => $message->message_type,
            'sender' => [
                'id' => $message->sender->id,
                'name' => $message->sender->full_name,
                'role' => $message->sender->role
            ],
            'created_at' => $message->created_at->toIso8601String()
        ];
    }
}
