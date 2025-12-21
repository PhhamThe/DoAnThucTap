import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import CrudForm from '../../components/CrudForm';
import { apiDelete, apiGet, apiPost, apiPut } from '../../api/client';

function GradeRule() {
    const [ruleList, setRuleList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [isAddOpen, setAddOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);

    const columns = useMemo(
        () => [
            {
                key: 'subject_name',
                header: 'Môn học',
                render: (row) => row.subject?.name ?? row.data?.subject?.name ?? '-',
            },
            {
                key: 'class_name',
                header: 'Lớp học',
                render: (row) => {
                    if (row.class) {
                        return row.class?.name ?? row.data?.class?.name ?? '-';
                    }
                    return <span className="text-gray-500">(Áp dụng cho tất cả lớp)</span>;
                },
            },
            {
                key: 'pass_grade',
                header: 'Điểm đậu',
                render: (row) => {
                    const grade = row.pass_grade ?? row.data?.pass_grade;
                    return grade ? `${grade}/10` : '-';
                },
            },
            {
                key: 'video_requirement',
                header: 'Yêu cầu video',
                render: (row) => {
                    const required = row.require_video_progress ?? row.data?.require_video_progress;
                    const progress = row.min_video_progress ?? row.data?.min_video_progress;
                    
                    if (!required) return <span className="text-gray-500">Không yêu cầu</span>;
                    return <span className="text-blue-600">Xem &gt; {progress}%</span>;
                },
            },
            {
                key: 'weights',
                header: 'Trọng số',
                render: (row) => {
                    const weights = row.weights ?? row.data?.weights;
                    if (!weights || typeof weights !== 'object') return '-';
                    
                    return (
                        <div className="text-sm">
                            {Object.entries(weights).map(([key, value]) => (
                                <div key={key} className="flex justify-between gap-4">
                                    <span className="text-gray-600 capitalize">{key}:</span>
                                    <span className="font-medium">{value}%</span>
                                </div>
                            ))}
                        </div>
                    );
                },
            },
            {
                key: 'status',
                header: 'Trạng thái',
                render: (row) => {
                    const isActive = row.is_active ?? row.data?.is_active;
                    return isActive ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Hoạt động
                        </span>
                    ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Không hoạt động
                        </span>
                    );
                },
            },
        ],
        []
    );

    const formFields = useMemo(
        () => [
            { 
                name: 'subject_id', 
                label: 'Môn học', 
                type: 'select', 
                options: subjects,
                required: true,
                placeholder: 'Chọn môn học'
            },
            { 
                name: 'class_id', 
                label: 'Lớp học', 
                type: 'select', 
                options: [{ value: '', label: 'Áp dụng cho tất cả lớp' }, ...classes],
                placeholder: 'Chọn lớp học (tùy chọn)'
            },
            { 
                name: 'pass_grade', 
                label: 'Điểm đậu tối thiểu (0-10)', 
                type: 'number',
                required: true,
                min: 0,
                max: 10,
                step: 0.1,
                defaultValue: 5.0
            },
            
            // --- Cấu hình điểm thành phần ---
            { 
                name: 'weight_attendance', 
                label: 'Trọng số Chuyên cần (%)', 
                type: 'number',
                required: true,
                min: 0,
                max: 100,
                step: 1,
                defaultValue: 10
            },
            { 
                name: 'weight_assignment', 
                label: 'Trọng số Bài tập (%)', 
                type: 'number',
                required: true,
                min: 0,
                max: 100,
                step: 1,
                defaultValue: 20
            },
            { 
                name: 'weight_midterm', 
                label: 'Trọng số Giữa kỳ (%)', 
                type: 'number',
                required: true,
                min: 0,
                max: 100,
                step: 1,
                defaultValue: 20
            },
            { 
                name: 'weight_final', 
                label: 'Trọng số Cuối kỳ (%)', 
                type: 'number',
                required: true,
                min: 0,
                max: 100,
                step: 1,
                defaultValue: 50
            },
            {
                name: 'total_weight',
                label: 'Tổng trọng số',
                type: 'info',
                render: (values) => {
                    const total = 
                        (Number(values.weight_attendance) || 0) +
                        (Number(values.weight_assignment) || 0) +
                        (Number(values.weight_midterm) || 0) +
                        (Number(values.weight_final) || 0);
                    
                    const isValid = total === 100;
                    
                    return (
                        <div className={`font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                            {total}% {isValid ? '✅' : '❌'}
                            {!isValid && <div className="text-sm font-normal mt-1">Phải bằng 100%</div>}
                        </div>
                    );
                }
            },
            
            // --- Điều kiện thi ---
            { 
                name: 'require_video_progress', 
                label: 'Yêu cầu tiến độ video để thi cuối kỳ', 
                type: 'checkbox',
                defaultValue: false
            },
            { 
                name: 'min_video_progress', 
                label: 'Tiến độ video tối thiểu (%)', 
                type: 'number',
                min: 0,
                max: 100,
                step: 1,
                defaultValue: 80,
                condition: (values) => values.require_video_progress === true || values.require_video_progress === '1'
            },
            { 
                name: 'min_assignments', 
                label: 'Số bài tập phải nộp tối thiểu', 
                type: 'number',
                min: 0,
                defaultValue: 4
            },
            { 
                name: 'min_attendance_rate', 
                label: 'Tỷ lệ chuyên cần tối thiểu (%)', 
                type: 'number',
                min: 0,
                max: 100,
                defaultValue: 80
            },
            
            // --- Khác ---
            {
                name: 'is_active',
                label: 'Trạng thái',
                type: 'select',
                options: [
                    { value: 1, label: 'Đang hoạt động' },
                    { value: 0, label: 'Không hoạt động' }
                ],
                defaultValue: 1
            },
            { 
                name: 'notes', 
                label: 'Ghi chú', 
                type: 'textarea',
                rows: 3,
                placeholder: 'Nhập ghi chú nếu có...'
            }
        ],
        [subjects, classes]
    );

    useEffect(() => {
        void fetchRules();
    }, [currentPage]);

    useEffect(() => {
        void fetchSubjects();
        void fetchClasses();
    }, []);

    // Lấy danh sách quy tắc điểm
    async function fetchRules() {
        try {
            setLoading(true);
            const json = await apiGet('api/grade-rules', { page: currentPage, limit: itemsPerPage });
            if (json?.success === false) {
                toast.error(json?.message || 'Không thể lấy danh sách quy tắc điểm');
                return;
            }
            const container = json?.data ?? {};
            const items = Array.isArray(container) ? container : container?.data ?? [];
            const lastPage = container?.last_page ?? 1;
            setRuleList(items);
            setTotalPages(lastPage);
        } catch (err) {
            toast.error('Không thể lấy danh sách quy tắc điểm');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // Lấy danh sách môn học
    async function fetchSubjects() {
        try {
            const json = await apiGet('api/subjects', { page: 1, limit: 1000 });
            if (json?.success === false) return;
            const container = json?.data ?? {};
            const items = Array.isArray(container) ? container : container?.data ?? [];
            const subjectOptions = items.map(subject => ({
                value: subject.id,
                label: `${subject.code} - ${subject.name}`
            }));
            setSubjects(subjectOptions);
        } catch (err) {
            console.error('Fetch subjects error:', err);
        }
    }

    // Lấy danh sách lớp học
    async function fetchClasses() {
        try {
            const json = await apiGet('api/classes', { page: 1, limit: 1000 });
            if (json?.success === false) return;
            const container = json?.data ?? {};
            const items = Array.isArray(container) ? container : container?.data ?? [];
            const classOptions = items.map(cls => ({
                value: cls.id,
                label: `${cls.name} - ${cls.subject?.name || cls.subject?.data?.name || ''}`
            }));
            setClasses(classOptions);
        } catch (err) {
            console.error('Fetch classes error:', err);
        }
    }

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Tạo quy tắc điểm mới
    async function handleCreate(data) {
        try {
            // Tính tổng trọng số
            const totalWeight = 
                (Number(data.weight_attendance) || 0) +
                (Number(data.weight_assignment) || 0) +
                (Number(data.weight_midterm) || 0) +
                (Number(data.weight_final) || 0);
            
            if (Math.abs(totalWeight - 100) > 0.01) {
                toast.error('Tổng trọng số phải bằng 100%');
                return;
            }

            // Tạo object weights
            const weights = {
                attendance: Number(data.weight_attendance),
                assignment: Number(data.weight_assignment),
                midterm: Number(data.weight_midterm),
                final: Number(data.weight_final)
            };

            // Chuẩn bị payload
            const payload = {
                subject_id: Number(data.subject_id),
                class_id: data.class_id ? Number(data.class_id) : null,
                pass_grade: Number(data.pass_grade),
                require_video_progress: data.require_video_progress === true || data.require_video_progress === 'true' || data.require_video_progress === '1',
                min_video_progress: data.require_video_progress && data.min_video_progress ? Number(data.min_video_progress) : null,
                min_assignments: Number(data.min_assignments) || 0,
                min_attendance_rate: Number(data.min_attendance_rate) || 0,
                weights: weights,
                is_active: data.is_active === '1' || data.is_active === 1,
                notes: data.notes || null
            };
            
            const json = await apiPost('api/grade-rules', payload);
            toast.success(json?.message || 'Tạo quy tắc điểm thành công');

            const created = json?.data;
            if (created?.id) {
                setRuleList((prev) => [created, ...prev]);
            } else {
                await fetchRules();
            }
            setAddOpen(false);
        } catch (err) {
            if (err.response?.data) {
                const data = err.response.data;
                if (data?.errors) {
                    Object.values(data.errors).forEach((errs) => toast.error(errs[0]));
                    return;
                }
                toast.error(data?.message || 'Lỗi khi tạo quy tắc điểm');
                return;
            }
            toast.error('Lỗi khi tạo quy tắc điểm');
            console.error(err);
        }
    }

    // Cập nhật quy tắc điểm
    async function handleUpdate(data) {
        if (!editingRow?.id) return toast.error('Không có quy tắc điểm đang sửa');
        try {
            // Tính tổng trọng số
            const totalWeight = 
                (Number(data.weight_attendance) || 0) +
                (Number(data.weight_assignment) || 0) +
                (Number(data.weight_midterm) || 0) +
                (Number(data.weight_final) || 0);
            
            if (Math.abs(totalWeight - 100) > 0.01) {
                toast.error('Tổng trọng số phải bằng 100%');
                return;
            }

            // Tạo object weights
            const weights = {
                attendance: Number(data.weight_attendance),
                assignment: Number(data.weight_assignment),
                midterm: Number(data.weight_midterm),
                final: Number(data.weight_final)
            };

            // Chuẩn bị payload
            const payload = {
                subject_id: Number(data.subject_id),
                class_id: data.class_id ? Number(data.class_id) : null,
                pass_grade: Number(data.pass_grade),
                require_video_progress: data.require_video_progress === true || data.require_video_progress === 'true' || data.require_video_progress === '1',
                min_video_progress: data.require_video_progress && data.min_video_progress ? Number(data.min_video_progress) : null,
                min_assignments: Number(data.min_assignments) || 0,
                min_attendance_rate: Number(data.min_attendance_rate) || 0,
                weights: weights,
                is_active: data.is_active === '1' || data.is_active === 1,
                notes: data.notes || null
            };
            
            const json = await apiPut(`api/grade-rules/${editingRow.id}`, payload);
            toast.success(json?.message || 'Cập nhật quy tắc điểm thành công');

            const updated = json?.data;
            if (updated?.id) {
                setRuleList((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
            } else {
                await fetchRules();
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
                toast.error(data?.message || 'Lỗi khi cập nhật quy tắc điểm');
                return;
            }
            toast.error('Lỗi khi cập nhật quy tắc điểm');
            console.error(err);
        }
    }

    // Xóa quy tắc điểm
    async function handleDelete(row) {
        const ok = window.confirm('Bạn có chắc muốn xóa quy tắc điểm này?');
        if (!ok) return;
        try {
            const json = await apiDelete(`api/grade-rules/${row.id}`);
            if (json?.success === false) {
                toast.error(json?.message || 'Xóa thất bại');
                return;
            }
            toast.success(json?.message || 'Xóa quy tắc điểm thành công');
            setRuleList((prev) => prev.filter((item) => item.id !== row.id));
        } catch (err) {
            toast.error('Lỗi khi xóa quy tắc điểm');
            console.error(err);
        }
    }

    // Chuẩn bị dữ liệu cho form
    const prepareFormData = (row) => {
        const weights = row.weights ?? row.data?.weights;
        
        return {
            ...row,
            subject_id: row.subject_id ?? row.data?.subject_id ?? '',
            class_id: row.class_id ?? row.data?.class_id ?? '',
            weight_attendance: weights?.attendance ?? 10,
            weight_assignment: weights?.assignment ?? 20,
            weight_midterm: weights?.midterm ?? 20,
            weight_final: weights?.final ?? 50,
            require_video_progress: row.require_video_progress ?? row.data?.require_video_progress ? '1' : '0',
            min_video_progress: row.min_video_progress ?? row.data?.min_video_progress ?? 80,
            min_assignments: row.min_assignments ?? row.data?.min_assignments ?? 4,
            min_attendance_rate: row.min_attendance_rate ?? row.data?.min_attendance_rate ?? 80,
            is_active: row.is_active ?? row.data?.is_active ? '1' : '0',
            notes: row.notes ?? row.data?.notes ?? ''
        };
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Quản lý Quy tắc Điểm</h1>
            
            <DataTable
                columns={columns}
                data={ruleList}
                loading={loading}
                emptyMessage="Chưa có quy tắc điểm nào"
                rowIndexBase={(currentPage - 1) * itemsPerPage}
                onEdit={(row) => {
                    const normalized = prepareFormData(row);
                    setEditingRow(normalized);
                    setEditOpen(true);
                }}
                onDelete={handleDelete}
                headerActions={
                    <button
                        onClick={() => setAddOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Thêm quy tắc điểm
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
                    title="Thêm quy tắc điểm"
                    fields={formFields}
                    onSubmit={handleCreate}
                    onCancel={() => setAddOpen(false)}
                    submitLabel="Tạo mới"
                />
            )}

            {isEditOpen && editingRow && (
                <CrudForm
                    title="Sửa quy tắc điểm"
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

export default GradeRule;