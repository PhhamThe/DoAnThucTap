import React, { useEffect, useMemo, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DataTable from "../../components/DataTable";
import Pagination from "../../components/Pagination";
import CrudForm from "../../components/CrudForm";
import { apiGet, apiPost, apiPut, apiDelete } from "../../api/client";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function Quizzes() {
    const [quizList, setQuizList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;
    const navigate = useNavigate();
    const [isAddOpen, setAddOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState(null);
    const { classId } = useParams();

    const columns = useMemo(
        () => [
            { key: "title", header: "Tên đề thi", render: (row) => row.title ?? "-" },
            {
                key: "time_limit",
                header: "Thời gian (phút)",
                render: (row) => `${row.time_limit ?? 0} phút`,
            },
            {
                key: "start_time",
                header: "Thời gian bắt đầu",
                render: (row) => {
                    if (!row.start_time) return "-";
                    const date = new Date(row.start_time);
                    return date.toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                },
            },
            {
                key: "end_time",
                header: "Thời gian kết thúc",
                render: (row) => {
                    if (!row.end_time) return "Không giới hạn";
                    const date = new Date(row.end_time);
                    return date.toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                },
            },
            {
                key: "status",
                header: "Trạng thái",
                render: (row) => {
                    if (!row.start_time) return "Chưa thiết lập";

                    const now = new Date();
                    const startTime = new Date(row.start_time);
                    const endTime = row.end_time ? new Date(row.end_time) : null;

                    if (now < startTime) {
                        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Sắp diễn ra</span>;
                    } else if (endTime && now > endTime) {
                        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Đã kết thúc</span>;
                    } else {
                        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Đang diễn ra</span>;
                    }
                },
            }
        ],
        []
    );

    const formFields = useMemo(
        () => [
            {
                name: "title",
                label: "Tên đề thi",
                required: true,
                placeholder: "Nhập tên đề thi..."
            },
            {
                name: "time_limit",
                label: "Thời gian làm bài (phút)",
                required: true,
                type: "number",
                min: 1,
                max: 180,
                placeholder: "Nhập thời gian làm bài...",
                helpText: "Thời gian tối đa: 180 phút (3 tiếng)"
            },
            {
                name: "start_time",
                label: "Thời điểm bắt đầu làm bài",
                required: true,
                type: "datetime-local",
                helpText: "Thời gian học sinh có thể bắt đầu làm bài"
            },
        ],
        []
    );

    async function fetchQuizzes() {
        try {
            setLoading(true);
            const json = await apiGet("api/quizzes", {
                page: currentPage,
                limit: itemsPerPage,
                class_id: classId
            });

            if (json?.success === false) {
                toast.error(json?.message || "Không thể lấy danh sách đề thi");
                return;
            }

            const container = json?.data ?? {};
            const items = container?.data ?? [];

            const enhancedItems = items.map(quiz => {
                if (quiz.start_time && quiz.time_limit) {
                    const startTime = new Date(quiz.start_time);
                    const endTime = new Date(startTime.getTime() + (quiz.time_limit * 60000));
                    return {
                        ...quiz,
                        end_time: endTime.toISOString(),
                        status: calculateStatus(quiz)
                    };
                }
                return {
                    ...quiz,
                    status: calculateStatus(quiz)
                };
            });

            setQuizList(enhancedItems);
            setTotalPages(container?.last_page ?? 1);
        } catch (err) {
            toast.error("Lỗi khi lấy danh sách đề thi");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const calculateStatus = (quiz) => {
        if (!quiz.start_time) return "Chưa thiết lập";

        const now = new Date();
        const startTime = new Date(quiz.start_time);

        if (quiz.time_limit) {
            const endTime = new Date(startTime.getTime() + (quiz.time_limit * 60000));
            if (now < startTime) return "upcoming";
            if (now > endTime) return "ended";
            return "active";
        } else {
            if (now < startTime) return "upcoming";
            return "active";
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, [currentPage, classId]);

    const handlePageChange = (page) => setCurrentPage(page);

    // Format datetime-local thành Y-m-d H:i:s (giữ nguyên múi giờ)
    const formatDateTimeForAPI = (datetimeLocal) => {
        if (!datetimeLocal) return null;

        // Tạo date object từ input (đã là local time)
        const date = new Date(datetimeLocal);

        // Lấy các phần tử theo múi giờ địa phương
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        // Tạo chuỗi Y-m-d H:i:s (không chuyển đổi múi giờ)
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    // Format từ API sang datetime-local (cho form chỉnh sửa)
    const formatDateTimeFromAPI = (apiDateTime) => {
        if (!apiDateTime) return '';

        const date = new Date(apiDateTime);

        // Lấy các phần tử theo múi giờ địa phương
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        // Tạo chuỗi cho input datetime-local: YYYY-MM-DDTHH:mm
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    async function handleCreate(data) {
        try {
            const formattedData = {
                ...data,
                class_id: classId,
                start_time: formatDateTimeForAPI(data.start_time)
            };

            const json = await apiPost("api/quizzes", formattedData);

            if (json?.success === false) {
                toast.error(json?.message || "Tạo đề thi thất bại");
                return;
            }

            toast.success(json?.message || "Tạo đề thi thành công");
            await fetchQuizzes();
            setAddOpen(false);
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || "Lỗi khi tạo đề thi");
        }
    }

    async function handleUpdate(data) {
        if (!editingQuiz?.id) return toast.error("Không có đề thi đang sửa");

        try {
            const formattedData = {
                ...data,
                class_id: classId,
                start_time: formatDateTimeForAPI(data.start_time)
            };

            const json = await apiPut(`api/quizzes/${editingQuiz.id}`, formattedData);

            if (json?.success === false) {
                toast.error(json?.message || "Cập nhật thất bại");
                return;
            }

            toast.success(json?.message || "Cập nhật thành công");
            await fetchQuizzes();
            setEditOpen(false);
            setEditingQuiz(null);
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || "Lỗi khi cập nhật đề thi");
        }
    }

    async function handleDelete(row) {
        if (!window.confirm(`Bạn có chắc muốn xóa đề thi "${row.title}"?`)) return;

        try {
            const json = await apiDelete(`api/quizzes/${row.id}`);
            if (json?.success === false) {
                toast.error(json?.message || "Xóa thất bại");
                return;
            }
            toast.success(json?.message || "Xóa đề thi thành công");
            setQuizList((prev) => prev.filter((item) => item.id !== row.id));
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi xóa đề thi");
        }
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Quản lý đề thi</h1>
                <p className="text-gray-600">Quản lý các đề thi trong lớp học</p>
            </div>

            <DataTable
                columns={columns}
                data={quizList}
                loading={loading}
                onView={(row) => navigate(`/admin/create-quiz/${row.id}`)}
                emptyMessage="Chưa có đề thi nào"
                rowIndexBase={(currentPage - 1) * itemsPerPage}
                onEdit={(row) => {
                    setEditingQuiz({
                        ...row,
                        start_time: formatDateTimeFromAPI(row.start_time),
                    });
                    setEditOpen(true);
                }}
                onDelete={handleDelete}
                headerActions={
                    <button
                        onClick={() => setAddOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Thêm đề thi
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
                    title="Thêm đề thi mới"
                    fields={formFields}
                    onSubmit={handleCreate}
                    onCancel={() => setAddOpen(false)}
                    submitLabel="Tạo đề thi"
                    cancelLabel="Hủy"
                    size="lg"
                />
            )}

            {isEditOpen && editingQuiz && (
                <CrudForm
                    title="Chỉnh sửa đề thi"
                    fields={formFields}
                    initialValues={editingQuiz}
                    onSubmit={handleUpdate}
                    onCancel={() => {
                        setEditOpen(false);
                        setEditingQuiz(null);
                    }}
                    submitLabel="Cập nhật"
                    cancelLabel="Hủy"
                    size="lg"
                />
            )}

            <ToastContainer
                position="bottom-right"
                autoClose={5000}
                theme="colored"
            />
        </div>
    );
}

export default Quizzes;