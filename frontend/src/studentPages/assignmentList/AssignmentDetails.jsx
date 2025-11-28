import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet, apiPost } from "../../api/client";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    buildFileUrlFromUpload,
    normalizeFileUpload,
} from "../../ulities/fileHelpers";
import { FileOutlined } from "@ant-design/icons";
import EditorComponent from "../../components/editor/EditorComponent";

function AssignmentDetails() {
    const { assignmentId } = useParams();
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [content, setContent] = useState("");
    const [submission, setSubmission] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const isOverDue = assignment?.due_date
        ? new Date() > new Date(assignment.due_date)
        : false;

    async function fetchAssignmentDetails() {
        try {
            setLoading(true);
            const json = await apiGet(`api/assignments/${assignmentId}`);
            if (!json.success) {
                toast.error(json.message || "Không thể tải thông tin bài thực hành");
                return;
            }
            setAssignment(json.data || null);
        } catch (err) {
            toast.error("Lỗi khi kết nối server");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function fetchSubmission() {
        try {
            setLoading(true);
            const json = await apiGet(`api/submission-by-student/${assignmentId}`)
            if (!json.success) {
                toast.error(json.message || "Không thể lấy bài nộp");
                return;
            }
            setSubmission(json.data || null)
            setContent(json?.data?.content || "")
            if (json?.data?.status === "submitted") {
                setSubmitted(true)
            }
        } catch (err) {
            toast.error("Lỗi khi kết nối server")
            console.log(err);
        }
        finally {
            setLoading(false);
        }
    }

    async function handlerSubmitAssignment() {
        if (!file) {
            toast.warn("Vui lòng chọn file trước khi nộp!");
            return;
        }
        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append("file_upload", file);
            formData.append("content", content);
            const json = await apiPost(
                `api/submissions/${assignmentId}`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            if (!json.success) {
                toast.error(json.message || "Nộp bài thất bại");
                return;
            }
            toast.success(json.message || "Nộp bài thành công!");
            fetchSubmission()
            setFile(null);
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi gửi file lên server");
        } finally {
            setSubmitting(false);
        }
    }

    async function handlerUpdateSubmission() {
        const formData = new FormData();
        if (file) formData.append("file_upload", file);
        formData.append("content", content);

        const json = await apiPost(
            `api/submission/${assignmentId}/update`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            });

        if (!json.success) {
            toast.error(json.message || "Không thể cập nhật bài tập");
            return;
        }

        toast.success(json.message || "Cập nhật bài tập thành công");
        setSubmission(json.data);
        fetchSubmission()
        setFile(null);
    }

    useEffect(() => {
        fetchAssignmentDetails();
        fetchSubmission()
    }, [assignmentId]);

    const fileUpload = normalizeFileUpload(assignment?.file_upload);
    const fileUrl = buildFileUrlFromUpload(fileUpload);

    const studentFileUpload = normalizeFileUpload(submission?.file_upload);
    const studentFileUrl = buildFileUrlFromUpload(studentFileUpload);

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="max-w-8xl mx-auto">
                {loading ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">Đang tải thông tin bài thực hành...</p>
                    </div>
                ) : !assignment ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">Không tìm thấy bài thực hành.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="bg-white p-6 border-b border-gray-200 space-y-6">

                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
                            </div>


                            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                                <div>
                                    <span className="font-medium">Ngày giao:</span>{" "}
                                    {assignment.created_at
                                        ? new Date(assignment.created_at).toLocaleDateString("vi-VN")
                                        : "Không rõ"}
                                </div>
                                <div>
                                    <span className="font-medium">Hạn nộp:</span>{" "}
                                    {assignment.due_date
                                        ? new Date(assignment.due_date).toLocaleDateString("vi-VN")
                                        : "Không có hạn"}
                                </div>
                            </div>


                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">Mô tả bài thực hành</h2>
                                <p className="text-gray-700 leading-relaxed">
                                    {assignment.description || "Không có mô tả."}
                                </p>
                            </div>


                            {fileUrl && (
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Tài liệu từ giáo viên</h2>
                                    <button
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = fileUrl;
                                            link.download = fileUpload?.name || 'file_bai_thuc_hanh';
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }}
                                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                                    >
                                        <FileOutlined />
                                        <span>{fileUpload?.name || "Tệp bài thực hành"}</span>
                                    </button>
                                </div>
                            )}
                            {isOverDue && (
                                <div className="p-4 mb-4 text-red-700 bg-red-100 border border-red-300 rounded">
                                    Đã hết hạn nộp bài. Bạn không thể nộp bài mới.
                                </div>
                            )}

                        </div>


                        <div className="bg-white p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nội dung bài làm</h2>
                            <EditorComponent
                                value={content}
                                onChange={(newValue) => setContent(newValue)}
                            />
                        </div>


                        <div className="bg-white p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                {submitted ? "Bài đã nộp" : "Nộp bài thực hành"}
                            </h2>


                            {submitted && submission && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200">
                                    <div className="flex items-center gap-2 text-green-700 mb-2">
                                        <span className="font-medium">✓ Đã nộp bài thành công</span>
                                    </div>
                                    {submission.updated_at && (
                                        <p className="text-sm text-green-600 mb-3">
                                            Thời gian nộp: <strong>{new Date(submission.updated_at).toLocaleString("vi-VN")}</strong>
                                        </p>
                                    )}
                                    {studentFileUrl && (
                                        <button
                                            onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = studentFileUrl;
                                                link.download = studentFileUpload?.name || 'file_bai_nop';
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }}
                                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-sm p-2 border border-gray-200 rounded hover:bg-gray-50"
                                        >
                                            <FileOutlined />
                                            <span>File đã nộp: {studentFileUpload?.name || "Tệp bài nộp"}</span>
                                        </button>
                                    )}
                                </div>
                            )}


                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chọn file bài làm
                                    </label>
                                    <input
                                        type="file"
                                        disabled={isOverDue}
                                        onChange={(e) => setFile(e.target.files[0])}
                                        className="block w-full text-sm text-gray-700 border border-gray-300 p-2"
                                    />
                                    {file && (
                                        <p className="mt-2 text-sm text-gray-600">
                                            Đã chọn: <span className="font-medium">{file.name}</span>
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    {!submitted ? (
                                        <button
                                            onClick={handlerSubmitAssignment}
                                            disabled={submitting || isOverDue}
                                            className={`px-6 py-2 text-white transition ${submitting
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-blue-600 hover:bg-blue-700"
                                                }`}
                                        >
                                            {submitting ? "Đang nộp..." : "Nộp bài"}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handlerUpdateSubmission}
                                            disabled={submitting || isOverDue}
                                            className={`px-6 py-2 text-white transition ${submitting
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-blue-600 hover:bg-blue-700"
                                                }`}
                                        >
                                            {submitting ? "Đang cập nhật..." : "Cập nhật bài nộp"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ToastContainer position="bottom-right" autoClose={4000} />
        </div>
    );
}

export default AssignmentDetails;
