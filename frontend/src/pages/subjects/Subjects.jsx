import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import CrudForm from '../../components/CrudForm';
import { apiGet, apiPost, apiPut, apiDelete } from '../../api/client';

function Subject() {
    const [subjectList, setSubjectList] = useState([]);
    const [majorList, setMajorList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;

    const [isAddOpen, setAddOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);

    // Các cột bảng
    const columns = useMemo(
        () => [
            {
                key: 'name',
                header: 'Tên môn học',
                render: (row) => (row.name ?? '-'),
            },
            {
                key: 'code',
                header: 'Mã môn',
                render: (row) => row.code ?? '-',
            },
            {
                key: 'credit',
                header: 'Số tín chỉ',
                render: (row) => row.credit ?? row.credits ?? '-',
            },
            {
                key: 'majors',
                header: 'Ngành',
                render: (row) => row.majors?.map(m => m.name).join(', ') || '-',
            }

        ],
        []
    );


    // Form fields
    const formFields = useMemo(
        () => [
            { name: 'name', label: 'Tên môn học', required: true },
            {
                name: 'major_ids',
                label: 'Chọn ngành',
                required: true,
                type: 'multiselect',
                options: majorList
            },

            { name: 'code', label: 'Mã môn học', required: true },
            { name: 'credit', label: 'Số tín chỉ', required: true },
            { name: 'description', label: 'Mô tả', required: false },
        ],
        [majorList]
    );

    async function fetchMajors() {
        try {
            setLoading(true);
            const json = await apiGet('api/majors', { page: currentPage, limit: itemsPerPage });
            if (json.success === false) {
                toast.error(json.message);
                return;
            }
            const container = json.data ?? {};
            const items = Array.isArray(container) ? container : container.data ?? [];
            setMajorList(items);
        } catch {
            toast.error("Lỗi khi lấy danh sách ngành");
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void fetchSubjects();
    }, [currentPage]);

    useEffect(() => {
        fetchMajors()
    }, [])

    // Lấy danh sách môn học
    async function fetchSubjects() {
        try {
            setLoading(true);
            const json = await apiGet('api/subjects', { page: currentPage, limit: itemsPerPage });
            if (json?.success === false) {
                toast.error(json?.message || 'Không thể lấy danh sách môn học');
                return;
            }
            const container = json?.data ?? {};
            const items = container?.data ?? [];
            setSubjectList(items);
            setTotalPages(container?.last_page ?? 1);
        } catch (err) {
            toast.error('Lỗi khi lấy danh sách môn học');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handlePageChange = (page) => setCurrentPage(page);

    // Tạo môn học
    async function handleCreate(data) {
        try {
            const json = await apiPost('api/subjects', data);
            toast.success(json?.message || 'Tạo môn học thành công');
            await fetchSubjects();
            setAddOpen(false);
        } catch (err) {
            if (err.response?.data) {
                const data = err.response.data;
                if (data?.errors) {
                    Object.values(data.errors).forEach((errs) => toast.error(errs[0]));
                    return;
                }
                toast.error(data?.message || 'Lỗi khi tạo môn học');
                return;
            }
            toast.error('Lỗi khi tạo môn học');
            console.error(err);
        }
    }

    async function handleUpdate(data) {
        if (!editingSubject?.id) return toast.error('Không có môn học đang sửa');
        try {
            const json = await apiPut(`api/subjects/${editingSubject.id}`, data);
            toast.success(json?.message || 'Cập nhật thành công');
            const updated = json?.data;
            if (updated?.id) setSubjectList((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
            else await fetchSubjects();
            setEditOpen(false);
            setEditingSubject(null);
        } catch (err) {
            if (err.response?.data) {
                const data = err.response.data;
                if (data?.errors) {
                    Object.values(data.errors).forEach((errs) => toast.error(errs[0]));
                    return;
                }
                toast.error(data?.message || 'Lỗi khi cập nhật môn học');
                return;
            }
            toast.error('Lỗi khi cập nhật môn học');
            console.error(err);
        }
    }


    // Xóa môn học
    async function handleDelete(row) {
        const ok = window.confirm('Bạn có chắc muốn xóa môn học này?');
        if (!ok) return;
        try {
            const json = await apiDelete(`api/subjects/${row.id}`);
            if (json?.success === false) {
                toast.error(json?.message || 'Xóa thất bại');
                return;
            }
            toast.success(json?.message || 'Xóa môn học thành công');
            setSubjectList((prev) => prev.filter((item) => item.id !== row.id));
        } catch (err) {
            toast.error('Lỗi khi xóa môn học');
            console.error(err);
        }
    }

    return (
        <div className="p-6">


            <DataTable
                columns={columns}
                data={subjectList}
                loading={loading}
                emptyMessage="Chưa có môn học"
                rowIndexBase={(currentPage - 1) * itemsPerPage}
                onEdit={(row) => {
                    setEditingSubject(row);
                    setEditOpen(true);
                }}
                onDelete={handleDelete}
                headerActions={
                    <button
                        onClick={() => setAddOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Thêm môn học
                    </button>
                }
            />

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

            {isAddOpen && (
                <CrudForm
                    title="Thêm môn học"
                    fields={formFields}
                    onSubmit={handleCreate}
                    onCancel={() => setAddOpen(false)}
                    submitLabel="Lưu thay đổi"
                />
            )}

            {isEditOpen && editingSubject && (
                <CrudForm
                    title="Sửa môn học"
                    fields={formFields}
                    initialValues={{
                        ...editingSubject,
                        major_ids: editingSubject.majors?.map(m => m.id) ?? []
                    }}

                    onSubmit={handleUpdate}
                    onCancel={() => {
                        setEditOpen(false);
                        setEditingSubject(null);
                    }}
                    submitLabel="Lưu thay đổi"
                />
            )}
            <ToastContainer position="bottom-right" autoClose={5000} />
        </div>
    );
}

export default Subject;
