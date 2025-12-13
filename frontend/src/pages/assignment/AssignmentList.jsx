import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import CrudForm from '../../components/CrudForm';
import { apiDelete, apiGet, apiPost } from '../../api/client';
import { useNavigate, useParams } from 'react-router-dom';
import { normalizeFileUpload, buildFileUrlFromUpload, buildFormData } from '../../ulities/fileHelpers';

function AssignmentList() {
    const [assignmentList, setAssignmentList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;

    const [isAddOpen, setAddOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);

    const navigate = useNavigate();
    const { classId } = useParams(); // lấy classId từ URL

    const columns = useMemo(
        () => [
            {
                key: 'title',
                header: 'Tiêu đề',
                render: (row) => row.title ?? row.data?.title ?? '-'
            },
            {
                key: 'due_date',
                header: 'Hạn nộp',
                render: (row) =>
                    row.due_date
                        ? new Date(row.due_date).toLocaleString('vi-VN')
                        : '-'
            },
            {
                key: 'file_upload',
                header: 'File đính kèm',
                render: (row) => {
                    const fu = normalizeFileUpload(row.file_upload);
                    if (!fu) return 'Không có file';

                    const url = buildFileUrlFromUpload(fu);
                    const name = fu.name || 'Tệp';
                    if (!url) return name;

                    return (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-sm">
                            Xem — {name}
                        </a>
                    );
                }
            },
            {
                key: 'actions',
                header: '',
                render: (row) => (
                    <button
                        className="p-2 bg-blue-500 text-white rounded-lg"
                        onClick={() => navigate(`/admin/assignment-detail/${row.id}`)}
                    >
                        Xem
                    </button>
                )
            }
        ],
        []
    );


    const formFields = [
        { name: 'title', label: 'Tên bài tập', required: true },
        { name: 'due_date', label: 'Hạn nộp', type: 'date', required: true },
        { name: 'description', type: 'textarea', label: 'Mô tả', required: true },
        { name: 'file_upload', label: 'File đính kèm', type: 'file' }
    ];


    useEffect(() => {
        void fetchAssignments();
    }, [currentPage]);

    async function fetchAssignments() {
        try {
            setLoading(true);
            const json = await apiGet(`api/teacher_assignment_list/${classId}`, {
                page: currentPage,
                limit: itemsPerPage
            });

            if (json?.success === false) {
                toast.error(json.message || 'Không thể lấy danh sách bài tập');
                return;
            }

            const container = json?.data ?? [];
            const items = Array.isArray(container) ? container : container?.data ?? [];
            const lastPage = container?.last_page ?? 1;

            setAssignmentList(items);
            setTotalPages(lastPage);
        } catch (err) {
            toast.error('Không thể lấy danh sách bài tập');
        } finally {
            setLoading(false);
        }
    }


    async function handleCreate(data) {
        try {
            const formData = buildFormData({
                ...data,
                class_id: classId // GÁN classId từ URL
            });

            const json = await apiPost('api/assignments', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (json?.success === false) {
                if (json?.errors)
                    Object.values(json.errors).forEach((e) => toast.warn(e[0]));
                return;
            }

            toast.success(json?.message || 'Tạo bài tập thành công');
            await fetchAssignments();
            setAddOpen(false);
        } catch (err) {
            toast.error('Lỗi khi tạo bài tập');
        }
    }


    async function handleUpdate(data) {
        if (!editingRow?.id) return toast.error('Không có bài tập đang sửa');

        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('description', data.description);
            formData.append('due_date', data.due_date);
            formData.append('class_id', classId); // gán lại đúng class

            if (data.file_upload instanceof File) {
                formData.append('file_upload', data.file_upload);
            }

            const json = await apiPost(
                `api/assignments/${editingRow.id}?_method=PUT`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            if (json?.success === false) {
                toast.error(json?.message || 'Cập nhật thất bại');
                return;
            }

            toast.success('Cập nhật thành công');
            await fetchAssignments();
            setEditOpen(false);
            setEditingRow(null);
        } catch {
            toast.error('Lỗi khi sửa bài tập');
        }
    }

 
    async function handleDelete(row) {
        if (!window.confirm('Bạn có chắc muốn xóa bài tập này?')) return;
        try {
            const json = await apiDelete(`api/assignments/${row.id}`);
            if (json?.success === false) {
                toast.error(json.message || 'Xóa thất bại');
                return;
            }
            toast.success('Xóa bài tập thành công');
            setAssignmentList((prev) => prev.filter((x) => x.id !== row.id));
        } catch {
            toast.error('Lỗi khi xóa');
        }
    }

    return (
        <div className="p-6">
           
            <DataTable
                columns={columns}
                data={assignmentList}
                loading={loading}
                emptyMessage="Chưa có bài tập nào"
                onEdit={(row) => {
                    const d = row.due_date ? new Date(row.due_date) : null;
                    const formattedDate = d ? d.toISOString().slice(0, 10) : '';

                    setEditingRow({
                        ...row,
                        due_date: formattedDate
                    });
                    setEditOpen(true);
                }}
                onDelete={handleDelete}
                 headerActions={
                    <button
                        onClick={() => setAddOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Thêm bài tập
                    </button>
                }
            />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => setCurrentPage(p)}
            />

            {isAddOpen && (
                <CrudForm
                    title="Thêm bài tập"
                    fields={formFields}
                    onSubmit={handleCreate}
                    onCancel={() => setAddOpen(false)}
                    submitLabel="Lưu thay đổi"
                />
            )}

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

            <ToastContainer position="bottom-right" autoClose={5000} />
        </div>
    );
}

export default AssignmentList;
