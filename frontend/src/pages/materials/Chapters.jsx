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
    const [groupedChapters, setGroupedChapters] = useState({});
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;
    const [viewMode, setViewMode] = useState('table'); // 'table' hoặc 'list'
    const [allTeachersData, setAllTeachersData] = useState([]); // Dữ liệu tất cả giáo viên

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
            {
                key: 'is_public', header: 'Trạng thái',
                render: (row) => row.is_public === 1 ? 'Công khai' : 'Riêng tư'
            }
        ],
        []
    );

    const formFields = useMemo(
        () => [
            { name: 'title', label: 'Tên chương', required: true },
            { name: 'description', label: 'Mô tả', type: 'textarea' },
            { name: 'content', label: 'Nội dung', type: 'textarea' },
            { name: 'video_url', label: 'Video', type: 'file' },
            { name: 'attachment', label: 'Tài liệu', type: 'file' },
            { name: 'is_public', label: 'Công khai?', type: 'checkbox' }
        ],
        []
    );

    useEffect(() => {
        void fetchChapters();
        void fetchAllTeachersChapters(); // Lấy dữ liệu tất cả giáo viên
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

    async function fetchAllTeachersChapters() {
        try {
            const json = await apiGet(`api/chapters/all-teachers/${classId}`);

            if (json?.success) {
                const teachers = json.data?.teachers || []; // Lấy từ data.teachers

                const currentTeacher = teachers.find(
                    teacher => teacher.teacher_id === json.data.current_teacher_id
                ) || { chapters: [] };

                const otherTeachers = teachers.filter(
                    teacher => teacher.teacher_id !== json.data.current_teacher_id
                );

                setGroupedChapters({
                    currentTeacher,
                    otherTeachers
                });
                setAllTeachersData(otherTeachers);
            }
        } catch (err) {
            console.error('Lỗi khi lấy dữ liệu giáo viên:', err);
            toast.error('Không thể lấy dữ liệu từ giáo viên khác');
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
            await fetchAllTeachersChapters(); // Cập nhật lại danh sách

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
            await fetchAllTeachersChapters(); // Cập nhật lại danh sách

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
            await fetchAllTeachersChapters(); // Cập nhật lại danh sách
        } catch (err) {
            toast.error('Lỗi khi xóa chương');
        }
    }

    const handlePageChange = (page) => setCurrentPage(page);

    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold">Quản lý chương</h2>
                <div className="flex gap-4 items-center">
                    {/* Toggle chế độ xem */}
                    <div className="flex border border-gray-300 rounded-sm overflow-hidden">
                        <button
                            className={`px-4 py-2 ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                            onClick={() => setViewMode('table')}
                        >
                            Bảng
                        </button>
                        <button
                            className={`px-4 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                            onClick={() => setViewMode('list')}
                        >
                            Danh sách
                        </button>
                    </div>
                    <button
                        onClick={() => setAddOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Thêm chương
                    </button>
                </div>
            </div>

            {/* Chế độ xem bảng */}
            {viewMode === 'table' && (
                <>
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
                </>
            )}

            {/* Chế độ xem danh sách theo giáo viên */}
            {viewMode === 'list' && (
                <div className="space-y-8">
                    <div className="bg-white p-6">
                        <h3 className="text-lg font-semibold mb-4 text-blue-600">
                            Chương của bạn
                        </h3>
                        {chapterList.length === 0 ? (
                            <p className="text-gray-500 italic">Bạn chưa tạo chương nào</p>
                        ) : (
                            <ul className="space-y-3">
                                {chapterList.map((chapter, index) => (
                                    <li key={chapter.id} className="border-l-4 border-blue-500 pl-4 py-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium">{chapter.title}</h4>
                                                {chapter.description && (
                                                    <p className="text-gray-600 text-sm mt-1">{chapter.description}</p>
                                                )}
                                            </div>

                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Phần chương của các giáo viên khác */}
                    <div className="bg-white  p-6">
                        {allTeachersData.length > 0 && (
                            <div className="space-y-6">
                                {allTeachersData.map((teacherGroup) => (
                                    <div key={teacherGroup.teacher_id} className="p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div>
                                                <h4 className="font-semibold text-lg">{teacherGroup.teacher_name || 'Không rõ'}</h4>
                                            </div>
                                        </div>

                                        {(!teacherGroup.chapters || teacherGroup.chapters.length === 0) ? (
                                            <p className="text-gray-500 italic pl-13">Giáo viên này chưa tạo chương nào</p>
                                        ) : (
                                            <ul className="space-y-2">
                                                {teacherGroup.chapters.map((chapter) => (
                                                    <li key={chapter.id} className="flex items-center justify-between ">
                                                        <div className="flex-1">
                                                            <span className="font-medium">{chapter.title}</span>
                                                            {chapter.description && (
                                                                <p className="text-gray-600 text-sm mt-1">{chapter.description}</p>
                                                            )}
                                                            <div className="flex gap-4 text-sm text-gray-500 mt-1">
                                                                <span>Lớp: {chapter.class_name}</span>
                                                                <span>Ngày tạo: {new Date(chapter.created_at).toLocaleDateString('vi-VN')}</span>
                                                            </div>
                                                        </div>
                                                        {/* <button
                                                            onClick={() => navigate(`/admin/chapter_details/${chapter.id}`)}
                                                            className="text-sm px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded ml-4"
                                                        >
                                                            Xem chi tiết
                                                        </button> */}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal thêm/sửa */}
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