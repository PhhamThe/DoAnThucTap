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
    const columns = useMemo(
        () => [
            { key: "title", header: "Tên đề thi", render: (row) => row.title ?? "-" },
            {
                key: "time_limit",
                header: "Thời gian (phút)",
                render: (row) => row.time_limit ?? "-",
            },
            {
                key: "start_time",
                header: "Bắt đầu",
                render: (row) => row.start_time ?? "-",
            },
            {
                key: "end_time",
                header: "Kết thúc",
                render: (row) => row.end_time ?? "-",
            }
        ],
        []
    );

    async function fetchQuizzes() {
        try {
            setLoading(true);
            const json = await apiGet("api/get_quizzes_by_student", { page: currentPage, limit: itemsPerPage, class_id: classId });

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
    }, [currentPage]);

    const handlePageChange = (page) => setCurrentPage(page);
   

    return (
        <div className="p-6">
            <DataTable
                columns={columns}
                data={quizList}
                loading={loading}
                onView={(row) => navigate(`/quiz-detail/${row.id}`)}
                titleOnView="Bắt đầu thi"
                emptyMessage="Chưa có đề thi"
                rowIndexBase={(currentPage - 1) * itemsPerPage}
            />
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            <ToastContainer position="bottom-right" autoClose={5000} />
        </div>
    );
}

export default StudentQuizzes;
