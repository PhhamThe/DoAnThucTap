<?php

namespace App\Http\Controllers;

use App\Models\ChapterProgress;
use App\Models\Lesson;
use App\Models\LessonProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChapterProgressController extends Controller
{
    public function updateChapterProgress($studentId, $lessonId)
    {
        $lesson = Lesson::find($lessonId);
        $chapterId = $lesson->chapter_id;

        $totalLessons = Lesson::where('chapter_id', $chapterId)->count();
        $completedLessons = LessonProgress::where('student_id', $studentId)
            ->whereIn('lesson_id', Lesson::where('chapter_id', $chapterId)->pluck('id'))
            ->where('is_completed', 1)
            ->count();

        $percent = round(($completedLessons / $totalLessons) * 100, 2);

        ChapterProgress::updateOrCreate(
            [
                'student_id' => $studentId,
                'chapter_id' => $chapterId
            ],
            [
                'progress' => $percent,
                'is_completed' => $percent == 100,
                'completed_at' => $percent == 100 ? now() : null
            ]
        );
    }
}
