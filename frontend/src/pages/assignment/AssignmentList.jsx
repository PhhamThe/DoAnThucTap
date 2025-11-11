import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import CrudForm from '../../components/CrudForm';
import { apiDelete, apiGet, apiPost } from '../../api/client';
import { useNavigate, useParams } from 'react-router-dom';
import { normalizeFileUpload, buildFileUrlFromUpload } from '../../ulities/fileHelpers';
import { buildFormData } from '../../ulities/fileHelpers';

function AssignmentList() {
    // State quản lý dữ liệu và trạng thái
    const [assignmentList, setAssignmentList] = useState([]); // Danh sách bài tập
    const [loading, setLoading] = useState(false); // Trạng thái loading
    const [currentPage, setCurrentPage] = useState(1); // Trang hiện tại
    const [totalPages, setTotalPages] = useState(1); // Tổng số trang
    const itemsPerPage = 5; // Số item mỗi trang
    const [classes, setClasses] = useState([]); // Danh sách lớp học
    const [isAddOpen, setAddOpen] = useState(false); // Mở form thêm
    const [isEditOpen, setEditOpen] = useState(false); // Mở form sửa
    const [editingRow, setEditingRow] = useState(null); // Dòng đang sửa
    const navigate = useNavigate();
    let { classId } = useParams();
    // Tạo map lớp học để tra cứu nhanh
    const classesMap = useMemo(() => {
        const map = {};
        for (const c of classes) {
            map[c.id] = c.name; // {1: "Lớp A", 2: "Lớp B"}
        }
        return map;
    }, [classes]);

    // Cấu hình cột cho bảng
    const columns = useMemo(
        () => [
            {
                key: 'title',
                header: 'Tiêu đề',
                render: (row) => (row.title ?? row.data?.title ?? '-') // Hiển thị tiêu đề
            },
            {
                key: 'due_date',
                header: 'Hạn nộp',
                render: (row) => {
                    const dueDate = row.due_date;
                    return dueDate ? new Date(dueDate).toLocaleString('vi-VN') : '-'; // Định dạng ngày VN
                }
            },
            {
                key: 'file_upload',
                header: 'File đính kèm',
                render: (row) => {
                    const raw = row.file_upload; // Lấy dữ liệu file
                    const fu = normalizeFileUpload(raw); // Chuẩn hóa dữ liệu file
                    if (!fu) return 'Không có file';
                    const url = buildFileUrlFromUpload(fu); // Tạo URL file
                    const name = fu.name || 'Tệp'; // Lấy tên file
                    if (!url) return name;

                    return (
                        // Link xem file
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-sm">
                            Xem — {name}
                        </a>
                    );
                }
            },
            {
                key: 'actions',
                header: '',
                render: (row) => (<button className='p-2 bg-blue-400 text-white rounded-lg cursor-pointer'

                    onClick={() =>
                        navigate(`/admin/assignment-detail/${row.id}`)}///admin/assignment-detail/:assignmentId
                >Xem
                </button>
                ),
            },
        ],
        [classesMap]
    );

    // Cấu hình các field cho form
    const formFields = useMemo(
        () => [
            { name: 'title', label: 'Tên bài tập', required: true },
            { name: 'class_id', label: 'Lớp học', type: 'select', options: classes, required: true }, // Dropdown chọn lớp
            { name: 'description', type: 'textarea', label: 'Mô tả', required: true }, // Textarea mô tả
            {
                name: 'due_date',
                label: 'Hạn nộp',
                type: 'date', // Input date
                required: true
            },
            {
                name: 'file_upload',
                label: 'File đính kèm',
                type: 'file' // Input file upload
            },
        ],
        [classes]
    );

    // Gọi API khi component mount và khi đổi trang
    useEffect(() => {
        void fetchAssignments();
    }, [currentPage]);

    useEffect(() => {
        void fetchClassesOptions();
    }, []);

    // Lấy danh sách bài tập từ API
    async function fetchAssignments() {
        try {
            setLoading(true);
            const json = await apiGet(`api/teacher_assignment_list/${classId}`, { page: currentPage, limit: itemsPerPage });
            if (json?.success === false) {
                toast.error(json?.message || 'Không thể lấy danh sách bài tập');
                return;
            }
            const container = json?.data ?? [];
            const items = Array.isArray(container) ? container : container?.data ?? []; // Xử lý dữ liệu từ API
            const lastPage = container?.last_page ?? 1;
            setAssignmentList(items);
            setTotalPages(lastPage);
        } catch (err) {
            toast.error('Không thể lấy danh sách bài tập');
        } finally {
            setLoading(false);
        }
    }

    // Lấy danh sách lớp học cho dropdown
    async function fetchClassesOptions() {
        try {
            const json = await apiGet('api/classes', { page: 1, limit: 1000 });
            if (json?.success === false) return;
            const container = json?.data ?? {};
            const items = Array.isArray(container) ? container : container?.data ?? [];
            setClasses(items);
        } catch (err) {
            console.error('không thể lấy danh sách class:', err);
        }
    }

    // Xử lý chuyển trang
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Tạo bài tập mới
    async function handleCreate(data) {
        try {
            const formData = buildFormData(data); // Chuyển thành FormData (hỗ trợ file)
            const json = await apiPost('api/assignments', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (json?.success === false) {
                if (json?.errors) Object.values(json.errors).forEach((errs) => toast.warn(errs[0]));
                return;
            }
            toast.success(json?.message || 'Tạo bài tập thành công');
            const created = json?.data;
            if (created?.id) {
                setAssignmentList((prev) => [created, ...prev]); // Thêm vào đầu danh sách
            } else {
                await fetchAssignments(); // Load lại danh sách
            }
            setAddOpen(false);
        } catch (err) {
            toast.error('Lỗi khi tạo bài tập');
        }
    }

    // Cập nhật bài tập
    async function handleUpdate(data) {
        if (!editingRow?.id) return toast.error('Không có bài tập đang sửa');
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('class_id', data.class_id);
            formData.append('description', data.description);
            formData.append('due_date', data.due_date);

            // Chỉ gửi file nếu có file mới
            if (data.file_upload instanceof File) {
                formData.append('file_upload', data.file_upload);
            }

            // Gửi PUT request thông qua POST với _method=PUT (cho Laravel)
            const json = await apiPost(`api/assignments/${editingRow.id}?_method=PUT`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (json?.success === false) {
                toast.error(json?.message || 'Cập nhật thất bại');
                return;
            }

            toast.success(json?.message || 'Cập nhật bài tập thành công');
            const updated = json?.data;
            if (updated?.id) {
                setAssignmentList((prev) => prev.map((row) => (row.id === updated.id ? updated : row))); // Cập nhật trong danh sách
            } else {
                await fetchAssignments();
            }

            setEditOpen(false);
            setEditingRow(null);
        } catch (err) {
            toast.error('Lỗi khi cập nhật bài tập');
        }
    }

    // Xóa bài tập
    async function handleDelete(row) {
        const ok = window.confirm('Bạn có chắc muốn xóa bài tập này?');
        if (!ok) return;
        try {
            const json = await apiDelete(`api/assignments/${row.id}`);
            if (json?.success === false) {
                toast.error(json?.message || 'Xóa thất bại');
                return;
            }
            toast.success(json?.message || 'Xóa bài tập thành công');
            setAssignmentList((prev) => prev.filter((item) => item.id !== row.id));
        } catch (err) {
            toast.error('Lỗi khi xóa bài tập');
        }
    }

    return (
        <div className="p-6">
            {/* Header với nút thêm bài tập */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold">Danh sách bài tập</h2>
                <button onClick={() => setAddOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                    Thêm bài tập
                </button>
            </div>

            {/* Bảng hiển thị danh sách bài tập */}
            <DataTable
                columns={columns}
                data={assignmentList}
                loading={loading}
                emptyMessage="Chưa có bài tập nào"
                onEdit={(row) => {
                    // Chuẩn bị dữ liệu cho form sửa
                    const rawDate = row.due_date;
                    let formattedDate = '';

                    if (rawDate) {
                        const d = new Date(rawDate);
                        if (!isNaN(d)) {
                            formattedDate = d.toISOString().slice(0, 10); // Định dạng yyyy-mm-dd
                        }
                    }

                    const normalized = {
                        ...row,
                        class_id: row.class_id,
                        due_date: formattedDate,
                    };
                    setEditingRow(normalized);
                    setEditOpen(true);
                }}
                onDelete={handleDelete}

            />

            {/* Phân trang */}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

            {/* Form thêm bài tập */}
            {isAddOpen && (
                <CrudForm
                    title="Thêm bài tập"
                    fields={formFields}
                    onSubmit={handleCreate}
                    onCancel={() => setAddOpen(false)}
                    submitLabel="Lưu thay đổi"
                />
            )}

            {/* Form sửa bài tập */}
            {isEditOpen && editingRow && (
                <CrudForm
                    title="Sửa bài tập"
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

            {/* Thông báo toast */}

            <ToastContainer position="bottom-right" autoClose={5000} />
        </div>
    );
}

export default AssignmentList;