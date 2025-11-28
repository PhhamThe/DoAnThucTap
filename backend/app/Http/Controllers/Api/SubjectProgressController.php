<?php

namespace App\Http\Controllers;

use App\Models\ChapterProgress;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\SubjectProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SubjectProgressController extends Controller
{
    public function updateSubjectProgress($studentId, $lessonId)
    {
        $lesson = Lesson::find($lessonId);
        $subjectId = $lesson->subject_id;

        $lessonIds = Lesson::where('subject_id', $subjectId)->pluck('id');

        $totalLessons = $lessonIds->count();
        $completedLessons = LessonProgress::where('student_id', $studentId)
            ->whereIn('lesson_id', $lessonIds)
            ->where('is_completed', 1)
            ->count();

        $percent = round(($completedLessons / $totalLessons) * 100, 2);

        SubjectProgress::updateOrCreate(
            [
                'student_id' => $studentId,
                'subject_id' => $subjectId
            ],
            [
                'progress' => $percent,
                'is_completed' => $percent == 100,
                'completed_at' => $percent == 100 ? now() : null
            ]
        );
    }
}
