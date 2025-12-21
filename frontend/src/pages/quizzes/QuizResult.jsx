import React, { useEffect, useMemo, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DataTable from "../../components/DataTable";
import Pagination from "../../components/Pagination";
import { apiGet } from "../../api/client";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function QuizResult() {
    const [studentResults, setStudentResults] = useState([]);
    const [quizInfo, setQuizInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;
    const navigate = useNavigate();
    const { quizId } = useParams();

    const columns = useMemo(
        () => [
            {
                key: "student_code",
                header: "Mã SV",
                render: (row) => row.student_code ?? "-"
            },
            {
                key: "student_name",
                header: "Họ tên",
                render: (row) => row.student_name ?? "-"
            },
            {
                key: "status",
                header: "Trạng thái",
                render: (row) => {
                    if (row.has_attempted) {
                        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">Đã làm bài</span>;
                    } else {
                        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-md">Chưa làm bài</span>;
                    }
                },
            },
            {
                key: "score",
                header: "Điểm",
                render: (row) => {
                    if (row.has_attempted && row.quiz_result) {
                        return <span className="font-semibold">{row.quiz_result.score}/10</span>;
                    } else {
                        return <span className="text-gray-400">-</span>;
                    }
                },
            },
            {
                key: "completed_at",
                header: "Thời gian nộp",
                render: (row) => {
                    if (row.has_attempted && row.quiz_result?.completed_at) {
                        const date = new Date(row.quiz_result.completed_at);
                        return date.toLocaleString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    }
                    return "-";
                },
            },
            {
                key: "actions",
                header: "Thao tác",
                render: (row) => {
                    if (row.has_attempted) {
                        return (
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => navigate(`/admin/quiz-results/detail/${quizId}/${row.student_id}`)}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                                >
                                    Xem chi tiết
                                </button>
                            </div>
                        );
                    }
                    return "-";
                },
            }
        ],
        [quizId, navigate]
    );

    async function fetchQuizResults() {
        try {
            setLoading(true);
            const json = await apiGet(`api/quiz_results/${quizId}`, {
                page: currentPage,
                limit: itemsPerPage,
            });

            if (json?.success === false) {
                toast.error(json?.message || "Không thể lấy kết quả bài thi");
                return;
            }

            // Cấu trúc response từ API
            setStudentResults(json?.data || []);
            setQuizInfo(json?.quiz_info || {});

            // Tính toán tổng số trang dựa trên tổng số sinh viên
            const totalStudents = json?.total_students || 0;
            setTotalPages(Math.ceil(totalStudents / itemsPerPage));

        } catch (err) {
            toast.error("Lỗi khi lấy kết quả bài thi");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (quizId) {
            fetchQuizResults();
        }
    }, [currentPage, quizId]);

    const handlePageChange = (page) => setCurrentPage(page);

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Kết quả bài thi</h1>
                {quizInfo && (
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <div className="flex flex-wrap gap-4">
                            <div>
                                <span className="text-sm text-gray-600">Đề thi:</span>
                                <p className="font-semibold">{quizInfo.title}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Lớp:</span>
                                <p className="font-semibold">{quizInfo.class_name}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Tổng sinh viên:</span>
                                <p className="font-semibold">{quizInfo.total_students || studentResults.length}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Đã làm bài:</span>
                                <p className="font-semibold text-green-600">
                                    {quizInfo.total_completed || studentResults.filter(s => s.has_attempted).length}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Chưa làm:</span>
                                <p className="font-semibold text-yellow-600">
                                    {quizInfo.total_not_attempted || studentResults.filter(s => !s.has_attempted).length}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>


            <DataTable
                columns={columns}
                data={studentResults}
                loading={loading}
                emptyMessage="Chưa có sinh viên nào trong lớp này"
                rowIndexBase={(currentPage - 1) * itemsPerPage}
                // Không cần các action như thêm/sửa/xóa vì đây là kết quả
                hideActions={true}
            />

            {studentResults.length > itemsPerPage && (
                <div className="px-4 py-3 border-t">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}


           

            <ToastContainer
                position="bottom-right"
                autoClose={5000}
                theme="colored"
            />
        </div>
    );
}

export default QuizResult;