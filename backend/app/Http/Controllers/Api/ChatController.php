<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Classes;
use App\Models\User;
use App\Events\NewMessageEvent;
use App\Events\MessageUpdatedEvent;
use App\Events\MessageDeletedEvent;
use App\Models\ClassModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ChatController extends Controller
{
    /**
     * Lấy danh sách tin nhắn
     */
    public function getMessages(Request $request, $classId)
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

            $perPage = $request->input('per_page', 50);

            $messages = Message::with(['sender'])
                ->where('class_id', $classId)
                ->orderBy('created_at', 'asc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'messages' => $messages->items(),
                'pagination' => [
                    'current_page' => $messages->currentPage(),
                    'last_page' => $messages->lastPage(),
                    'total' => $messages->total()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tải tin nhắn'
            ], 500);
        }
    }

    /**
     * Gửi tin nhắn mới
     */
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
                'message' => 'required_without:file|string|max:2000',
                'file' => 'nullable|file|max:10240',
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
                'message' => $request->input('message', ''),
                'message_type' => 'text',
            ];

            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('chat/files', $fileName, 'public');

                $messageData['message_type'] = 'file';
                $messageData['file_path'] = $path;
                $messageData['file_name'] = $file->getClientOriginalName();
                $messageData['file_size'] = $file->getSize();
                $messageData['file_mime'] = $file->getMimeType();

                if (empty($messageData['message'])) {
                    $messageData['message'] = 'Đã gửi một file';
                }
            }

            $message = Message::create($messageData);
            $message->load('sender');

            broadcast(new NewMessageEvent($message))->toOthers();

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

    /**
     * Sửa tin nhắn - CHỈ sửa tin nhắn của mình
     */
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

            // CHỈ sửa tin nhắn của mình
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

            broadcast(new NewMessageEvent($message))->toOthers();

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

    /**
     * Xoá tin nhắn - CHỈ xoá tin nhắn của mình
     */
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

            // CHỈ xoá tin nhắn của mình
            if ($message->sender_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn chỉ có thể xoá tin nhắn của mình'
                ], 403);
            }

            if ($message->file_path && Storage::disk('public')->exists($message->file_path)) {
                Storage::disk('public')->delete($message->file_path);
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

    /**
     * Format tin nhắn
     */
    private function formatMessage($message)
    {
        return [
            'id' => $message->id,
            'class_id' => $message->class_id,
            'message' => $message->message,
            'message_type' => $message->message_type,
            'file_info' => $message->file_path ? [
                'path' => $message->file_path,
                'name' => $message->file_name,
                'size' => $message->file_size,
                'mime' => $message->file_mime,
                'url' => asset('storage/' . $message->file_path)
            ] : null,
            'sender' => [
                'id' => $message->sender->id,
                'name' => $message->sender->full_name,
                'role' => $message->sender->role
            ],
            'created_at' => $message->created_at->toIso8601String(),
            'can_edit' => true, // Frontend sẽ kiểm tra sender_id
            'can_delete' => true
        ];
    }


    public function checkNewMessages(Request $request, $classId)
    {
        try {
            $user = Auth::user();

            $lastMessageId = $request->input('last_message_id', 0);

            $newMessages = Message::with(['sender'])
                ->where('class_id', $classId)
                ->where('id', '>', $lastMessageId)
                ->orderBy('created_at', 'asc')
                ->get();

            $lastMessage = Message::where('class_id', $classId)
                ->orderBy('id', 'desc')
                ->first();

            return response()->json([
                'success' => true,
                'new_messages' => $newMessages,
                'last_message_id' => $lastMessage ? $lastMessage->id : 0,
                'has_new' => $newMessages->count() > 0
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi: ' . $e->getMessage()
            ], 500);
        }
    }
}
