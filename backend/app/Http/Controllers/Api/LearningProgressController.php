<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Prompts\Progress;

class LearningProgressController extends Controller
{
    public function getLessonProgress($lessonId)
    {
        $studentId = Auth::id();

        $lessonProgress = LessonProgress::with('lesson.chapter')
            ->where('student_id', $studentId)
            ->where('lesson_id', $lessonId)
            ->first();

        if (!$lessonProgress) {
            return response()->json([
                'success' => true,
                'lesson_progress' => 0,
                'chapter_progress' => 0,
                'subject_progress' => 0,
            ]);
        }

        $lesson = $lessonProgress->lesson;
        $chapter = $lesson->chapter;
        $subjectId = $chapter->class_id;

        $lessonProgressPercent = $lessonProgress->is_completed ? 100 : 0;

        $chapterLessons = $chapter->lessons()->pluck('id');
        $completedLessons = LessonProgress::where('student_id', $studentId)
            ->whereIn('lesson_id', $chapterLessons)
            ->where('is_completed', 1)
            ->count();
        $chapterProgressPercent = $chapterLessons->count()
            ? round($completedLessons / $chapterLessons->count() * 100, 2)
            : 0;

        // Subject progress
        $subjectChapters = Chapter::where('class_id', $chapter->class_id)->pluck('id'); // class_id đại diện subject
        $subjectLessons = Lesson::whereIn('chapter_id', $subjectChapters)->pluck('id');
        $completedSubjectLessons = LessonProgress::where('student_id', $studentId)
            ->whereIn('lesson_id', $subjectLessons)
            ->where('is_completed', 1)
            ->count();
        $subjectProgressPercent = $subjectLessons->count()
            ? round($completedSubjectLessons / $subjectLessons->count() * 100, 2)
            : 0;

        return response()->json([
            'success' => true,
            'lesson_progress' => $lessonProgressPercent,
            'chapter_progress' => $chapterProgressPercent,
            'subject_progress' => $subjectProgressPercent,
        ]);
    }


    public function updateLessonProgress(Request $request)
    {
        $request->validate([
            'lesson_id' => 'required|integer',
            'watched_seconds' => 'required|numeric',
            'duration' => 'required|numeric',
        ]);
        $isCompleted = LessonProgress::where('lesson_id', $request)->value('is_completed');
        if ($isCompleted === true) {
            return response()->json([
                'success' => true,
                'allow_next' => $isCompleted
            ]);
        } else {
            $userId = Auth::id();
            $studentId = Student::where('user_id', $userId)->value('id');
            $lessonId = $request->lesson_id;
            $watched = $request->watched_seconds;
            $duration = $request->duration;

            // Tính xem đã đủ 30% chưa
            $completed = $duration > 0 && ($watched / $duration >= 0.3);

            // Cập nhật hoặc tạo mới
            LessonProgress::updateOrCreate(
                [
                    'student_id' => $studentId,
                    'lesson_id' => $lessonId
                ],
                [
                    'watched_seconds' => $watched,
                    'is_completed' => $completed ? 1 : 0,
                    'completed_at' => $completed ? now() : null
                ]
            );

            return response()->json([
                'success' => true,
                'allow_next' => $completed
            ]);
        }
    }
    public function getChapterLessons($chapterId)
    {
        $studentId = Auth::id();

        // Lấy tất cả bài học theo thứ tự
        $lessons = Lesson::where('chapter_id', $chapterId)
            ->orderBy('order', 'asc')
            ->get();

        // Lấy tiến độ học của sinh viên
        $lessonProgress = LessonProgress::where('student_id', $studentId)
            ->whereIn('lesson_id', $lessons->pluck('id'))
            ->pluck('is_completed', 'lesson_id');

        $lockedLessons = [];
        $prevCompleted = true;

        foreach ($lessons as $lesson) {
            if (!$prevCompleted) {
                $lockedLessons[$lesson->id] = true; // khóa bài này
            } else {
                $lockedLessons[$lesson->id] = false; // mở bài này
                $prevCompleted = $lessonProgress[$lesson->id] ?? false; // cập nhật trạng thái bài trước
            }
        }

        return response()->json([
            'success' => true,
            'lessons' => $lessons,
            'locked' => $lockedLessons
        ]);
    }
}
