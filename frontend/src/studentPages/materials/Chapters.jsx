import React, { useEffect, useState } from 'react'
import { apiGet } from '../../api/client';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BookOutlined, FileTextOutlined, RightOutlined } from '@ant-design/icons';

function Chapters() {
    const { classId } = useParams()
    const [chapters, setChapters] = useState();
    const [loading, setLoading] = useState(false);

    async function fetchChapters() {
        try {
            setLoading(true);
            const json = await apiGet(`api/get_all_chapters/${classId}`)
            if (!json.success) {
                toast.error(json.message || "Không thể lấy danh sách chương");
                return;
            }
            setChapters(json.data || null);
        } catch (err) {
            toast.error("Đã có lỗi xảy ra");
            console.log(err);
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchChapters()
    }, [classId])

    if (loading) {
        return (
            <div className="p-6 text-center py-8">
                <p className="text-gray-500">Đang tải thông tin bài giảng...</p>
            </div>
        );
    }
    if (!chapters) {
        return (
            <div className="p-6 text-center py-8">
                <p className="text-gray-500">Không tìm thấy bài giảng.</p>
            </div>
        );
    }
    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                Nội dung khóa học
            </h1>

            {
                chapters && chapters.length > 0 ? (
                    <div className="space-y-6 max-w-8xl mx-auto">
                        {chapters.map((chapter) => (
                            <div
                                key={chapter.id}
                                className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
                            >
                                <Link
                                    to={`/chapter_details/${chapter.id}`}
                                    className="block mb-4 pb-3 border-b border-gray-100 hover:border-gray-200 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <BookOutlined className="text-blue-500 text-xl" />
                                            <h2 className="text-xl font-semibold text-gray-700 hover:text-blue-600 transition-colors">
                                                {chapter.title}
                                            </h2>
                                        </div>
                                        <RightOutlined className="text-gray-400 text-sm" />
                                    </div>
                                    {chapter.description && (
                                        <p className="text-gray-500 text-sm mt-2 ml-9">
                                            {chapter.description}
                                        </p>
                                    )}
                                </Link>

                                {/* Lessons List */}
                                <div className="space-y-3">
                                    {chapter.lessons && chapter.lessons.length > 0 ? (
                                        chapter.lessons.map((lesson, index) => (
                                            <Link
                                                key={lesson.id}
                                                to={lesson.locked ? "#" : `/lesson/${lesson.id}`}
                                                onClick={(e) => {
                                                    if (lesson.locked) {
                                                        e.preventDefault();
                                                        toast.error("Bạn phải hoàn thành các bài trước đó!");
                                                    }
                                                }}
                                                className={`flex justify-between items-center p-4 border border-gray-100 rounded-md 
                    bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 group
                    ${lesson.locked ? "opacity-50" : ""}`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <FileTextOutlined className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                    <h3 className="text-gray-800 font-medium group-hover:text-blue-700 transition-colors">
                                                        {lesson.title}
                                                    </h3>
                                                </div>
                                                <RightOutlined className="text-gray-300 group-hover:text-blue-500 transition-colors text-sm" />
                                            </Link>
                                        ))

                                    ) : (
                                        <div className="text-center py-4 text-gray-400">
                                            <p>Chưa có bài học nào</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
                        <p className="text-gray-500 text-lg">
                            Không có bài giảng nào được tải lên
                        </p>
                    </div>
                )
            }
        </div>
    )
}

export default Chapters