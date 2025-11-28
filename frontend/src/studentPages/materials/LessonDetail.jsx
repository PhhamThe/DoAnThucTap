import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet, apiPost } from "../../api/client";
import { toast, ToastContainer } from "react-toastify";
import { buildFileUrlFromUpload, normalizeFileUpload } from "../../ulities/fileHelpers";
import {
    ArrowLeftOutlined,
    FileTextOutlined,
    PlayCircleOutlined,
    DownOutlined,
    RightOutlined,
    AlertOutlined,

} from "@ant-design/icons";

function LessonDetail() {
    const { lessonId } = useParams();
    const [lesson, setLesson] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [expandedChapters, setExpandedChapters] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [classId, setClassId] = useState(null);

    const [duration, setDuration] = useState(0);
    const [watchedSeconds, setWatchedSeconds] = useState(0);


    useEffect(() => {
        loadLesson();
    }, [lessonId]);

    const loadLesson = async () => {
        try {
            setLoading(true);
            const res = await apiGet(`api/lessons/${lessonId}`);
            if (!res?.success) {
                toast.error("Không lấy được dữ liệu bài học");
                return;
            }

            setLesson(res.data);
            setClassId(res.data.class_id);

            if (res.data.chapter_id) {
                await loadChapters(res.data.class_id, res.data.chapter_id);
            }
        } catch (err) {
            toast.error("Lỗi khi tải bài học");
        } finally {
            setLoading(false);
        }
    };

    const loadChapters = async (classId, currentChapterId) => {
        try {
            const res = await apiGet(`api/get_all_chapters/${classId}`);
            if (res?.success) {
                setChapters(res.data || []);
                setExpandedChapters(new Set([parseInt(currentChapterId)]));
            }
        } catch (err) {
            console.log("Load chapters error:", err);
        }
    };

    const updateProgress = async (current) => {
        if (!lesson || !duration) return;
        try {
            const res = await apiPost("api/progress/update", {
                lesson_id: lessonId,
                watched_seconds: current,
                duration: duration,
            });

            if (res.success) {
                await loadChapters(classId, lesson.chapter_id);
            }

        } catch (err) {
            console.log("Update progress error:", err.response?.data || err);
        }
    };



    const handleTimeUpdate = (e) => {
        const current = e.target.currentTime;
        setWatchedSeconds(current);

        if (Math.floor(current) % 5 === 0) {
            updateProgress(current);
        }
    };

    const handleVideoEnded = () => {
        updateProgress(duration);
    };

    const toggleChapter = (chapterId) => {
        const newSet = new Set(expandedChapters);
        newSet.has(chapterId) ? newSet.delete(chapterId) : newSet.add(chapterId);
        setExpandedChapters(newSet);
    };

    if (loading)
        return (
            <div className="p-6 flex justify-center items-center min-h-64">
                <div className="text-lg text-gray-600">Đang tải...</div>
            </div>
        );

    if (!lesson)
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-64">
                <div className="text-xl text-gray-700 mb-4">Không tìm thấy bài học</div>
                <Link
                    to={`/chapters/${classId}`}
                    className="text-blue-500 hover:text-blue-700 flex items-center"
                >
                    <ArrowLeftOutlined className="mr-2" />
                    Quay lại
                </Link>
            </div>
        );

    const videoFile = normalizeFileUpload(lesson.video_url);
    const videoUrl = buildFileUrlFromUpload(videoFile);

    return (
        <div className="p-6 max-w-8xl mx-auto">
            {/* HEADER */}
            <div className="mb-8">
                <Link
                    to={`/chapters/${classId}`}
                    className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
                >
                    <ArrowLeftOutlined className="mr-2" />
                    Quay lại danh sách chương
                </Link>

                <h1 className="text-2xl font-medium text-gray-900 mb-2">{lesson.title}</h1>
                {lesson.description && <p className="text-gray-600">{lesson.description}</p>}

            </div>

            <div className="flex gap-8">
                {/* LEFT */}
                <div className="flex-1">
                    {videoUrl && (
                        <div className="mb-8">
                            <div className="bg-black rounded-lg overflow-hidden">
                                <video
                                    controls
                                    className="w-full"
                                    src={videoUrl}
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={(e) => setDuration(e.target.duration)}
                                    onEnded={handleVideoEnded}
                                />
                            </div>
                            {/* gợi ý */}
                            {
                                lesson.is_completed === 0 &&
                                (
                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-sm text-yellow-800 text-center">
                                            Lưu ý: Bạn phải xem ít nhất 30% video mới được mở khóa bài tiếp theo
                                        </p>
                                    </div>
                                )
                            }
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* CONTENT */}
                        {lesson.content && (
                            <div className="lg:col-span-2">
                                <h3 className="font-medium text-gray-900 mb-4">Nội dung bài học</h3>
                                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{lesson.content}</div>
                            </div>
                        )}

                        {/* ATTACHMENT */}
                        <div className="lg:col-span-1">
                            <h3 className="font-medium text-gray-900 mb-4">Tài liệu</h3>
                            {lesson.attachment ? (
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <FileTextOutlined className="text-gray-400 mr-3" />
                                            <p className="font-normal text-gray-900">{lesson.attachment.name}</p>
                                        </div>
                                        <a href={lesson.attachment} download className="text-blue-500 hover:text-blue-700 text-sm">
                                            Tải về
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 border border-gray-200 rounded-lg">
                                    <FileTextOutlined className="text-gray-300 text-2xl mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">Chưa có tài liệu</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="w-80 flex-shrink-0">
                    <div className="sticky top-6">
                        <h3 className="font-medium text-gray-900 mb-4">Nội dung khóa học</h3>
                        <div className="space-y-2">
                            {chapters.map((chapter) => (
                                <div key={chapter.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                    {/* Chapter Header */}
                                    <button
                                        onClick={() => toggleChapter(chapter.id)}
                                        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                                                {chapter.order}
                                            </div>
                                            <span className="font-medium text-gray-900 text-left">{chapter.title}</span>
                                        </div>
                                        {expandedChapters.has(chapter.id) ? (
                                            <DownOutlined className="text-gray-400 text-sm" />
                                        ) : (
                                            <RightOutlined className="text-gray-400 text-sm" />
                                        )}
                                    </button>

                                    {/* Lessons List */}
                                    {expandedChapters.has(chapter.id) && chapter.lessons && (
                                        <div className="bg-white border-t border-gray-200">
                                            {chapter.lessons.map((item, index) => (
                                                <Link
                                                    key={item.id}
                                                    to={item.locked ? "#" : `/lesson/${item.id}`}
                                                    onClick={(e) => {
                                                        if (item.locked) {
                                                            e.preventDefault();
                                                            toast.error("Bạn phải hoàn thành các bài trước đó!");
                                                        }
                                                    }}
                                                    className={`flex items-center gap-3 p-3 border-b hover:bg-gray-50 ${item.locked ? "opacity-50" : ""}`}

                                                >
                                                    <div
                                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${item.id === parseInt(lessonId) ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
                                                            }`}
                                                    >
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p
                                                            className={`text-sm ${item.id === parseInt(lessonId) ? "text-blue-700 font-medium" : "text-gray-700"
                                                                }`}
                                                        >
                                                            {item.title}
                                                        </p>
                                                    </div>
                                                    {item.video_url && <PlayCircleOutlined className="text-gray-400 text-sm" />}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer position="bottom-right" autoClose={4000} />
        </div>
    );
}
export default LessonDetail;