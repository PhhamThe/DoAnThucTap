<?php

namespace App\Http\Controllers\Api;

use App\Models\Chapter;
use App\Models\ClassModel;
use App\Models\ClassStudent;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ChaptersController
{

    public function index(Request $request)
    {
        $classId = $request->get('class_id');
        $userId = Auth::id();
        $teacherId = Teacher::where('user_id', $userId)->value('id');

        $chapters = Chapter::where('class_id', $classId)
            ->with('lessons')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách chương thành công',
            'data' => $chapters
        ]);
    }
    public function getChapterOfStudents($classId)
    {
        try {
            $userId = Auth::id();
            $studentId = Student::where('user_id', $userId)->value('id');
            $isInClass = ClassStudent::where('student_id', $studentId)
                ->where('class_id', $classId)
                ->exists();

            if (!$isInClass) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn không có quyền truy cập lớp này'
                ], 403);
            }

            $chapters = Chapter::with(['lessons' => function ($query) use ($studentId) {
                $query->leftJoin('lesson_progress', function ($join) use ($studentId) {
                    $join->on('lessons.id', '=', 'lesson_progress.lesson_id')
                        ->where('lesson_progress.student_id', '=', $studentId);
                })
                    ->select('lessons.*', 'lesson_progress.is_completed')
                    ->orderBy('lessons.position');
            }])
                ->where('class_id', $classId)
                ->orderBy('position')
                ->get();

            $previousChapterCompleted = true;

            foreach ($chapters as $chapter) {

                if (!$previousChapterCompleted) {
                    foreach ($chapter->lessons as $lesson) {
                        $lesson->locked = true;
                    }
                    continue;
                }

                $allLessonsCompleted = true;
                $prevLessonCompleted = true;

                foreach ($chapter->lessons as $lesson) {
                    if (!$prevLessonCompleted) {
                        $lesson->locked = true;
                        $allLessonsCompleted = false;
                    } else {
                        $lesson->locked = false;
                    }

                    $prevLessonCompleted = $lesson->is_completed ?? false;

                    if (!$lesson->is_completed) {
                        $allLessonsCompleted = false;
                    }
                }

                $previousChapterCompleted = $allLessonsCompleted;
            }

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách chương học thành công',
                'data' => $chapters
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy danh sách',
                'error' => $e->getMessage()
            ], 500);
        }
    }




    public function store(Request $request)
    {
        try {

            $validated = $request->validate([
                'class_id' => 'required|integer|exists:classes,id',
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

            $chapter = Chapter::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Tạo chương thành công'
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
        $chapter = Chapter::find($id);
        if (!$chapter) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy chương'
            ], 404);
        }

        try {

            $validated = $request->validate([
                'class_id' => 'required|integer|exists:classes,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string|max:1000',
                'content' => 'nullable|string|max:1000',
                'video_url' => 'sometimes|file|max:102400',
                'attachment' => 'sometimes|file|max:102400',
                'position' => 'integer',

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
            $chapter->is_public = $request->is_public === true ? 0 : 1;
            $chapter->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật chương thành công'
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
            $chapter = Chapter::with(['lessons' => function ($query) {
                $query->orderBy('created_at', 'asc');
            }])->find($id);

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy chương'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Lấy thông tin chương thành công',
                'data' => $chapter
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
    public function getClassByTeacher()
    {
        $userId = Auth::id();
        $teacherId = Teacher::where('user_id', $userId)->value('id');
        $class = ClassModel::with('subject', 'semester')->where('teacher_id', $teacherId)->get();
        return response()->json([

            'success' => true,
            'message' => 'Lấy danh sách lớp học theo teacher thành công',
            'data' => $class
        ]);
    }

    public function getAllTeachersChapters($classId)
    {
        $subject = Subject::join('classes', 'classes.subject_id', '=', 'subjects.id')
            ->where('classes.id', $classId)
            ->select('subjects.id')
            ->first();

        if (!$subject) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy môn học cho lớp này'
            ], 404);
        }

        $subject_id = $subject->id;

        $userId = Auth::id();
        $currentTeacherId = Teacher::where('user_id', $userId)->value('id');

        // Lấy tên lớp hiện tại
        $currentClass = ClassModel::find($classId);

        $chapter_list = Chapter::join('classes', 'classes.id', '=', 'chapters.class_id')
            ->join('teachers', 'teachers.id', '=', 'classes.teacher_id')
            ->join('subjects', 'subjects.id', '=', 'classes.subject_id')
            ->where('classes.subject_id', $subject_id)
            ->where('chapters.is_public', 1)
            ->select(
                'teachers.id as teacher_id',
                'teachers.name as teacher_name',
                'chapters.id',
                'chapters.title',
                'chapters.description',
                'chapters.content',
                'chapters.position',
                'chapters.created_at',
                'chapters.updated_at',
                'chapters.is_public',
                'classes.id as class_id',
                'classes.name as class_name',
                'subjects.name as subject_name'
            )
            ->orderBy('teachers.name')
            ->orderBy('chapters.position')
            ->get();

        // Nhóm theo giáo viên
        $groupedData = $chapter_list->groupBy('teacher_id')->map(function ($chapters, $teacherId) use ($currentTeacherId) {
            $firstChapter = $chapters->first();
            return [
                'teacher_id' => $teacherId,
                'teacher_name' => $firstChapter->teacher_name,
                'teacher_email' => $firstChapter->teacher_email,
                'is_current_teacher' => ($teacherId == $currentTeacherId),
                'chapters' => $chapters->map(function ($chapter) {
                    return [
                        'id' => $chapter->id,
                        'title' => $chapter->title,
                        'description' => $chapter->description,
                        'content' => $chapter->content,
                        'position' => $chapter->position,
                        'created_at' => $chapter->created_at,
                        'updated_at' => $chapter->updated_at,
                        'class_id' => $chapter->class_id,
                        'class_name' => $chapter->class_name,
                        'subject_name' => $chapter->subject_name
                    ];
                })->toArray()
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'current_teacher_id' => $currentTeacherId,
                'current_class_name' => $currentClass->name ?? 'Không rõ lớp',
                'subject_name' => $subject->name ?? 'Không rõ môn học',
                'teachers' => $groupedData
            ]
        ]);
    }
}
