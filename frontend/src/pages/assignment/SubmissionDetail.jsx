import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet } from "../../api/client";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { buildFileUrlFromUpload, normalizeFileUpload } from "../../ulities/fileHelpers";
import { FileOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import EditorComponent from "../../components/editor/EditorComponent";

function SubmissionDetail() {
    const { submissionId, studentId } = useParams();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(false);
    const urlDownload = import.meta.env.VITE_API_ENDPOINT + 'download';
    console.log('urldowload', urlDownload)
    async function fetchSubmissionDetail() {
        try {
            setLoading(true);
            const json = await apiGet(`api/submission_detail_by_teacher/${submissionId}?student_id=${studentId}`);
            if (!json.success) {
                toast.error(json.message || "Không thể tải thông tin bài nộp");
                return;
            }
            setSubmission(json.data || null);
        } catch (err) {
            toast.error("Lỗi khi kết nối server");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (submissionId) {
            fetchSubmissionDetail();
        }
    }, [submissionId, studentId]);

    if (loading) {
        return (
            <div className="p-6 text-center py-8">
                <p className="text-gray-500">Đang tải thông tin bài nộp...</p>
            </div>
        );
    }

    if (!submission) {
        return (
            <div className="p-6 text-center py-8">
                <p className="text-gray-500">Không tìm thấy bài nộp.</p>
            </div>
        );
    }


    const studentFileUpload = normalizeFileUpload(submission.file_upload);
    const studentFileUrl = buildFileUrlFromUpload(studentFileUpload);

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="max-w-8xl mx-auto">

                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
                    >
                        <ArrowLeftOutlined />
                        <span>Quay lại</span>
                    </button>

                    <div className="bg-white p-6 border-b border-gray-200">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Chi tiết bài nộp
                        </h1>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div>
                                <span className="font-medium">Sinh viên:</span>{" "}
                                {submission.student_name || submission.mssv || "Không rõ"}
                            </div>
                            <div>
                                <span className="font-medium">MSSV:</span>{" "}
                                {submission.student_mssv || "Không có"}
                            </div>
                            <div>
                                <span className="font-medium">Thời điểm nộp:</span>{" "}
                                {submission.updated_at
                                    ? new Date(submission.updated_at).toLocaleString("vi-VN")
                                    : "Chưa nộp"}
                            </div>
                            <div>
                                <span className="font-medium">Trạng thái:</span>{" "}
                                {submission.status === "submitted" ? (
                                    <span className="text-green-600">Đã nộp bài</span>
                                ) : (
                                    <span className="text-red-600">Chưa nộp bài</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 border-b border-gray-200 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Nội dung bài làm
                    </h2>
                    {submission.content ? (
                        <EditorComponent
                            value={submission.content}
                            onChange={() => { }}
                            readOnly={true}
                        />
                    ) : (
                        <p className="text-gray-500">Sinh viên không viết nội dung nào.</p>
                    )}
                </div>

                <div className="bg-white p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        File bài nộp
                    </h2>
                    {studentFileUrl ? (
                        <div className="space-y-4">

                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <FileOutlined className="text-2xl text-blue-500" />
                                    <div>
                                        <div className="font-medium text-gray-900">{studentFileUpload.name}</div>
                                        {studentFileUpload.size && (
                                            <div className="text-sm text-gray-500">
                                                {(studentFileUpload.size / 1024 / 1024).toFixed(2)} MB
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">

                                    <a
                                        href={studentFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded text-sm transition-colors"
                                    >
                                        Xem file
                                    </a>

                                    <a
                                        href={`${urlDownload}/${studentFileUpload.path}`}
                                        className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm transition-colors"
                                    >
                                        Tải xuống
                                    </a>



                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">Sinh viên không nộp file.</p>
                    )}
                </div>
            </div>

            <ToastContainer position="bottom-right" autoClose={4000} />
        </div>
    );
}

export default SubmissionDetail;
