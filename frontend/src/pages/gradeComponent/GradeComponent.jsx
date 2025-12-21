import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import CrudForm from '../../components/CrudForm';
import { apiDelete, apiGet, apiPost, apiPut } from '../../api/client';

function GradeComponent() {
    const [componentList, setComponentList] = useState([]);
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
                key: 'code',
                header: 'Mã loại điểm',
                render: (row) => row.code ?? row.data?.code ?? '-',
            },
            {
                key: 'name',
                header: 'Tên loại điểm',
                render: (row) => row.name ?? row.data?.name ?? '-',
            },
            {
                key: 'default_weight',
                header: 'Trọng số mặc định (%)',
                render: (row) => {
                    const weight = row.default_weight ?? row.data?.default_weight;
                    return weight ? `${weight}%` : '-';
                },
            },
            {
                key: 'description',
                header: 'Mô tả',
                render: (row) => row.description ?? row.data?.description ?? '-',
            },
            {
                key: 'is_active',
                header: 'Trạng thái',
                render: (row) => {
                    const isActive = row.is_active ?? row.data?.is_active;
                    return isActive ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Đang hoạt động
                        </span>
                    ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Không hoạt động
                        </span>
                    );
                },
            },
            {
                key: 'order',
                header: 'Thứ tự',
                render: (row) => row.order ?? row.data?.order ?? '-',
            },
        ],
        []
    );

    const formFields = useMemo(
        () => [
            { name: 'code', label: 'Mã loại điểm', required: true, placeholder: 'VD: attendance, assignment...' },
            { name: 'name', label: 'Tên loại điểm', required: true, placeholder: 'VD: Chuyên cần, Bài tập...' },
            { 
                name: 'default_weight', 
                label: 'Trọng số mặc định (%)', 
                type: 'number',
                required: true,
                min: 0,
                max: 100,
                step: 0.01
            },
            { name: 'description', label: 'Mô tả', type: 'textarea' },
            { 
                name: 'order', 
                label: 'Thứ tự hiển thị', 
                type: 'number',
                required: true,
                min: 0
            },
            {
                name: 'is_active',
                label: 'Trạng thái hoạt động',
                type: 'select',
                options: [
                    { value: 1, label: 'Đang hoạt động' },
                    { value: 0, label: 'Không hoạt động' }
                ],
                required: true
            }
        ],
        []
    );

    useEffect(() => {
        void fetchComponents();
    }, [currentPage]);

    // Lấy danh sách loại điểm
    async function fetchComponents() {
        try {
            setLoading(true);
            const json = await apiGet('api/grade-components', { page: currentPage, limit: itemsPerPage });
            if (json?.success === false) {
                toast.error(json?.message || 'Không thể lấy danh sách loại điểm');
                return;
            }
            const container = json?.data ?? {};
            const items = Array.isArray(container) ? container : container?.data ?? [];
            const lastPage = container?.last_page ?? 1;
            setComponentList(items);
            setTotalPages(lastPage);
        } catch (err) {
            toast.error('Không thể lấy danh sách loại điểm');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Tạo loại điểm mới
    async function handleCreate(data) {
        try {
            // Format data
            const payload = {
                ...data,
                default_weight: parseFloat(data.default_weight),
                order: parseInt(data.order),
                is_active: data.is_active === '1' || data.is_active === 1
            };
            
            const json = await apiPost('api/grade-components', payload);
            toast.success(json?.message || 'Tạo loại điểm thành công');

            const created = json?.data;
            if (created?.id) {
                setComponentList((prev) => [created, ...prev]);
            } else {
                await fetchComponents();
            }
            setAddOpen(false);
        } catch (err) {
            if (err.response?.data) {
                const data = err.response.data;
                if (data?.errors) {
                    Object.values(data.errors).forEach((errs) => toast.error(errs[0]));
                    return;
                }
                toast.error(data?.message || 'Lỗi khi tạo loại điểm');
                return;
            }
            toast.error('Lỗi khi tạo loại điểm');
            console.error(err);
        }
    }

    // Cập nhật loại điểm
    async function handleUpdate(data) {
        if (!editingRow?.id) return toast.error('Không có loại điểm đang sửa');
        try {
            // Format data
            const payload = {
                code: data.code,
                name: data.name,
                default_weight: parseFloat(data.default_weight),
                description: data.description,
                order: parseInt(data.order),
                is_active: data.is_active === '1' || data.is_active === 1
            };
            
            const json = await apiPut(`api/grade-components/${editingRow.id}`, payload);
            toast.success(json?.message || 'Cập nhật loại điểm thành công');

            const updated = json?.data;
            if (updated?.id) {
                setComponentList((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
            } else {
                await fetchComponents();
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
                toast.error(data?.message || 'Lỗi khi cập nhật loại điểm');
                return;
            }
            toast.error('Lỗi khi cập nhật loại điểm');
            console.error(err);
        }
    }

    // Xóa loại điểm
    async function handleDelete(row) {
        const ok = window.confirm('Bạn có chắc muốn xóa loại điểm này?');
        if (!ok) return;
        try {
            const json = await apiDelete(`api/grade-components/${row.id}`);
            if (json?.success === false) {
                toast.error(json?.message || 'Xóa thất bại');
                return;
            }
            toast.success(json?.message || 'Xóa loại điểm thành công');
            setComponentList((prev) => prev.filter((item) => item.id !== row.id));
        } catch (err) {
            toast.error('Lỗi khi xóa loại điểm');
            console.error(err);
        }
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Quản lý Loại Điểm</h1>
            
            <DataTable
                columns={columns}
                data={componentList}
                loading={loading}
                emptyMessage="Chưa có loại điểm nào"
                rowIndexBase={(currentPage - 1) * itemsPerPage}
                onEdit={(row) => {
                    const normalized = {
                        ...row,
                        is_active: row.is_active ? '1' : '0'
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
                        Thêm loại điểm
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
                    title="Thêm loại điểm"
                    fields={formFields}
                    onSubmit={handleCreate}
                    onCancel={() => setAddOpen(false)}
                    submitLabel="Tạo mới"
                />
            )}

            {isEditOpen && editingRow && (
                <CrudForm
                    title="Sửa loại điểm"
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

export default GradeComponent;