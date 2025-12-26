import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiGet } from '../../api/client';
import { useParams } from 'react-router-dom';

function StudentGrades() {
    const { classId } = useParams();
    const [loading, setLoading] = useState(false);
    const [gradeTypes, setGradeTypes] = useState([]);
    const [classInfo, setClassInfo] = useState(null);
    const [studentGrades, setStudentGrades] = useState({});
    const [studentInfo, setStudentInfo] = useState(null);
    const [totalScore, setTotalScore] = useState(null);
    const [finalGrade, setFinalGrade] = useState(null);

    useEffect(() => {
        if (classId) {
            void fetchData();
        }
    }, [classId]);

    // Lấy dữ liệu điểm của sinh viên
    async function fetchData() {
        try {
            setLoading(true);

            // Lấy điểm theo class
            const json = await apiGet(`api/student-grades/class/${classId}`);

            if (json?.success) {
                const { grades, grade_types: types, student, class_info, total_score, final_grade } = json.data;

                setGradeTypes(types);
                setClassInfo(class_info);
                setStudentInfo(student);
                setTotalScore(total_score);
                setFinalGrade(final_grade);

                // Format dữ liệu điểm
                const gradesState = {};
                types.forEach(type => {
                    const gradeInfo = grades[type.code];
                    gradesState[type.code] = {
                        score: gradeInfo?.score !== null && gradeInfo?.score !== undefined ? gradeInfo.score : '-',
                        max_score: gradeInfo?.max_score || (type.code === 'final' ? 100 : 10),
                        is_graded: gradeInfo?.score !== null && gradeInfo?.score !== undefined
                    };
                });

                setStudentGrades(gradesState);
            } else {
                toast.error(json?.message || 'Không thể lấy thông tin điểm');
            }
        } catch (err) {
            toast.error('Không thể lấy thông tin điểm');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    

    // Render ô điểm cho sinh viên

    // Xác định màu sắc cho điểm tổng kết
    const getFinalGradeColor = (grade) => {
        if (!grade) return 'text-gray-600';
        if (grade >= 8.5) return 'text-green-600';
        if (grade >= 7.0) return 'text-blue-600';
        if (grade >= 5.5) return 'text-yellow-600';
        return 'text-red-600';
    };

    // Xác định xếp loại
    const getGradeRank = (grade) => {
        if (!grade) return 'Chưa xếp loại';
        if (grade >= 8.5) return 'Giỏi';
        if (grade >= 7.0) return 'Khá';
        if (grade >= 5.5) return 'Trung bình';
        if (grade >= 4.0) return 'Yếu';
        return 'Kém';
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Điểm số của tôi</h1>
                {classInfo && studentInfo && (
                    <div className="mt-2 text-gray-600">
                        <p className="text-sm">
                            Lớp: <span className="font-semibold text-gray-800">{classInfo.name}</span>
                            {classInfo.subject && (
                                <> - Môn: <span className="font-semibold text-gray-800">{classInfo.subject.name}</span></>
                            )}
                        </p>
                        <p className="text-sm mt-1">
                            Sinh viên: <span className="font-semibold text-gray-800">{studentInfo.name}</span>
                            {studentInfo.mssv && (
                                <> - MSSV: <span className="font-semibold text-gray-800">{studentInfo.mssv}</span></>
                            )}
                        </p>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="flex items-center justify-center p-12">
                        <div className="flex items-center justify-center space-x-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                            <span className="text-gray-600">Đang tải dữ liệu điểm...</span>
                        </div>
                    </div>
                </div>
            ) : !gradeTypes || gradeTypes.length === 0 ? (
                <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="flex flex-col items-center justify-center p-12">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 text-sm">Chưa có thông tin điểm cho lớp học này</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Bảng điểm chi tiết */}
                    <div className="border border-gray-200 rounded-md overflow-hidden mb-6">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            STT
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Loại điểm
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Mô tả
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Trọng số
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Điểm số
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {gradeTypes.map((type, index) => {
                                        const gradeData = studentGrades[type.code];
                                        const score = gradeData?.score || '-';
                                        const isGraded = gradeData?.is_graded || false;

                                        return (
                                            <tr key={type.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {type.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {type.description || 'Không có mô tả'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {type.default_weight}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className={`px-3 py-1 text-sm font-medium rounded-md ${isGraded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {score !== '-' ? `${score} / ${gradeData.max_score}` : 'Chưa có điểm'}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Tổng kết điểm */}
                    {(totalScore !== null || finalGrade !== null) && (
                        <div className=" border border-gray-200 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tổng kết điểm</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {totalScore !== null && (
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="text-sm text-gray-600 mb-1">Điểm tổng kết</div>
                                        <div className={`text-2xl font-bold ${getFinalGradeColor(totalScore)}`}>
                                            {totalScore.toFixed(2)} / 10
                                        </div>
                                        <div className="text-sm text-gray-500 mt-2">
                                            Xếp loại: <span className="font-medium">{getGradeRank(totalScore)}</span>
                                        </div>
                                    </div>
                                )}

                                {finalGrade?.letter_grade && (
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="text-sm text-gray-600 mb-1">Điểm chữ</div>
                                        <div className="text-2xl font-bold text-purple-600">
                                            {finalGrade.letter_grade}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-2">
                                            {finalGrade.status === 'passed' ? 'Đã đạt' :
                                                finalGrade.status === 'failed' ? 'Không đạt' :
                                                    'Đang học'}
                                        </div>
                                    </div>
                                )}

                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <div className="text-sm text-gray-600 mb-1">Thống kê</div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Số loại điểm:</span>
                                            <span className="font-medium">{gradeTypes.length}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Đã có điểm:</span>
                                            <span className="font-medium">
                                                {Object.values(studentGrades).filter(g => g.is_graded).length}/{gradeTypes.length}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    
                </>
            )}

            <ToastContainer
                position="bottom-right"
                autoClose={3000}
                toastClassName="rounded-md"
                progressClassName="bg-blue-500"
            />
        </div>
    );
}

export default StudentGrades;