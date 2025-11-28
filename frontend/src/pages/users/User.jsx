import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import CrudForm from '../../components/CrudForm';
import { apiDelete, apiGet, apiPost, apiPut } from '../../api/client';
import FilterBar from '../../components/filter/FilterBar';
import SearchInput from '../../components/search/SearchInput';
function User() {
    const [userList, setUserList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;
    const [searchKeyword, setSearchKeyword] = useState(null);
    const [isAddOpen, setAddOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [filterRole, setFilterRole] = useState('all');

    // Cột hiển thị trong DataTable
    const columns = useMemo(() => [
        { key: 'username', header: 'Tên đăng nhập', render: (row) => row.username ?? '-' },
        { key: 'full_name', header: 'Họ và tên', render: (row) => row.full_name ?? '-' },
        { key: 'email', header: 'Email', render: (row) => row.email ?? '-' },
        { key: 'role', header: 'Vai trò', render: (row) => row.role ?? '-' },
    ], []);

    // Cấu hình form CRUD
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
        { name: 'password', label: 'Mật khẩu', type: 'password' },
    ], []);

    // Lấy danh sách user
    useEffect(() => {
        void fetchUsers();
    }, [currentPage, filterRole, searchKeyword]);

    async function fetchUsers() {
        try {
            setLoading(true);
            const params = { page: currentPage, limit: itemsPerPage };
            if (filterRole !== "all") params.role = filterRole;
            if (searchKeyword) params.search = searchKeyword;


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

    // Tạo mới user
    async function handleCreate(data) {
        try {
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold">Quản lý người dùng</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => setAddOpen(true)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-emerald-700">
                        Thêm người dùng
                    </button>
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-1 py-2 bg-white rounded shadow">
                {/* Filter dropdown */}
                <FilterBar
                    filters={[
                        {
                            name: "role",
                            options: [
                                { id: "admin", name: "Quản trị viên" },
                                { id: "teacher", name: "Giáo viên" },
                                { id: "student", name: "Sinh viên" },
                            ],
                        },
                    ]}
                    onFilterChange={(values) => {
                        setCurrentPage(1);
                        setFilterRole(values.role || "all");
                    }}

                />

                <SearchInput
                    placeholder="Tìm kiếm tên hoặc email..."
                    onSearch={(keyword) => {
                        setCurrentPage(1);
                        setSearchKeyword(keyword);
                    }}
                    compact={true}
                />


            </div>



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

            <ToastContainer position="bottom-right" autoClose={5000} />
        </div>
    );
}

export default User;
