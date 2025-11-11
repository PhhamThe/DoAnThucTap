import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import CrudForm from '../../components/CrudForm';
import { apiDelete, apiGet, apiPost, apiPut } from '../../api/client';

function Class() {
    const [classList, setClassList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;
    const [subjects, setSubjects] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [isAddOpen, setAddOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);

    const subjectsMap = useMemo(() => {
        const map = {};
        for (const f of subjects) {
            map[f.id] = f.name;

        }
        return map;
    }, [subjects]);

    const semestersMap = useMemo(() => {
        const map = {};
        for (const f of semesters) {
            map[f.id] = f.name;

        }
        return map;
    }, [semesters]);

    const teachersMap = useMemo(() => {
        const map = {};
        for (const f of teachers) {
            map[f.id] = f.name;

        }
        return map;
    }, [teachers]);

    const columns = useMemo( 
        () => [
            {
                key: 'name',
                header: 'Tên lớp',
                render: (row) => row.name ?? row.data?.name ?? '-',
            },
            {
                key: 'description',
                header: 'Mô tả',
                render: (row) => row.description ?? row.data?.description ?? '-',
            },
            {
                key: 'subject_id',
                header: 'Học phần',
                render: (row) =>
                    subjectsMap[row.subject_id ?? row.data?.subjects?.id] ??
                    '-',
            },
            {
                key: 'teacher_id',
                header: 'Giáo viên',
                render: (row) =>
                    teachersMap[row.teacher_id ?? row.data?.teachers?.id] ??
                    '-',
            },
            {
                key: 'semester_id',
                header: 'Kỳ học',
                render: (row) =>
                    semestersMap[row.semester_id ?? row.data?.semesters?.id] ??
                    '-',
            },
        ],
        [subjectsMap, teachersMap, semestersMap]
    );

    const formFields = useMemo( 
        () => [
            { name: 'name', label: 'Tên lớp', required: true },
            { name: 'subject_id', label: 'Học phần', type: 'select', options: subjects, required: true },
            { name: 'semester_id', label: 'Kì học', type: 'select', options: semesters, required: true },
            { name: 'teacher_id', label: 'Giáo viên dạy', type: 'select', options: teachers, required: true },
            { name: 'description', label: 'Mô tả', required: true },
        ],
        [subjects, semesters, teachers]
    );

    useEffect(() => {
        void fetchClasses();
    }, [currentPage]);

    useEffect(() => {
        void fetchSemestersOptions();
        void fetchTeachersOptions();
        void fetchSubjectsOptions();
    }, []);

    //Lấy dữ liệu ngành 
    async function fetchClasses() {
        try {
            setLoading(true);
            const json = await apiGet('api/classes', { page: currentPage, limit: itemsPerPage });
            if (json?.success === false) {
                toast.error(json?.message || 'Không thể lấy danh sách lớp học');
                return;
            }
            const container = json?.data ?? {};
            const items = Array.isArray(container) ? container : container?.data ?? [];
            const lastPage = container?.last_page ?? 1;
            setClassList(items);
            setTotalPages(lastPage);
        } catch (err) {
            toast.error('Không thể lấy danh sách lớp học');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    //Lấy dữ liệu khoa viện để làm dropdown
    async function fetchSubjectsOptions() {
        try {
            const json = await apiGet('api/subjects', { page: 1, limit: 1000 });
            if (json?.success === false) return;
            const container = json?.data ?? {};
            const items = Array.isArray(container) ? container : container?.data ?? [];
            setSubjects(items);
        } catch (err) {
            console.error('Lỗi lấy môn học:', err);
        }
    }
    async function fetchTeachersOptions() {
        try {
            const json = await apiGet('api/teachers', { page: 1, limit: 1000 });
            if (json?.success === false) return;
            const container = json?.data ?? {};
            const items = Array.isArray(container) ? container : container?.data ?? [];
            setTeachers(items);
        } catch (err) {
            console.error('Lỗi lấy giáo viên:', err);
        }
    }

    async function fetchSemestersOptions() {
        try {
            const json = await apiGet('api/semesters', { page: 1, limit: 1000 });
            if (json?.success === false) return;
            const container = json?.data ?? {};
            const items = Array.isArray(container) ? container : container?.data ?? [];
            setSemesters(items);
        } catch (err) {
            console.error('Lỗi lấy kì học:', err);
        }
    }
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    async function handleCreate(data) {
        try {
            const json = await apiPost('api/classes', data);
            toast.success(json?.message || 'Tạo lớp học thành công');
            const created = json?.data;
            if (created?.id) {
                setClassList((prev) => [created, ...prev]);
            } else {
                await fetchClasses();
            }
            setAddOpen(false);

        } catch (err) {
            if (err.response?.data) {
                const data = err.response.data;

                if (data?.errors) {
                    Object.values(data.errors).forEach((errs) => toast.error(errs[0]));
                    return;
                }

                toast.error(data?.message || 'Lỗi khi tạo lớp học');
                return;
            }

            toast.error('Lỗi khi tạo lớp học');
            console.error(err);
        }
    }

    async function handleUpdate(data) {
        if (!editingRow?.id) return toast.error('Không có lớp đang sửa');
        try {
            const payload = {
                name: data.name,
                teacher_id: data.teacher_id,
                semester_id: data.semester_id,
                subject_id: data.subject_id,
                description: data.description,
            };
            const json = await apiPut(`api/classes/${editingRow.id}`, payload);


            toast.success(json?.message || 'Cập nhật lớp thành công');
            const updated = json?.data;
            if (updated?.id) {
                setClassList((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
            } else {
                await fetchClasses();
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
                toast.error(data?.message || 'Lỗi khi cập nhật lớp');
                return;
            }
            toast.error('Lỗi khi cập nhật lớp');
            console.error(err);
        }
    }


    async function handleDelete(row) {
        const ok = window.confirm('Bạn có chắc muốn xóa lớp này?');
        if (!ok) return;
        try {
            const json = await apiDelete(`api/classes/${row.id}`);
            if (json?.success === false) {
                toast.error(json?.message || 'Xóa thất bại');
                return;
            }
            toast.success(json?.message || 'Xóa lớp thành công');
            setClassList((prev) => prev.filter((item) => item.id !== row.id));
        } catch (err) {
            toast.error('Lỗi khi xóa lớp');
            console.error(err);
        }
    }
    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold">Quản lý lớp học</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => setAddOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                        Thêm lớp học
                    </button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={classList}
                loading={loading}
                emptyMessage="Chưa có lớp học nào"
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
                    title="Thêm lớp học"
                    fields={formFields}
                    onSubmit={handleCreate}
                    onCancel={() => setAddOpen(false)}
                    submitLabel="Lưu thay đổi"
                />
            )}

            {isEditOpen && editingRow && (
                <CrudForm
                    title="Sửa lớp học"
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

export default Class