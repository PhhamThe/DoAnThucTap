import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import CrudForm from '../../components/CrudForm';
import { apiDelete, apiGet, apiPost, apiPut } from '../../api/client';
import { useParams } from 'react-router-dom';

function ClassStudent() {
    const [studentList, setStudentList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;
    const [faculties, setFaculties] = useState([]);
    const [isAddOpen, setAddOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    let { classId } = useParams();

   
    const columns = useMemo( // Đây là các cột bảng hiển thị danh sách
        () => [
            {
                key: 'student_name',
                header: 'Tên sinh viên ',
                render: (row) => row.student.name ?? '-',
            },
            {
                key: 'ma_sv',
                header: 'Mã số sinh viên',
                render: (row) =>
                    row.student?.mssv ??
                    '-',
            },
            {
                key: 'ngaysinh',
                header: 'Ngày sinh',
                render: (row) => row.student.date_of_birth
            },
        ],
        []
    );

    const formFields = useMemo( // Đây là form sửa hoặc thêm
        () => [
            { name: 'mssv', label: 'Mã số sinh viên', required: true },
        ],
        []
    );

    useEffect(() => {
        void fetchStudentByClasses();
    }, [currentPage]);

    //Lấy dữ liệu sinh viên 
    async function fetchStudentByClasses() {
        try {
            setLoading(true);
            const json = await apiGet(`api/student_by_class/${classId}`, { page: currentPage, limit: itemsPerPage });
            if (json?.success === false) {
                toast.error(json?.message || 'Không thể lấy danh sách sinh viên');
                return;
            }
            const container = json?.data ?? {};
            const items = Array.isArray(container) ? container : container?.data ?? [];
            const lastPage = container?.last_page ?? 1;
            setStudentList(items);
            setTotalPages(lastPage);
        } catch (err) {
            toast.error('Không thể lấy danh sách sinh viên');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }


    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    async function handleCreate(data) {
        try {
            const json = await apiPost(`api/class_student/${classId}`, data);
            if (json?.success === false) {
                if (json?.errors) Object.values(json.errors).forEach((errs) => toast.warn(errs[0]));
                return;
            }
            toast.success(json?.message || 'Tạo sinh viên thành công');
            const created = json?.data;
            if (created?.id) {
                setStudentList((prev) => [created, ...prev]);
            } else {
                await fetchStudentByClasses();
            }
            setAddOpen(false);
        } catch (err) {
            toast.error('Lỗi khi tạo sinh viên');
            console.error(err);
        }
    }

    //Gọi api update sinh viên
    async function handleUpdate(data) {
        if (!editingRow?.id) return toast.error('Không có sinh viên đang sửa');
        try {
            const payload = { name: data.name, faculty_id: data.faculty_id, description: data.description };
            const json = await apiPut(`api/majors/${editingRow.id}`, payload);
            if (json?.success === false) {
                toast.error(json?.message || 'Cập nhật thất bại');
                if (json?.errors) Object.values(json.errors).forEach((errs) => toast.warn(errs[0]));
                return;
            }
            toast.success(json?.message || 'Cập nhật sinh viên thành công');
            const updated = json?.data;
            if (updated?.id) {
                setStudentList((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
            } else {
                await fetchStudentByClasses();
            }
            setEditOpen(false);
            setEditingRow(null);
        } catch (err) {
            toast.error('Lỗi khi cập nhật sinh viên');
            console.error(err);
        }
    }

    async function handleDelete(row) {
        const ok = window.confirm('Bạn có chắc muốn xóa sinh viên này?');
        if (!ok) return;
        try {
            const json = await apiDelete(`api/class_student/${row.id}`);
            if (json?.success === false) {
                toast.error(json?.message || 'Xóa thất bại');
                return;
            }
            toast.success(json?.message || 'Xóa sinh viên thành công');
            setStudentList((prev) => prev.filter((item) => item.id !== row.id));
        } catch (err) {
            toast.error('Lỗi khi xóa sinh viên');
            console.error(err);
        }
    }
    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold">Danh sách sinh viên</h2>
                <div className="flex items-center gap-2">
                      <button onClick={() => setAddOpen(true)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">
                        Thêm sinh viên
                    </button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={studentList}
                loading={loading}
                emptyMessage="Chưa có sinh viên nào trong lớp"
                rowIndexBase={(currentPage - 1) * itemsPerPage}
                onDelete={handleDelete}
            />

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

            {isAddOpen && (
                <CrudForm
                    title="Thêm sinh viên"
                    fields={formFields}
                    onSubmit={handleCreate}
                    onCancel={() => setAddOpen(false)}
                    submitLabel="Lưu thay đổi"
                />
            )}

            {isEditOpen && editingRow && (
                <CrudForm
                    title="Sửa sinh viên"
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

export default ClassStudent