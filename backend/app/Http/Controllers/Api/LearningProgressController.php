<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\ChapterProgress;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Student;
use App\Models\SubjectProgress;
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

        $chapterId = $lessonProgress->lesson->chapter_id;
        $subjectId = $lessonProgress->lesson->chapter->class_id;

        $chapterProgress = ChapterProgress::where('student_id', $studentId)
            ->where('chapter_id', $chapterId)
            ->value('progress') ?? 0;

        $subjectProgress = SubjectProgress::where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->value('progress') ?? 0;

        return response()->json([
            'success' => true,
            'lesson_progress' => $lessonProgress->is_completed ? 100 : 0,
            'chapter_progress' => $chapterProgress,
            'subject_progress' => $subjectProgress,
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

            $chapterId = Lesson::where('id', $lessonId)->value('chapter_id');

            // Lấy toàn bộ bài học trong chương
            $chapterLessons = Lesson::where('chapter_id', $chapterId)->pluck('id');
            $totalChapterLessons = $chapterLessons->count();

            // Lấy số bài đã hoàn thành
            $completedChapterLessons = LessonProgress::where('student_id', $studentId)
                ->whereIn('lesson_id', $chapterLessons)
                ->where('is_completed', 1)
                ->count();

            // Tính %
            $chapterProgress = $totalChapterLessons > 0
                ? round(($completedChapterLessons / $totalChapterLessons) * 100, 2)
                : 0;


            ChapterProgress::updateOrCreate(
                [
                    'student_id' => $studentId,
                    'chapter_id' => $chapterId,
                ],
                [
                    'progress' => $chapterProgress,
                    'is_completed' => $chapterProgress == 100 ? 1 : 0,
                    'completed_at' => $chapterProgress == 100 ? now() : null
                ]
            );

            $subjectId = Chapter::where('id', $chapterId)->value('class_id'); // class_id = subject

            $subjectChapters = Chapter::where('class_id', $subjectId)->pluck('id');
            $subjectLessons = Lesson::whereIn('chapter_id', $subjectChapters)->pluck('id');
            $totalSubjectLessons = $subjectLessons->count();

            $completedSubjectLessons = LessonProgress::where('student_id', $studentId)
                ->whereIn('lesson_id', $subjectLessons)
                ->where('is_completed', 1)
                ->count();

            $subjectProgress = $totalSubjectLessons > 0
                ? round(($completedSubjectLessons / $totalSubjectLessons) * 100, 2)
                : 0;

            SubjectProgress::updateOrCreate(
                [
                    'student_id' => $studentId,
                    'subject_id' => $subjectId,
                ],
                [
                    'progress' => $subjectProgress,
                    'is_completed' => $subjectProgress == 100 ? 1 : 0,
                    'completed_at' => $subjectProgress == 100 ? now() : null
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
