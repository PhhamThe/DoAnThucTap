import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiGet } from '../../api/client';
import {
    ArrowLeftOutlined,
    FileTextOutlined,
    TeamOutlined,
    BookOutlined,
    CodeOutlined,
    MessageOutlined,
    BarChartOutlined,
    RightOutlined
} from '@ant-design/icons';

function ClassDetail() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [classInfo, setClassInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        void fetchClassDetail();
    }, [classId]);

    async function fetchClassDetail() {
        try {
            setLoading(true);
            const json = await apiGet(`api/classes/${classId}`);

            if (json?.success === false) {
                toast.error(json?.message || 'Không thể lấy thông tin lớp học');
                return;
            }

            setClassInfo(json?.data ?? {});
        } catch (err) {
            toast.error('Không thể lấy thông tin lớp học');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="p-4 flex justify-center items-center h-64">
                <div className="text-gray-600">Đang tải thông tin lớp học...</div>
            </div>
        );
    }

    const menuItems = [
        {
            id: 'assignments',
            label: 'Bài thực hành',
            icon: <FileTextOutlined className="text-xl" />,
            description: 'Quản lý bài tập, đề kiểm tra và bài nộp của học sinh',
            path: `/assignment-list/${classId}/`
        },
        {
            id: 'students',
            label: 'Quản lý học sinh',
            icon: <TeamOutlined className="text-xl" />,
            description: 'Xem danh sách học sinh, điểm danh, theo dõi tiến độ',
            path: `/student_by_class/${classId}`
        },
        {
            id: 'materials',
            label: 'Tài liệu học tập',
            icon: <BookOutlined className="text-xl" />,
            description: 'Upload và quản lý tài liệu, giáo trình cho lớp học',
            path: `/class/${classId}/materials`
        },
        {
            id: 'practice',
            label: 'Bài tập & Bài kiểm tra',
            icon: <CodeOutlined className="text-xl" />,
            description: 'Tạo và quản lý các bài tập thực hành, dự án',
            path: `/class/${classId}/practice`
        },
        {
            id: 'discussion',
            label: 'Thảo luận',
            icon: <MessageOutlined className="text-xl" />,
            description: 'Q&A, diễn đàn thảo luận của lớp học',
            path: `/class/${classId}/discussion`
        },
        {
            id: 'grades',
            label: 'Bảng điểm',
            icon: <BarChartOutlined className="text-xl" />,
            description: 'Theo dõi và quản lý điểm số của học sinh',
            path: `/class/${classId}/grades`
        },
    ];

    return (
        <div className="p-4 w-full">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-4 flex items-center text-gray-600 hover:text-gray-800 text-base"
                >
                    <ArrowLeftOutlined className="mr-2" />
                    Quay lại danh sách lớp
                </button>

                <div className="mb-4">
                    <h1 className="text-2xl font-semibold text-gray-800">
                        {classInfo?.class_name + '-' + classInfo.subject_name || 'Tên lớp'}
                    </h1>
                    <div className="flex flex-wrap gap-4 mt-2">
                        <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded">
                            {classInfo?.subject?.name || 'Chưa có môn học'}
                        </span>
                        <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded">
                            {classInfo?.semester?.name || 'Chưa có kì học'}
                        </span>
                    </div>
                    {classInfo?.description && (
                        <p className="text-gray-500 mt-3 text-base">{classInfo.description}</p>
                    )}
                </div>
            </div>

            {/* Menu chức năng - Chiếm full width */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
                {menuItems.map(item => (
                    <div
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className="bg-white p-5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200 w-full"
                    >
                        <div className="flex items-start justify-between h-full">
                            <div className="flex items-start flex-1">
                                <div className="text-blue-600 mr-4 mt-1">
                                    {item.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800 text-lg mb-2">
                                        {item.label}
                                    </h3>
                                    <p className="text-gray-500 text-base leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                            <RightOutlined className="text-gray-400 ml-2 mt-1" />
                        </div>
                    </div>
                ))}
            </div>

            <ToastContainer position="bottom-right" autoClose={5000} />
        </div>
    );
}

export default ClassDetail;