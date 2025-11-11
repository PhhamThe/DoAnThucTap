import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import CrudForm from '../../components/CrudForm';
import { apiDelete, apiGet, apiPost, apiPut } from '../../api/client';

function Major() {
    const [majorList, setMajorList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;
    const [faculties, setFaculties] = useState([]);
    const [isAddOpen, setAddOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);


    //dùng useMemo để tối ưu hiệu năng, nếu không dùng vẫn có thể set các column bình thường nhưng nó sẽ phải tạo tại mới khi component rerender
    //dùng useMemo thì nó sẽ không tạo lại khi không thay đổi
    const facultiesMap = useMemo(() => {
        const map = {};
        for (const f of faculties) {
            map[f.id] = f.name;
            return map;
        }
    }, [faculties]);

    const columns = useMemo( // Đây là các cột bảng hiển thị danh sách
        () => [
            {
                key: 'name',
                header: 'Tên ngành',
                render: (row) => row.name ?? row.data?.name ?? '-',
            },
            {
                key: 'faculty_id',
                header: 'Khoa viện',
                render: (row) =>
                    row.faculty_name ??
                    row.data?.faculty?.name ??
                    row.faculty?.name ??
                    facultiesMap[row.faculty_id ?? row.data?.faculty?.id] ??
                    '-',
            },
            { key: 'description', header: 'Mô tả' },
        ],
        [facultiesMap]
    );

    const formFields = useMemo( // Đây là form sửa hoặc thêm
        () => [
            { name: 'name', label: 'Tên ngành', required: true },
            { name: 'faculty_id', label: 'Khoa - viện', type: 'select', options: faculties, required: true },
            { name: 'description', label: 'Mô tả', required: true },
        ],
        [faculties]
    );

    useEffect(() => {
        void fetchMajors();
    }, [currentPage]);

    useEffect(() => {
        void fetchFacultiesOptions();
    }, []);

    //Lấy dữ liệu ngành 
    async function fetchMajors() {
        try {
            setLoading(true);
            const json = await apiGet('api/majors', { page: currentPage, limit: itemsPerPage });
            if (json?.success === false) {
                toast.error(json?.message || 'Không thể lấy danh sách ngành');
                return;
            }
            const container = json?.data ?? {};
            const items = Array.isArray(container) ? container : container?.data ?? [];
            const lastPage = container?.last_page ?? 1;
            setMajorList(items);
            setTotalPages(lastPage);
        } catch (err) {
            toast.error('Không thể lấy danh sách ngành');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    //Lấy dữ liệu khoa viện để làm dropdown
    async function fetchFacultiesOptions() {
        try {
            const json = await apiGet('api/faculties', { page: 1, limit: 1000 });
            if (json?.success === false) return;
            const container = json?.data ?? {};
            const items = Array.isArray(container) ? container : container?.data ?? [];
            setFaculties(items);
        } catch (err) {
            console.error('Fetch faculties options error:', err);
        }
    }
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    //Gọi api tạo ngành
    async function handleCreate(data) {
        try {
            const json = await apiPost('api/majors', data);
            toast.success(json?.message || 'Tạo ngành thành công');

            const created = json?.data;
            if (created?.id) {
                setMajorList((prev) => [created, ...prev]);
            } else {
                await fetchMajors();
            }
            setAddOpen(false);
        } catch (err) {
            if (err.response?.data) {
                const data = err.response.data;
                if (data?.errors) {
                    Object.values(data.errors).forEach((errs) => toast.error(errs[0]));
                    return;
                }
                toast.error(data?.message || 'Lỗi khi tạo ngành');
                return;
            }
            toast.error('Lỗi khi tạo ngành');
            console.error(err);
        }
    }

    async function handleUpdate(data) {
        if (!editingRow?.id) return toast.error('Không có ngành đang sửa');
        try {
            const payload = { name: data.name, faculty_id: data.faculty_id, description: data.description };
            const json = await apiPut(`api/majors/${editingRow.id}`, payload);
            toast.success(json?.message || 'Cập nhật ngành thành công');

            const updated = json?.data;
            if (updated?.id) {
                setMajorList((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
            } else {
                await fetchMajors();
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
                toast.error(data?.message || 'Lỗi khi cập nhật ngành');
                return;
            }
            toast.error('Lỗi khi cập nhật ngành');
            console.error(err);
        }
    }

    //Gọi api xóa ngành
    async function handleDelete(row) {
        const ok = window.confirm('Bạn có chắc muốn xóa ngành này?');
        if (!ok) return;
        try {
            const json = await apiDelete(`api/majors/${row.id}`);
            if (json?.success === false) {
                toast.error(json?.message || 'Xóa thất bại');
                return;
            }
            toast.success(json?.message || 'Xóa ngành thành công');
            setMajorList((prev) => prev.filter((item) => item.id !== row.id));
        } catch (err) {
            toast.error('Lỗi khi xóa ngành');
            console.error(err);
        }
    }
    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold">Quản lý ngành học</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => setAddOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                        Thêm ngành
                    </button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={majorList}
                loading={loading}
                emptyMessage="Chưa có ngành nào"
                rowIndexBase={(currentPage - 1) * itemsPerPage}
                onEdit={(row) => {
                    const normalized = {
                        ...row,
                        faculty_id: row.faculty_id ?? row.data?.faculty?.id ?? row.faculty?.id ?? '',
                    };
                    setEditingRow(normalized);
                    setEditOpen(true);
                }}
                onDelete={handleDelete}
            />

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

            {isAddOpen && (
                <CrudForm
                    title="Thêm ngành"
                    fields={formFields}
                    onSubmit={handleCreate}
                    onCancel={() => setAddOpen(false)}
                    submitLabel="Lưu thay đổi"
                />
            )}

            {isEditOpen && editingRow && (
                <CrudForm
                    title="Sửa ngành"
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

export default Major