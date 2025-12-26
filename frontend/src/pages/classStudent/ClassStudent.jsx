import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import CrudForm from '../../components/CrudForm';
import ImportExcel from '../../components/excel/ImportExcel';
import { apiDelete, apiGet, apiPost, apiPut } from '../../api/client';
import { useParams } from 'react-router-dom';

function ClassStudent() {
    const [studentList, setStudentList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;
    const [isAddOpen, setAddOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const [isImportOpen, setImportOpen] = useState(false);
    let { classId } = useParams();


    const columns = useMemo(
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

    const formFields = useMemo(
        () => [
            { name: 'mssv', label: 'Mã số sinh viên', required: true },
        ],
        []
    );
    //các trường mình sẽ có trong template
    const excelTemplateFields = useMemo(() => [
        { name: 'mssv', label: 'Mã sinh viên', required: true },

    ], []);
    //ví dụ mẫu cho template
    const sampleData = [
        {
            mssv: 'SV0012025',

        },
        {
            mssv: 'SV0022025',

        }
    ];

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
  
    //delete sinh viên
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

    //import file excel
    async function handleImportExcel(data) {
        setLoading(true);

        let success = 0, failed = 0;
        const errors = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            try {
                const payload = {
                    mssv: String(row.mssv || ''),
                };
                await apiPost(`api/class_student/${classId}`, payload);
                success++;

            } catch (error) {
                failed++;
                const errorMsg = error.response?.data?.message || error.message || 'Lỗi không xác định';
                errors.push(`Dòng ${i + 1}: ${errorMsg}`);
            }
        }

        // Hiển thị kết quả
        if (failed > 0) {
            toast.warning(`Import: ${success} thành công, ${failed} thất bại`);
            errors.slice(0, 3).forEach(msg => toast.error(msg));
        } else {
            toast.success(`Import thành công ${success} sinh viên`);
        }

        await fetchStudentByClasses();
        setImportOpen(false);
        setLoading(false);
    }
    return (
        <div className="p-6">


            <DataTable
                columns={columns}
                data={studentList}
                loading={loading}
                emptyMessage="Chưa có sinh viên nào trong lớp"
                rowIndexBase={(currentPage - 1) * itemsPerPage}
                onDelete={handleDelete}
                headerActions={
                    <div className="flex gap-3">
                        <button
                            onClick={() => setImportOpen(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >

                            Import Excel
                        </button>
                        <button
                            onClick={() => setAddOpen(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Thêm sinh viên
                        </button>
                    </div>
                }
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
                    onCancel={() => {
                        setEditOpen(false);
                        setEditingRow(null);
                    }}
                    submitLabel="Lưu thay đổi"
                />
            )}

            {isImportOpen && (
                <ImportExcel
                    onImport={handleImportExcel}
                    onCancel={() => setImportOpen(false)}
                    templateColumns={excelTemplateFields}
                    sampleData={sampleData}
                    maxRows={100}
                />
            )}
            <ToastContainer position="bottom-right" autoClose={5000} />
        </div>
    );
}

export default ClassStudent