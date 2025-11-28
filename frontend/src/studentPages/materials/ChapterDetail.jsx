import React, { useState, useEffect} from 'react';
import { useParams, Link } from 'react-router-dom';
import {apiGet } from '../../api/client';
import { toast, ToastContainer } from 'react-toastify';
import { buildFileUrlFromUpload,  normalizeFileUpload } from '../../ulities/fileHelpers';
import {
    ArrowLeftOutlined,
    FileTextOutlined,
} from '@ant-design/icons';

function ChapterDetail() {
    const { classId, chapterId } = useParams();
    const [chapter, setChapter] = useState(null);
    const [loading, setLoading] = useState(true);
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
                    to={`/chapters/${classId}`}
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
                        <div className="rounded-lg overflow-hidden">
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
                        <div className="border border-gray-100 rounded-lg p-4 bg-white">
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
                        <div className="text-center py-6 border border-gray-100 rounded-lg bg-gray-50">
                            <FileTextOutlined className="text-gray-300 text-2xl mx-auto mb-2" />
                            <p className="text-gray-400">Chưa có tài liệu</p>
                        </div>
                    )}

                    {chapter.content && (
                        <div className="border border-gray-100 rounded-lg p-4 bg-white">
                            <h3 className="font-normal text-gray-700 mb-3">Nội dung chương</h3>
                            <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">{chapter.content}</div>
                        </div>
                    )}
                </div>
            </div>
            <ToastContainer position="bottom-right" autoClose={5000} />
        </div>
    );
}


export default ChapterDetail;