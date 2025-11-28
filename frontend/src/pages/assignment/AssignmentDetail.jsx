import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import { apiGet } from '../../api/client';
import { useNavigate, useParams } from "react-router-dom";

function AssignmentDetail() {
    const { assignmentId } = useParams();
    const [submissions, setSubmissions] = useState([]);          // 🔄 majorList → submissions
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;

    const navigate = useNavigate();

    const columns = useMemo(
        () => [
            {
                key: 'name',
                header: 'Họ và tên',
                render: (row) => row.name ?? '-',
            },
            {
                key: 'mssv',
                header: 'Mã số sinh viên',
                render: (row) => row?.mssv ?? '-',
            },
            {
                key: 'submitted_at',
                header: 'Thời điểm nộp',
                render: (row) => { return row.submitted ? new Date(row?.submitted_at).toLocaleString() : '-' }
            },
            {
                key: 'status',
                header: 'Trạng thái',
                render: (row) =>
                    row.submitted ? (
                        <div className='p-1 bg-green-600 text-white w-fit'>Đã nạp bài</div>
                    ) : (
                        <div className='p-1 bg-red-600 text-white w-fit'>Chưa nạp bài</div>
                    ),
            },
            {
                key: 'action',
                header: 'Hành động',
                render: (row) => (
                    <button
                        className='p-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600'
                        onClick={() => navigate(`/admin/submission_detail/${row.submission_id}/${row.id}`)}
                    >
                        Xem bài nộp
                    </button>
                ),
            },
        ],
        [navigate]
    );

    useEffect(() => {
        void fetchSubmissions();
    }, [currentPage]);

    async function fetchSubmissions() {
        try {
            setLoading(true);
            const json = await apiGet(`api/get_all_submission/${assignmentId}`, {
                page: currentPage,
                limit: itemsPerPage,
            });

            if (json?.success === false) {
                toast.error(json?.message || 'Không thể lấy danh sách bài nộp');
                return;
            }

            const container = json?.data ?? {};
            const items = Array.isArray(container)
                ? container
                : container?.data ?? [];
            const lastPage = container?.last_page ?? 1;

            setSubmissions(items);
            setTotalPages(lastPage);
        } catch (err) {
            toast.error('Không thể lấy danh sách bài nộp');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold">Danh sách nộp bài</h2>
            </div>

            <DataTable
                columns={columns}
                data={submissions}
                loading={loading}
                emptyMessage="Chưa có sinh viên nào nộp bài"
                rowIndexBase={(currentPage - 1) * itemsPerPage}
            />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />

            <ToastContainer position="bottom-right" autoClose={5000} />
        </div>
    );
}

export default AssignmentDetail;
