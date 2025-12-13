import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import CrudForm from '../../components/CrudForm';
import { apiDelete, apiGet, apiPost, apiPut } from '../../api/client';

function Faculty() {
    const [facultyList, setFacultyList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;
    const [isAddOpen, setAddOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);

    const columns = useMemo(
        () => [
            {
                key: 'name',
                header: 'Tên khoa viện',
                render: (row) => row.name ?? row.data?.name ?? '-',
            },
            {
                key: 'description',
                header: 'Mô tả',
                render: (row) => row.description ?? row.data?.description ?? '-',
            },
        ],
        []
    );

    const formFields = useMemo(
        () => [
            { name: 'name', label: 'Tên khoa viện', required: true },
            { name: 'description', label: 'Mô tả', required: true },
        ],
        []
    );

    useEffect(() => {
        void fetchFaculties();
    }, [currentPage]);

    // Lấy dữ liệu khoa viện
    async function fetchFaculties() {
        try {
            setLoading(true);
            const json = await apiGet('api/faculties', { page: currentPage, limit: itemsPerPage });
            if (json?.success === false) {
                toast.error(json?.message || 'Không thể lấy danh sách khoa viện');
                return;
            }
            const container = json?.data ?? {};
            const items = Array.isArray(container) ? container : container?.data ?? [];
            const lastPage = container?.last_page ?? 1;
            setFacultyList(items);
            setTotalPages(lastPage);
        } catch (err) {
            toast.error('Không thể lấy danh sách khoa viện');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Gọi api tạo khoa viện
    async function handleCreate(data) {
        try {
            const json = await apiPost('api/faculties', data);
            toast.success(json?.message || 'Tạo khoa viện thành công');

            const created = json?.data;
            if (created?.id) {
                setFacultyList((prev) => [created, ...prev]);
            } else {
                await fetchFaculties();
            }
            setAddOpen(false);
        } catch (err) {
            if (err.response?.data) {
                const data = err.response.data;
                if (data?.errors) {
                    Object.values(data.errors).forEach((errs) => toast.error(errs[0]));
                    return;
                }
                toast.error(data?.message || 'Lỗi khi tạo khoa viện');
                return;
            }
            toast.error('Lỗi khi tạo khoa viện');
            console.error(err);
        }
    }

    async function handleUpdate(data) {
        if (!editingRow?.id) return toast.error('Không có khoa viện đang sửa');
        try {
            const payload = { name: data.name, description: data.description };
            const json = await apiPut(`api/faculties/${editingRow.id}`, payload);
            toast.success(json?.message || 'Cập nhật khoa viện thành công');

            const updated = json?.data;
            if (updated?.id) {
                setFacultyList((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
            } else {
                await fetchFaculties();
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
                toast.error(data?.message || 'Lỗi khi cập nhật khoa viện');
                return;
            }
            toast.error('Lỗi khi cập nhật khoa viện');
            console.error(err);
        }
    }

    // Gọi api xóa khoa viện
    async function handleDelete(row) {
        const ok = window.confirm('Bạn có chắc muốn xóa khoa viện này?');
        if (!ok) return;
        try {
            const json = await apiDelete(`api/faculties/${row.id}`);
            if (json?.success === false) {
                toast.error(json?.message || 'Xóa thất bại');
                return;
            }
            toast.success(json?.message || 'Xóa khoa viện thành công');
            setFacultyList((prev) => prev.filter((item) => item.id !== row.id));
        } catch (err) {
            toast.error('Lỗi khi xóa khoa viện');
            console.error(err);
        }
    }

    return (
        <div className="p-6">
            

            <DataTable
                columns={columns}
                data={facultyList}
                loading={loading}
                emptyMessage="Chưa có khoa viện nào"
                rowIndexBase={(currentPage - 1) * itemsPerPage}
                onEdit={(row) => {
                    const normalized = {
                        ...row,
                    };
                    setEditingRow(normalized);
                    setEditOpen(true);
                }}
                onDelete={handleDelete}
                 headerActions={
                    <button
                        onClick={() => setAddOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Thêm khoa viện
                    </button>
                }
            />

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

            {isAddOpen && (
                <CrudForm
                    title="Thêm khoa viện"
                    fields={formFields}
                    onSubmit={handleCreate}
                    onCancel={() => setAddOpen(false)}
                    submitLabel="Lưu thay đổi"
                />
            )}

            {isEditOpen && editingRow && (
                <CrudForm
                    title="Sửa khoa viện"
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

export default Faculty;