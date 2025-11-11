import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiGet } from "../../api/client";
import { useNavigate, useParams } from "react-router-dom";

function AssignmentList() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(false);
    const { classId } = useParams();
    const navigate = useNavigate()
    async function fetchAssignmentsList() {
        try {
            setLoading(true);
            const json = await apiGet(`api/student_assigntment_list/${classId}`);

            if (!json.success) {
                toast.error(json.message || "Không thể tải danh sách bài thực hành");
                return;
            }
            setAssignments(json.data || []);
        } catch (err) {
            toast.error("Lỗi khi kết nối server");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAssignmentsList();
    }, [classId]);

    return (
        <div className="min-h-screen bg-white p-8 font-sans">
            <h2 className="text-3xl font-semibold text-center mb-8">
                Danh sách bài thực hành
            </h2>

            <div className="w-11/12 mx-auto border border-gray-300 rounded-2xl shadow-md p-6 bg-gray-50">
                {loading ? (
                    <p className="text-center text-gray-500">Đang tải...</p>
                ) : assignments.length === 0 ? (
                    <p className="text-center text-gray-500">
                        Chưa có bài thực hành nào.
                    </p>
                ) : (
                    <ul className="space-y-4">
                        {assignments.map((item) => (
                            <li
                                onClick={() => navigate(`/assignment-details/${item.id}`)}
                                key={item.id}
                                className="cursor-pointer p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition text-left"
                            >
                                {item.title}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <ToastContainer />
        </div>
    );
}

export default AssignmentList;
