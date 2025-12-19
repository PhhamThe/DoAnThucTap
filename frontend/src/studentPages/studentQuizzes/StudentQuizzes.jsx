import React, { useEffect, useMemo, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DataTable from "../../components/DataTable";
import Pagination from "../../components/Pagination";
import { apiGet } from "../../api/client";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function StudentQuizzes() {
    const [quizList, setQuizList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;
    const navigate = useNavigate();
    const { classId } = useParams();

    // Hàm format ISO string thành định dạng Việt Nam
    const formatDateTime = (isoString) => {
        if (!isoString) return "-";
        const date = new Date(isoString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Hàm tính trạng thái quiz
    const calculateQuizStatus = (quiz) => {
        if (!quiz.start_time) return "not_set";
        
        const now = new Date();
        const startTime = new Date(quiz.start_time);
        
        if (quiz.time_limit) {
            const endTime = new Date(startTime.getTime() + (quiz.time_limit * 60000));
            
            if (now < startTime) return "upcoming";
            if (now > endTime) return "ended";
            return "active";
        } else {
            if (now < startTime) return "upcoming";
            return "active";
        }
    };

    const columns = useMemo(
        () => [
            { 
                key: "title", 
                header: "Tên đề thi", 
                render: (row) => row.title ?? "-" 
            },
            {
                key: "time_limit",
                header: "Thời gian làm bài",
                render: (row) => `${row.time_limit ?? 0} phút`,
            },
            {
                key: "start_time",
                header: "Thời gian bắt đầu",
                render: (row) => formatDateTime(row.start_time),
            },
            {
                key: "status",
                header: "Trạng thái",
                render: (row) => {
                    const status = calculateQuizStatus(row);
                    
                    switch (status) {
                        case "upcoming":
                            return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-md">Chưa mở</span>;
                        case "ended":
                            return <span className="px-2 py-1 bg-red-100 text-yellow-800 text-xs rounded-md">Đã kết thúc</span>;
                        case "active":
                            return <span className="px-2 py-1 bg-green-100 text-yellow-800 text-xs rounded-md">Đang mở</span>;
                        default:
                            return <span className="text-gray-600">-</span>;
                    }
                },
            },
        ],
        []
    );

    async function fetchQuizzes() {
        try {
            setLoading(true);
            const json = await apiGet("api/get_quizzes_by_student", { 
                page: currentPage, 
                limit: itemsPerPage, 
                class_id: classId 
            });

            if (json?.success === false) {
                toast.error(json?.message || "Không thể lấy danh sách đề thi");
                return;
            }
            
            const container = json?.data ?? {};
            const items = container?.data ?? [];
            
            setQuizList(items);
            setTotalPages(container?.last_page ?? 1);
        } catch (err) {
            toast.error("Lỗi khi lấy danh sách đề thi");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchQuizzes();
    }, [currentPage, classId]);

    const handlePageChange = (page) => setCurrentPage(page);

   

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Danh sách đề thi</h1>
                <p className="text-gray-600">Các đề thi bạn có thể tham gia</p>
            </div>

            <DataTable
                columns={columns}
                data={quizList}
                loading={loading}
                onView={(row)=>navigate(`/quiz-detail/${row.id}`)}
                emptyMessage="Chưa có đề thi nào"
                rowIndexBase={(currentPage - 1) * itemsPerPage}
            />

            <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={handlePageChange} 
            />

            <ToastContainer 
                position="bottom-right" 
                autoClose={5000} 

            />
        </div>
    );
}

export default StudentQuizzes;