<?php

namespace App\Http\Controllers\Api;

use App\Models\Chapter;
use App\Models\ClassModel;
use App\Models\ClassStudent;
use App\Models\Lesson;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class LessonsController
{



    public function store(Request $request)
    {
        try {

            $validated = $request->validate([
                'chapter_id' => 'required|integer|exists:chapters,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string|max:1000',
                'content' => 'nullable|string|max:1000',
                'video_url' => 'nullable|file|max:102400',
                'attachment' => 'nullable|file|max:200000',
                'position' => 'integer'
            ]);

            $attachment = null;
            $video_url = null;

            if ($request->hasFile('attachment')) {
                $filePath = $request->file('attachment')->store('materials', 'public');
                $attachment = [
                    'path' => $filePath,
                    'name' => $request->file('attachment')->getClientOriginalName(),
                    'size' => $request->file('attachment')->getSize(),
                    'mime_type' => $request->file('attachment')->getMimeType(),
                ];
            }

            if ($request->hasFile('video_url')) {
                $filePath = $request->file('video_url')->store('materials', 'public');
                $video_url = [
                    'path' => $filePath,
                    'name' => $request->file('video_url')->getClientOriginalName(),
                    'size' => $request->file('video_url')->getSize(),
                    'mime_type' => $request->file('video_url')->getMimeType(),
                ];
            }

            $validated['video_url'] = $video_url;
            $validated['attachment'] = $attachment;

            Lesson::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Tạo bài học thành công'
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


    public function update(Request $request, $id)
    {
        $chapter = Lesson::find($id);
        if (!$chapter) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy chương'
            ], 404);
        }

        try {

            $validated = $request->validate([
                'chapter_id' => 'required|integer|exists:chapters,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string|max:1000',
                'content' => 'nullable|string|max:1000',
                'video_url' => 'file|max:102400',
                'attachment' => 'nullable|file|max:200000',
                'position' => 'integer'
            ]);

            $attachment = $chapter->attachment;
            $video_url = $chapter->video_url;

            if ($request->hasFile('attachment')) {
                $filePath = $request->file('attachment')->store('materials', 'public');
                $attachment = [
                    'path' => $filePath,
                    'name' => $request->file('attachment')->getClientOriginalName(),
                    'size' => $request->file('attachment')->getSize(),
                    'mime_type' => $request->file('attachment')->getMimeType(),
                ];
            }

            if ($request->hasFile('video_url')) {
                $filePath = $request->file('video_url')->store('materials', 'public');
                $video_url = [
                    'path' => $filePath,
                    'name' => $request->file('video_url')->getClientOriginalName(),
                    'size' => $request->file('video_url')->getSize(),
                    'mime_type' => $request->file('video_url')->getMimeType(),
                ];
            }

            $validated['attachment'] = $attachment;
            $validated['video_url'] = $video_url;

            $chapter->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật bài học thành công'
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


    public function destroy($id)
    {
        $chapter = Chapter::find($id);
        if (!$chapter) {
            return response()->json([

                'success' => false,
                'messgae' => 'không tồn tại chương'
            ]);
        }
        $chapter->delete();
        return response()->json([

            'success' => true,
            'statusCode' => 200,
            'messgae' => 'Xóa chương thành công'
        ]);
    }

    public function show($id)
    {
        try {
            $lesson = Lesson::join('chapters', 'chapters.id', '=', 'lessons.chapter_id')
                ->join('classes', 'classes.id', '=', 'chapters.class_id')
                ->leftJoin('lesson_progress', 'lesson_progress.lesson_id', '=', 'lessons.id')
                ->where('lessons.id', $id)->select(['lessons.*', 'classes.id as class_id', 'is_completed'])
                ->first();


            if (!$lesson) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy bài giảng'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Lấy thông tin bài giảng thành công',
                'data' => $lesson
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi server: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getClassByStudent()
    {
        $userId = Auth::id();
        $studentId = Student::where('user_id', $userId)->value('id');
        $class = ClassModel::join('class_students', 'class_students.class_id', '=', 'classes.id')
            ->join('subjects', 'subjects.id', '=', 'classes.subject_id')
            ->join('students', 'students.id', '=', 'class_students.student_id')->where('students.id', $studentId)->select([
                'classes.*',
                'subjects.id as subject_id',
                'subjects.name as subject_name'
            ])
            ->get();
        return response()->json([

            'success' => true,
            'message' => 'Lấy danh sách lớp học theo teacher thành công',
            'data' => $class
        ]);
    }
}
