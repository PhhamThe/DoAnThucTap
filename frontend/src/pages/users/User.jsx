import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import CrudForm from '../../components/CrudForm';
import ImportExcel from '../../components/excel/ImportExcel';
import { apiDelete, apiGet, apiPost, apiPut } from '../../api/client';
import { useNavigate } from 'react-router-dom';

function User() {
    const [userList, setUserList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;
    const [isAddOpen, setAddOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [isImportOpen, setImportOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const navigate = useNavigate();
    const [majors, setMajors] = useState([]);

    useEffect(() => {
        async function fetchMajors() {
            const res = await apiGet('api/majors');
            setMajors(res?.data.data || []);
        }
        fetchMajors();
    }, []);

    // Cột hiển thị trong DataTable
    const columns = useMemo(() => [
        { key: 'username', header: 'Tên đăng nhập', render: (row) => row.username ?? '-' },
        { key: 'full_name', header: 'Họ và tên', render: (row) => row.full_name ?? '-' },
        { key: 'email', header: 'Email', render: (row) => row.email ?? '-' },
        { key: 'role', header: 'Vai trò', render: (row) => row.role ?? '-' },
    ], [majors]);

    // Cấu hình form CRUD và Excel
    const formFields = useMemo(() => [
        { name: 'username', label: 'Tên đăng nhập', required: true },
        { name: 'full_name', label: 'Họ và tên', required: true },
        { name: 'email', label: 'Email', required: true },
        {
            name: 'role',
            label: 'Vai trò',
            type: 'select',
            options: [
                { id: 'admin', name: 'Admin' },
                { id: 'teacher', name: 'Teacher' },
                { id: 'student', name: 'Student' },
            ],
            required: true
        },
        {
            name: 'major_id',
            label: 'Ngành học',
            type: 'select',
            options: majors,
            required: true,
            showWhen: (formData) => formData.role === 'student',
        },
        { name: 'password', label: 'Mật khẩu', type: 'password' },
    ], [majors]);

    // Dữ liệu mẫu cho template Excel
    const excelTemplateFields = useMemo(() => [
        { name: 'username', label: 'Tên đăng nhập', required: true },
        { name: 'full_name', label: 'Họ và tên', required: true },
        { name: 'email', label: 'Email', required: true },
        { name: 'role', label: 'Vai trò', required: true, hint: 'admin, teacher, student' },
        { name: 'major_id', label: 'Mã ngành học', hint: 'Chỉ dành cho student' },
        { name: 'password', label: 'Mật khẩu', required: true, hint: 'Để trống nếu không đổi' },
    ], []);

    const sampleData = [
        {
            username: 'user1',
            full_name: 'Nguyễn Văn A',
            email: 'user1@example.com',
            role: 'student',
            major_id: 'IT',
            password: 'password123'
        },
        {
            username: 'user2',
            full_name: 'Trần Thị B',
            email: 'user2@example.com',
            role: 'teacher',
            major_id: '',
            password: 'password456'
        }
    ];

    // Lấy danh sách user
    useEffect(() => {
        void fetchUsers();
    }, [currentPage]);

    async function fetchUsers() {
        try {
            setLoading(true);
            const params = { page: currentPage, limit: itemsPerPage };
            const json = await apiGet('api/users', params);
            if (json?.success === false) {
                toast.error(json?.message || 'Không thể lấy danh sách người dùng');
                return;
            }

            const container = json?.data ?? {};
            const items = Array.isArray(container) ? container : container?.data ?? [];
            const lastPage = container?.last_page ?? 1;

            setUserList(items);
            setTotalPages(lastPage);
        } catch (err) {
            toast.error('Không thể lấy danh sách người dùng');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Import từ Excel
    async function handleImportExcel(data) {
        setLoading(true);

        let success = 0, failed = 0;
        const errors = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            try {
                const payload = {
                    username: String(row.username || ''),
                    full_name: String(row.full_name || ''),
                    email: String(row.email || ''),
                    role: String(row.role || '').toLowerCase(),
                    password: String(row.password || 'Password@123')
                };

                if (payload.role === 'student' && row.major_id) {
                    payload.major_id = String(row.major_id);
                }

                await apiPost('api/users', payload);
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
            toast.success(`Import thành công ${success} người dùng`);
        }

        await fetchUsers();
        setImportOpen(false);
        setLoading(false);
    }
    // Tạo mới user
    async function handleCreate(data) {
        try {
            const payload = { ...data };

            if (payload.role !== 'student') {
                delete payload.major_id;
            }
            const json = await apiPost('api/users', data);
            toast.success(json?.message || 'Tạo user thành công');
            const created = json?.data;
            if (created?.id) {
                setUserList((prev) => [created, ...prev]);
            } else {
                await fetchUsers();
            }
            setAddOpen(false);
        } catch (err) {
            if (err.response?.data) {
                const data = err.response.data;
                if (data?.errors) {
                    Object.values(data.errors).forEach((errs) => toast.error(errs[0]));
                    return;
                }
                toast.error(data?.message || 'Lỗi khi tạo user');
                return;
            }
            toast.error('Lỗi khi tạo user');
            console.error(err);
        }
    }

    async function handleUpdate(data) {
        if (!editingUser?.id) return toast.error('Không có user đang sửa');
        try {
            const payload = {
                username: data.username,
                full_name: data.full_name,
                email: data.email,
                role: data.role,
                major_id: data.major_id
            };
            if (data.password && data.password.trim() !== '') {
                payload.password = data.password;
            }

            const json = await apiPut(`api/users/${editingUser.id}`, payload);
            toast.success(json?.message || 'Cập nhật user thành công');

            const updated = json?.data;
            if (updated?.id) {
                setUserList((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
            } else {
                await fetchUsers();
            }
            setEditOpen(false);
            setEditingUser(null);
        } catch (err) {
            if (err.response?.data) {
                const data = err.response.data;
                if (data?.errors) {
                    Object.values(data.errors).forEach((errs) => toast.error(errs[0]));
                    return;
                }
                toast.error(data?.message || 'Lỗi khi cập nhật user');
                return;
            }
            toast.error('Lỗi khi cập nhật user');
            console.error(err);
        }
    }

    // Xóa user
    async function handleDelete(row) {
        const ok = window.confirm('Bạn có chắc muốn xóa user này?');
        if (!ok) return;
        try {
            const json = await apiDelete(`api/users/${row.id}`);
            if (json?.success === false) {
                toast.error(json?.message || 'Xóa thất bại');
                return;
            }
            toast.success(json?.message || 'Xóa user thành công');
            setUserList((prev) => prev.filter((item) => item.id !== row.id));
        } catch (err) {
            toast.error('Lỗi khi xóa user');
            console.error(err);
        }
    }

    return (
        <div className="p-6">


            <DataTable
                columns={columns}
                data={userList}
                loading={loading}
                emptyMessage="Chưa có người dùng nào"
                rowIndexBase={(currentPage - 1) * itemsPerPage}
                onEdit={(row) => {
                    setEditingUser(row);
                    setEditOpen(true);
                }}
                onDelete={handleDelete}
                onView={(row)=> navigate(`/admin/user_info/${row.id}`)}
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
                            Thêm người dùng
                        </button>
                    </div>
                }
            />

            {/* Phân trang */}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

            {/* Form thêm */}
            {isAddOpen && (
                <CrudForm
                    title="Thêm người dùng"
                    fields={formFields}
                    onSubmit={handleCreate}
                    onCancel={() => setAddOpen(false)}
                    submitLabel="Lưu thay đổi"
                />
            )}

            {/* Form sửa */}
            {isEditOpen && editingUser && (
                <CrudForm
                    title="Sửa người dùng"
                    fields={formFields}
                    initialValues={editingUser}
                    onSubmit={handleUpdate}
                    onCancel={() => {
                        setEditOpen(false);
                        setEditingUser(null);
                    }}
                    submitLabel="Lưu thay đổi"
                />
            )}

            {/* Modal import Excel */}
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

export default User;