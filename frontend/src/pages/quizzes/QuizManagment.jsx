import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiGet } from "../../api/client";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiArrowLeft, FiFileText, FiBarChart2, FiSettings, FiUsers, FiCalendar, FiClock, FiCheckCircle } from "react-icons/fi";
import { TbQuestionMark } from "react-icons/tb";

function QuizManagement() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalQuestions: 0,
        totalStudentsCompleted: 0,
        averageScore: 0,
        quizStatus: null,
        quizStatusText: null
    });

    useEffect(() => {
        fetchQuizDetails();
        fetchQuizStats();
    }, [quizId]);

    async function fetchQuizDetails() {
        try {
            setLoading(true);
            const json = await apiGet(`api/quizzes/${quizId}`);
            
            if (json?.success === false) {
                toast.error(json?.message || "Không thể lấy thông tin đề thi");
                navigate(-1);
                return;
            }
            
            setQuiz(json?.data || {});
        } catch (err) {
            toast.error("Lỗi khi lấy thông tin đề thi");
            console.error(err);
            navigate(-1);
        } finally {
            setLoading(false);
        }
    }

    async function fetchQuizStats() {
        try {
            // Giữ nguyên endpoint hiện tại
            const json = await apiGet(`api/quiz_stats/${quizId}`);
            
            if (json?.success === true) {
                const data = json.data;
                setStats({
                    totalQuestions: data.statistics?.total_questions || 0,
                    totalStudentsCompleted: data.statistics?.total_students_completed || 0,
                    averageScore: 0, // API chưa trả về
                    quizStatus: data.statistics?.quiz_status || null,
                    quizStatusText: data.statistics?.quiz_status_text || null,
                    timeInfo: data.statistics?.time_info || {}
                });
            }
        } catch (err) {
            console.error("Lỗi khi lấy thống kê", err);
            // Set giá trị mặc định nếu lỗi
            setStats({
                totalQuestions: 0,
                totalStudentsCompleted: 0,
                averageScore: 0,
                quizStatus: null,
                quizStatusText: null
            });
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <div className="text-gray-500">Đang tải thông tin đề thi...</div>
                </div>
            </div>
        );
    }

    // Hàm lấy status từ stats nếu có, nếu không thì tính toán từ quiz
    const getStatusBadge = () => {
        // Ưu tiên sử dụng status từ API stats
        if (stats.quizStatusText) {
            let color = "bg-gray-100 text-gray-700";
            let icon = <FiSettings className="mr-1" />;
            
            switch(stats.quizStatus) {
                case 'upcoming':
                    color = "bg-blue-50 text-blue-700 border border-blue-200";
                    icon = <FiCalendar className="mr-1" />;
                    break;
                case 'active':
                    color = "bg-green-50 text-green-700 border border-green-200";
                    icon = <FiClock className="mr-1" />;
                    break;
                case 'ended':
                    color = "bg-gray-50 text-gray-700 border border-gray-200";
                    icon = <FiCheckCircle className="mr-1" />;
                    break;
                default:
                    color = "bg-gray-100 text-gray-700";
                    icon = <FiSettings className="mr-1" />;
            }
            
            return {
                text: stats.quizStatusText,
                color: color,
                icon: icon
            };
        }

        // Nếu không có stats, tính toán từ quiz data
        if (!quiz?.start_time) {
            return {
                text: "Chưa thiết lập",
                color: "bg-gray-100 text-gray-700",
                icon: <FiSettings className="mr-1" />
            };
        }

        const now = new Date();
        const startTime = new Date(quiz.start_time);
        const endTime = new Date(startTime.getTime() + quiz.time_limit * 60000);

        if (now < startTime) {
            return {
                text: "Sắp diễn ra",
                color: "bg-blue-50 text-blue-700 border border-blue-200",
                icon: <FiCalendar className="mr-1" />
            };
        } else if (now > endTime) {
            return {
                text: "Đã kết thúc",
                color: "bg-gray-50 text-gray-700 border border-gray-200",
                icon : <FiCheckCircle className="mr-1" />
            };
        } else {
            return {
                text: "Đang diễn ra",
                color: "bg-green-50 text-green-700 border border-green-200",
                icon: <FiClock className="mr-1" />
            };
        }
    };

    const statusBadge = getStatusBadge();

    const actionCards = [
        {
            title: "Quản lý câu hỏi",
            description: "Thêm, sửa, xóa câu hỏi trong đề thi",
            icon: <TbQuestionMark className="text-xl text-blue-600" />,
            path: `/admin/create-quiz/${quizId}`,
            count: stats.totalQuestions || 0,
            color: "hover:border-blue-200 hover:bg-blue-50"
        },
        {
            title: "Kết quả bài thi",
            description: "Xem và quản lý kết quả của học sinh",
            icon: <FiBarChart2 className="text-xl text-green-600" />,
            path: `/admin/quiz_results/${quizId}`,
            count: stats.totalStudentsCompleted || 0,
            color: "hover:border-green-200 hover:bg-green-50"
        },
      
       
        {
            title: "Thống kê chi tiết",
            description: "Phân tích và báo cáo kết quả",
            icon: <FiUsers className="text-xl text-cyan-600" />,
            path: `/admin/quizzes/${quizId}/analytics`,
            count: stats.averageScore > 0 ? `${stats.averageScore}%` : "0%",
            color: "hover:border-cyan-200 hover:bg-cyan-50"
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                    <FiArrowLeft className="mr-2" />
                    Quay lại danh sách
                </button>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                            {quiz?.title || "Không có tiêu đề"}
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color}`}>
                                {statusBadge.icon}
                                {statusBadge.text}
                            </span>
                            <span className="text-sm text-gray-500">
                                ID: {quizId}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Thời gian làm bài</p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {quiz?.time_limit || 0} phút
                                </p>
                            </div>
                            <FiClock className="text-2xl text-gray-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Bắt đầu từ</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {quiz?.start_time ? new Date(quiz.start_time).toLocaleDateString('vi-VN') : "Chưa thiết lập"}
                                </p>
                                {quiz?.start_time && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        {new Date(quiz.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                )}
                            </div>
                            <FiCalendar className="text-2xl text-gray-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Tổng số câu hỏi</p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {stats.totalQuestions > 0 ? `${stats.totalQuestions} câu` : "Chưa có câu hỏi"}
                                </p>
                                {stats.totalQuestions === 0 && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Nhấn "Quản lý câu hỏi" để thêm
                                    </p>
                                )}
                            </div>
                            <TbQuestionMark className="text-2xl text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* Thông tin thêm từ stats nếu có học sinh đã làm bài */}
                {stats.totalStudentsCompleted > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Số học sinh đã làm bài</p>
                                    <p className="text-xl font-semibold text-gray-900">
                                        {stats.totalStudentsCompleted} học sinh
                                    </p>
                                </div>
                                <FiUsers className="text-2xl text-gray-400" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Grid */}
            <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Quản lý đề thi</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {actionCards.map((card, index) => (
                        <Link
                            key={index}
                            to={card.path}
                            className={`group bg-white rounded-xl border border-gray-200 p-5 transition-all duration-200 ${card.color} hover:shadow-md`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-white transition-colors">
                                    {card.icon}
                                </div>
                                {card.count !== undefined && card.count > 0 && (
                                    <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                        {typeof card.count === 'number' ? card.count : card.count}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                {card.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                {card.description}
                            </p>
                            <div className="text-sm text-blue-600 font-medium inline-flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                Truy cập
                                <FiArrowLeft className="ml-1 transform rotate-180" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

           

            <ToastContainer 
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
                theme="light"
            />
        </div>
    );
}

export default QuizManagement;