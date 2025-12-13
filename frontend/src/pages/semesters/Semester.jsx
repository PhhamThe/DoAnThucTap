import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import CrudForm from '../../components/CrudForm';
import { apiDelete, apiGet, apiPost, apiPut } from '../../api/client';

function Semester() {
    const [semesterList, setSemesterList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;

    const [isAddOpen, setAddOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);

    // Columns hiển thị bảng
    const columns = useMemo(
        () => [
            { key: 'name', header: 'Tên kỳ học', render: (row) => row.name ?? '-' },
            { key: 'year', header: 'Năm học', render: (row) => row.year ?? '-' },
            { key: 'start_date', header: 'Ngày bắt đầu', render: (row) => row.start_date ?? '-' },
            { key: 'end_date', header: 'Ngày kết thúc', render: (row) => row.end_date ?? '-' },
        ],
        []
    );

    // Form thêm / sửa
    const formFields = useMemo(
        () => [
            { name: 'name', label: 'Tên kỳ học', required: true },
            { name: 'year', label: 'Năm học', required: true },
            { name: 'start_date', label: 'Ngày bắt đầu', type: 'date', required: true },
            { name: 'end_date', label: 'Ngày kết thúc', type: 'date', required: true },
        ],
        []
    );

    useEffect(() => {
        void fetchSemesters();
    }, [currentPage]);

    // Lấy danh sách kỳ học
    async function fetchSemesters() {
        try {
            setLoading(true);
            const json = await apiGet('api/semesters', { page: currentPage, limit: itemsPerPage });

            if (json?.success === false) {
                toast.error(json?.message || 'Không thể lấy danh sách kỳ học');
                return;
            }

            const container = json?.data ?? {};
            const items = Array.isArray(container) ? container : container?.data ?? [];
            const lastPage = container?.last_page ?? 1;

            setSemesterList(items);
            setTotalPages(lastPage);
        } catch (err) {
            toast.error('Lỗi khi tải danh sách kỳ học');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handlePageChange = (page) => setCurrentPage(page);

    // Tạo kỳ học
    async function handleCreate(data) {
        try {
            const json = await apiPost('api/semesters', data);
            toast.success(json?.message || 'Tạo kỳ học thành công');
            const created = json?.data;

            if (created?.id) {
                setSemesterList((prev) => [created, ...prev]);
            } else {
                await fetchSemesters();
            }
            setAddOpen(false);
        } catch (err) {
            if (err.response?.data) {
                const data = err.response.data;
                if (data?.errors) {
                    Object.values(data.errors).forEach((errs) => toast.error(errs[0]));
                    return;
                }
                toast.error(data?.message || 'Lỗi khi tạo kỳ học');
                return;
            }
            toast.error('Lỗi khi tạo kỳ học');
            console.error(err);
        }
    }

    async function handleUpdate(data) {
        if (!editingRow?.id) return toast.error('Không có kỳ học đang sửa');
        try {
            const payload = {
                name: data.name,
                year: data.year,
                start_date: data.start_date,
                end_date: data.end_date,
            };

            const json = await apiPut(`api/semesters/${editingRow.id}`, payload);
            toast.success(json?.message || 'Cập nhật kỳ học thành công');

            const updated = json?.data;
            if (updated?.id) {
                setSemesterList((prev) =>
                    prev.map((row) => (row.id === updated.id ? updated : row))
                );
            } else {
                await fetchSemesters();
            }
            setEditOpen(false);
            setEditingRow(null);
        } catch (err) {
            if (err.response?.data) {
                const data = err.response.data;
                if (data?.errors) {
                    Object.values(data.errors).forEach((errs) => toast.error(errs[0]));
                    return;
                }
                toast.error(data?.message || 'Lỗi khi cập nhật kỳ học');
                return;
            }
            toast.error('Lỗi khi cập nhật kỳ học');
            console.error(err);
        }
    }

    // Xóa kỳ học
    async function handleDelete(row) {
        const ok = window.confirm('Bạn có chắc muốn xóa kỳ học này?');
        if (!ok) return;
        try {
            const json = await apiDelete(`api/semesters/${row.id}`);
            if (json?.success === false) {
                toast.error(json?.message || 'Xóa thất bại');
                return;
            }

            toast.success(json?.message || 'Xóa kỳ học thành công');
            setSemesterList((prev) => prev.filter((item) => item.id !== row.id));
        } catch (err) {
            toast.error('Lỗi khi xóa kỳ học');
            console.error(err);
        }
    }

    return (
        <div className="p-6">
           

            <DataTable
                columns={columns}
                data={semesterList}
                loading={loading}
                emptyMessage="Chưa có kỳ học nào"
                rowIndexBase={(currentPage - 1) * itemsPerPage}
                onEdit={(row) => {
                    setEditingRow(row);
                    setEditOpen(true);
                }}
                onDelete={handleDelete}
                 headerActions={
                    <button
                        onClick={() => setAddOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Thêm kỳ học
                    </button>
                }
            />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />

            {isAddOpen && (
                <CrudForm
                    title="Thêm kỳ học"
                    fields={formFields}
                    onSubmit={handleCreate}
                    onCancel={() => setAddOpen(false)}
                    submitLabel="Lưu thay đổi"
                />
            )}

            {isEditOpen && editingRow && (
                <CrudForm
                    title="Sửa kỳ học"
                    fields={formFields}
                    initialValues={editingRow}
                    onSubmit={handleUpdate}
                    onCancel={() => {
                        setEditOpen(false);
                        setEditingRow(null);
                    }}
                    submitLabel="Lưu thay đổi"
                />
            )}

            <ToastContainer position="bottom-right" autoClose={5000} />
        </div>
    );
}

export default Semester;
