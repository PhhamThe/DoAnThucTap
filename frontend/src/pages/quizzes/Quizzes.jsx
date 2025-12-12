import React, { useEffect, useMemo, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DataTable from "../../components/DataTable";
import Pagination from "../../components/Pagination";
import CrudForm from "../../components/CrudForm";
import { apiGet, apiPost, apiPut, apiDelete } from "../../api/client";
import { useParams } from "react-router-dom";

function Quizzes() {
    const [quizList, setQuizList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;

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
                render: (row) => row.time_limit ?? "-",
            },
            {
                key: "start_time",
                header: "Bắt đầu",
                render: (row) => row.start_time ?? "-",
            },
            {
                key: "end_time",
                header: "Kết thúc",
                render: (row) => row.end_time ?? "-",
            }
        ],
        []
    );

    const formFields = useMemo(
        () => [
            { name: "title", label: "Tên đề thi", required: true },
            {
                name: "time_limit",
                label: "Thời gian (phút)",
                required: true,
                type: "number",
            },
            {
                name: "start_time",
                label: "Ngày giờ bắt đầu",
                required: true,
                type: "date",
            },
            {
                name: "end_time",
                label: "Ngày giờ kết thúc",
                required: true,
                type: "date",
            },
        ],
        []
    );




    async function fetchQuizzes() {
        try {
            setLoading(true);
            const json = await apiGet("api/quizzes", { page: currentPage, limit: itemsPerPage, class_id: classId });

            if (json?.success === false) {
                toast.error(json?.message || "Không thể lấy danh sách đề thi");
                return;
            }
            const container = json?.data ?? {};
            const items = container?.data ?? [];
            setQuizList(items);
            setTotalPages(container?.last_page ?? 1);
        } catch (err) {
            toast.error("Lỗi khi lấy danh sách đề thi");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }



    useEffect(() => {
        fetchQuizzes();
    }, [currentPage]);

    const handlePageChange = (page) => setCurrentPage(page);


    async function handleCreate(data) {
        try {
            const dataMore = { ...data, class_id: classId }
            const json = await apiPost("api/quizzes", dataMore);
            toast.success(json?.message || "Tạo đề thi thành công");
            await fetchQuizzes();
            setAddOpen(false);
        } catch (err) {
            toast.error("Lỗi khi tạo đề thi");
        }
    }


    async function handleUpdate(data) {
        if (!editingQuiz?.id) return toast.error("Không có đề thi đang sửa");
        try {
            const dataMore = { ...data, class_id: classId }
            const json = await apiPut(`api/quizzes/${editingQuiz.id}`, dataMore);
            toast.success(json?.message || "Cập nhật thành công");
            await fetchQuizzes();
            setEditOpen(false);
            setEditingQuiz(null);
        } catch {
            toast.error("Lỗi khi cập nhật đề thi");
        }
    }


    async function handleDelete(row) {
        if (!window.confirm("Bạn có chắc muốn xóa đề thi này?")) return;
        try {
            const json = await apiDelete(`api/quizzes/${row.id}`);
            if (json?.success === false) {
                toast.error(json?.message || "Xóa thất bại");
                return;
            }
            toast.success(json?.message || "Xóa đề thi thành công");
            setQuizList((prev) => prev.filter((item) => item.id !== row.id));
        } catch {
            toast.error("Lỗi khi xóa đề thi");
        }
    }

    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold">Quản lý đề thi</h2>
                <button onClick={() => setAddOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                    Thêm đề thi
                </button>
            </div>

            <DataTable
                columns={columns}
                data={quizList}
                loading={loading}
                emptyMessage="Chưa có đề thi"
                rowIndexBase={(currentPage - 1) * itemsPerPage}
                onEdit={(row) => {
                    const formatDate = (d) => d?.split("T")[0] ?? "";
                    setEditingQuiz({
                        ...row,
                        start_time: formatDate(row.start_time),
                        end_time: formatDate(row.end_time),
                    });
                    setEditOpen(true);
                }}

                onDelete={handleDelete}
            />

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

            {isAddOpen && (
                <CrudForm
                    title="Thêm đề thi"
                    fields={formFields}
                    onSubmit={handleCreate}
                    onCancel={() => setAddOpen(false)}
                    submitLabel="Lưu"
                />
            )}

            {isEditOpen && editingQuiz && (
                <CrudForm
                    title="Sửa đề thi"
                    fields={formFields}
                    initialValues={editingQuiz}
                    onSubmit={handleUpdate}
                    onCancel={() => {
                        setEditOpen(false);
                        setEditingQuiz(null);
                    }}
                    submitLabel="Cập nhật"
                />
            )}

            <ToastContainer position="bottom-right" autoClose={5000} />
        </div>
    );
}

export default Quizzes;
