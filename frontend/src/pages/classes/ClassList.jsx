import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import { apiGet} from '../../api/client';
import { useNavigate } from "react-router-dom";

function ClassList() {
    const [majorList, setMajorList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;

    const navigate = useNavigate();

    const columns = useMemo( // Đây là các cột bảng hiển thị danh sách
        () => [
            {
                key: 'name',
                header: 'Tên lớp',
                render: (row) => row.name ?? row.data?.name ?? '-',
            },
            {
                key: 'subject_id',
                header: 'Học phần',
                render: (row) =>
                    row.subject?.name ??
                    '-',
            },
            {
                key: 'semester_id',
                header: 'Kì học',
                render: (row) =>
                    row.semester?.name ??
                    '-',
            },
            {
                key: 'description',
                header: 'Mô tả',
                render: (row) => row.description ?? '-'
            },
            {
                key: 'action',
                header: 'Hành động',
                render: (row) => (<button className='p-2 bg-blue-400 text-white rounded-lg cursor-pointer'
                    
                    onClick={() =>
                        navigate(`/class_detail/${row.id}`)}
                >Quản lý lớp
                </button>
                ),
            },
        ],
        [navigate]
    );



    useEffect(() => {
        void fetchDatas();
    }, [currentPage]);


    //Lấy dữ liệu 
    async function fetchDatas() {
        try {
            setLoading(true);
            const json = await apiGet('api/class_list', { page: currentPage, limit: itemsPerPage });
            if (json?.success === false) {
                toast.error(json?.message || 'Không thể lấy danh sách class');
                return;
            }
            const container = json?.data ?? {};
            const items = Array.isArray(container) ? container : container?.data ?? [];
            const lastPage = container?.last_page ?? 1;
            setMajorList(items);
            setTotalPages(lastPage);
        } catch (err) {
            toast.error('Không thể lấy danh sách class');
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
                <h2 className="text-xl font-semibold">Danh sách lớp dạy</h2>

            </div>

            <DataTable
                columns={columns}
                data={majorList}
                loading={loading}
                emptyMessage="Chưa có lớp nào"
                rowIndexBase={(currentPage - 1) * itemsPerPage}

            />

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

            <ToastContainer position="bottom-right" autoClose={5000} />
        </div>
    );
}

export default ClassList