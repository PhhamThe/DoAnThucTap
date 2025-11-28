import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiDelete, apiGet, apiPost, apiPut } from '../../api/client';
import { toast, ToastContainer } from 'react-toastify';
import { buildFileUrlFromUpload, buildFormData, normalizeFileUpload } from '../../ulities/fileHelpers';
import {
    ArrowLeftOutlined,
    PlusOutlined,
    FileTextOutlined,
    PlayCircleOutlined,
    EditOutlined,
    DeleteOutlined,
    BookOutlined,
    FileOutlined,
    DownOutlined
} from '@ant-design/icons';
import CrudForm from '../../components/CrudForm';



function ChapterDetail() {
    const { classId, chapterId } = useParams();
    const [chapter, setChapter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setAddOpen] = useState(false);
    
    const formFields = useMemo(
        () => [
            { name: 'title', label: 'Tên bài', required: true },
            { name: 'description', label: 'Mô tả', type: 'textarea' },
            { name: 'video_url', label: 'Video', type: 'file' },
            { name: 'attachment', label: 'Tài liệu', type: 'file' },
        ],
        []
    );

    useEffect(() => {
        fetchChapterDetail();
    }, [chapterId]);

    const fetchChapterDetail = async () => {
        try {
            const json = await apiGet(`api/chapters/${chapterId}`);
            if (json?.success) {
                setChapter(json.data);
            } else {
                toast.error('Không thể tải chi tiết chương');
            }
        } catch (error) {
            toast.error('Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLesson = async (data) => {
        try {
            const formData = buildFormData(data);
            formData.append('chapter_id', chapterId);
            const json = await apiPost(`api/lessons`, formData)
            if (!json?.success) {
                toast.error(json.message || "Lỗi khi thêm bài học")
                return;
            }
            toast.success(json.message || "Thêm bài học thành công");
            await fetchChapterDetail();
            setAddOpen(false);
        } catch (err) {
            toast.error("Lỗi khi thêm bài học");
        }
    }

    const videoChapter = normalizeFileUpload(chapter?.video_url);
    const videoChapterUrl = buildFileUrlFromUpload(videoChapter);

    if (loading) return (
        <div className="p-6 flex justify-center items-center min-h-64">
            <div className="text-lg text-gray-600">Đang tải...</div>
        </div>
    );

    if (!chapter) return (
        <div className="p-6 flex flex-col items-center justify-center min-h-64">
            <div className="text-xl text-gray-700 mb-4">Không tìm thấy chương</div>
            <Link
                to={`/admin/chapters/${classId}`}
                className="text-blue-500 hover:text-blue-700 flex items-center"
            >
                <ArrowLeftOutlined className="mr-2" />
                Quay lại danh sách chương
            </Link>
        </div>
    );

    return (
        <div className="p-6 max-w-8xl mx-auto">
            <div className="mb-8">
                <Link
                    to={`/admin/chapters/${classId}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
                >
                    <ArrowLeftOutlined className="mr-2" />
                    Quay lại danh sách chương
                </Link>
                <h1 className="text-2xl font-light text-gray-800 mb-2">{chapter.title}</h1>
                {chapter.description && (
                    <p className="text-gray-600">{chapter.description}</p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                {videoChapterUrl && (
                    <div className="lg:col-span-2">
                        <h2 className="text-lg font-normal text-gray-700 mb-4">Video bài giảng</h2>
                        <div className=" overflow-hidden">
                            <video
                                controls
                                className="w-full h-full"
                                src={videoChapterUrl}
                            >
                                Trình duyệt của bạn không hỗ trợ video.
                            </video>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    <h2 className="text-lg font-normal text-gray-700">Tài liệu chương</h2>

                    {chapter.attachment ? (
                        <div className="border border-gray-100  p-4 bg-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <FileTextOutlined className="text-gray-400 text-lg mr-3" />
                                    <div>
                                        <p className="font-normal text-gray-800">Tài liệu đính kèm</p>
                                        <p className="text-sm text-gray-500">
                                            {chapter.attachment.name}
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href={chapter.attachment}
                                    download
                                    className="text-blue-500 hover:text-blue-700 transition-colors text-sm flex items-center"
                                >
                                    Tải về
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 border border-gray-100  bg-gray-50">
                            <FileTextOutlined className="text-gray-300 text-2xl mx-auto mb-2" />
                            <p className="text-gray-400">Chưa có tài liệu</p>
                        </div>
                    )}

                    {chapter.content && (
                        <div className="border border-gray-100  p-4 bg-white">
                            <h3 className="font-normal text-gray-700 mb-3">Nội dung chương</h3>
                            <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">{chapter.content}</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t border-gray-100 pt-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-light text-gray-800">Danh sách bài học</h2>
                    <button
                        onClick={() => setAddOpen(true)}
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300  hover:bg-gray-50 transition-colors"
                    >
                        + Thêm bài học
                    </button>
                </div>

                {chapter.lessons && chapter.lessons.length > 0 ? (
                    <div className="space-y-3">
                        {chapter.lessons.map((lesson, index) => (
                            <LessonCard
                                key={lesson.id}
                                lesson={lesson}
                                index={index}
                                chapterId = {lesson.chapter_id}
                                onUpdated={fetchChapterDetail}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 border border-gray-100  bg-gray-50">
                        <BookOutlined className="text-gray-300 text-3xl mx-auto mb-3" />
                        <p className="text-gray-400">Chưa có bài học nào trong chương này</p>
                    </div>
                )}
            </div>

            {isAddOpen && (
                <CrudForm
                    title="Thêm bài học"
                    fields={formFields}
                    onSubmit={handleCreateLesson}
                    onCancel={() => setAddOpen(false)}
                />
            )}
            <ToastContainer position="bottom-right" autoClose={5000} />
        </div>
    );
}

function LessonCard({ lesson, index, onUpdated , chapterId}) {
    const [expanded, setExpanded] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const videoObj = normalizeFileUpload(lesson.video_url);
    const attachObj = normalizeFileUpload(lesson.attachment);

    const video = {
        raw: videoObj,
        url: buildFileUrlFromUpload(videoObj),
        name: videoObj?.name || ""
    };

    const attach = {
        raw: attachObj,
        url: buildFileUrlFromUpload(attachObj),
        name: attachObj?.name || ""
    };


    const handleUpdateLesson = async (form) => {
        try {
            const data = { ...form };
            if (!(data.video_url instanceof File)) delete data.video_url;
            if (!(data.attachment instanceof File)) delete data.attachment;
            const formData = buildFormData(data);
            formData.append('chapter_id', chapterId)
            const json = await apiPut(`api/lessons/${lesson.id}`, formData);

            if (json.success) {
                toast.success("Cập nhật bài học thành công");
                setIsEditOpen(false);
                onUpdated();
            } else {
                toast.error(json.message || "Không thể cập nhật bài học");
            }
        } catch (error) {
            console.error("Error updating lesson:", error);
            toast.error("Lỗi khi cập nhật bài học");
        }
    };


    const handleDelete = async () => {
        if (!window.confirm("Bạn có chắc muốn xóa bài học này?")) return;

        try {
            const json = await apiDelete(`api/lessons/${lesson.id}`);
            if (json.success) {
                toast.success("Xóa bài học thành công");
                onUpdated();
            } else {
                toast.error(json.message || "Xóa thất bại");
            }
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi xóa bài học");
        }
    };

    const renderVideo = () => {
        if (!video.url) return null;

        return (
            <div>
                <h4 className="font-normal text-gray-700 mb-2">Video bài học</h4>
                <div className=" overflow-hidden">
                    <video controls className="w-full" src={video.url} />
                </div>
            </div>
        );
    };


    const renderAttachment = () => {
        if (!attach.url) {
            return (
                <div className="text-center py-4 border border-gray-100  bg-white">
                    <p className="text-gray-400 text-sm">Chưa có tài liệu</p>
                </div>
            );
        }

        return (
            <div className="border border-gray-100  p-3 bg-white">
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <FileTextOutlined className="text-gray-400 mr-2" />
                        <p className="text-sm font-normal text-gray-800">{attach.name}</p>
                    </div>

                    <a
                        href={attach.url}
                        download
                        className="text-blue-500 hover:text-blue-700 transition-colors text-sm flex items-center"
                    >
                        <FileOutlined className="mr-1" />
                        Tải về
                    </a>
                </div>
            </div>
        );
    };


    return (
        <div className="border border-gray-100  bg-white transition-all hover:border-gray-300">
            <div
                className="p-4 cursor-pointer flex justify-between items-center"
                onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm">
                        {index + 1}
                    </div>
                    <div>
                        <h3 className="font-normal text-gray-800">{lesson.title}</h3>

                        {lesson.description && (
                            <p className="text-gray-500 text-sm mt-1">{lesson.description}</p>
                        )}
                    </div>
                </div>

                <DownOutlined
                    className={`text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
            </div>

            {expanded && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-4">
                    {lesson.content && (
                        <div className="pt-4">
                            <h4 className="font-normal text-gray-700 mb-2">Nội dung bài học</h4>
                            <div className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">
                                {lesson.content}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderVideo()}
                        {renderAttachment()}
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                        <button
                            className="px-3 py-1 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditOpen(true);
                            }}
                        >
                            Sửa
                        </button>

                        <button
                            className="px-3 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors text-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete();
                            }}
                        >
                            Xóa
                        </button>
                    </div>
                </div>
            )}

            {isEditOpen && (
                <CrudForm
                    title="Cập nhật bài học"
                    fields={[
                        { name: "title", label: "Tên bài", required: true },
                        { name: "description", label: "Mô tả" },
                        { name: "content", label: "Nội dung", type: "textarea" },
                        { name: "video_url", label: "Video", type: "file" },
                        { name: "attachment", label: "Tài liệu", type: "file" }
                    ]}
                    initialValues={lesson}
                    onSubmit={handleUpdateLesson}
                    onCancel={() => setIsEditOpen(false)}
                />
            )}
        </div>
    );
}


export default ChapterDetail;