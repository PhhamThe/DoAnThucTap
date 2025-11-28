import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import CrudForm from '../../components/CrudForm';
import { apiDelete, apiGet, apiPost, apiPut } from '../../api/client';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { buildFormData } from '../../ulities/fileHelpers';

function Chapters() {
    const { classId } = useParams();
    const [chapterList, setChapterList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;

    const [isAddOpen, setAddOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const navigate = useNavigate();
    const columns = useMemo(
        () => [
            { key: 'title', header: 'Tên chương' },
            {
                key: 'lessons_count',
                header: 'Số bài giảng',
                render: (row) => row.lessons?.length ?? 0
            },
            { key: 'description', header: 'Mô tả' },
        ],
        []
    );

    const formFields = useMemo(
        () => [
            { name: 'title', label: 'Tên chương', required: true },
            { name: 'description', label: 'Mô tả' , type : 'textarea'},
            { name: 'content', label: 'Nội dung', type : 'textarea' },
            { name: 'video_url', label: 'Video', type: 'file' },
            { name: 'attachment', label: 'Tài liệu', type: 'file' },
        ],
        []
    );

    useEffect(() => {
        void fetchChapters();
    }, [currentPage, classId]);

    async function fetchChapters() {
        try {
            setLoading(true);
            const json = await apiGet('api/chapters', { page: currentPage, limit: itemsPerPage, class_id: classId });
            if (!json?.success) {
                toast.error(json?.message || 'Không thể lấy danh sách chương');
                return;
            }
            const container = json.data ?? {};
            const items = Array.isArray(container) ? container : container.data ?? [];
            const lastPage = container.last_page ?? 1;
            setChapterList(items);
            setTotalPages(lastPage);
        } catch (err) {
            toast.error('Không thể lấy danh sách chương');
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(form) {
        try {
            const data = { ...form, class_id: classId };
            const fd = buildFormData(data);

            const json = await apiPost("api/chapters", fd, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (!json?.success) return toast.error(json?.message || "Lỗi tạo chương");

            toast.success("Tạo chương thành công");
            setAddOpen(false);
            await fetchChapters();

        } catch (err) {
            toast.error("Lỗi tạo chương");
        }
    }


    async function handleUpdate(form) {
        if (!editingRow?.id) return toast.error("Không có chương đang sửa");

        try {
            const data = { ...form };
            if (!(data.video_url instanceof File)) delete data.video_url;
            if (!(data.attachment instanceof File)) delete data.attachment;

            data.class_id = form.class_id || editingRow.class_id;
            const fd = buildFormData(data);

            const json = await apiPut(`api/chapters/${editingRow.id}`, fd, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (!json?.success) return toast.error(json?.message || "Lỗi cập nhật chương");

            toast.success("Cập nhật chương thành công");
            setEditOpen(false);
            setEditingRow(null);
            await fetchChapters();

        } catch (err) {
            toast.error("Lỗi cập nhật chương");
        }
    }


    async function handleDelete(row) {
        const ok = window.confirm('Bạn có chắc muốn xóa chương này?');
        if (!ok) return;

        try {
            const json = await apiDelete(`api/chapters/${row.id}`);
            if (!json?.success) {
                toast.error(json?.message || 'Xóa thất bại');
                return;
            }
            toast.success('Xóa chương thành công');
            setChapterList((prev) => prev.filter((item) => item.id !== row.id));
        } catch (err) {
            toast.error('Lỗi khi xóa chương');
        }
    }

    const handlePageChange = (page) => setCurrentPage(page);

    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold">Quản lý chương</h2>
                <button onClick={() => setAddOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Thêm chương
                </button>
            </div>

            <DataTable
                columns={columns}
                data={chapterList}
                loading={loading}
                emptyMessage="Chưa có chương nào"
                rowIndexBase={(currentPage - 1) * itemsPerPage}
                onEdit={(row) => {
                    setEditingRow(row);
                    setEditOpen(true);
                }}
                onDelete={handleDelete}
                onView={(row) => navigate(`/admin/chapter_details/${row.id}`)}
            />

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

            {isAddOpen && (
                <CrudForm
                    title="Thêm chương"
                    fields={formFields}
                    onSubmit={handleCreate}
                    onCancel={() => setAddOpen(false)}
                />
            )}

            {isEditOpen && editingRow && (
                <CrudForm
                    title="Sửa chương"
                    fields={formFields}
                    initialValues={editingRow}
                    onSubmit={handleUpdate}
                    onCancel={() => {
                        setEditOpen(false);
                        setEditingRow(null);
                    }}
                />
            )}

            <ToastContainer position="bottom-right" />
        </div>
    );
}

export default Chapters;
