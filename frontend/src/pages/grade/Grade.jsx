import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiGet, apiPost } from '../../api/client';
import { useParams } from 'react-router-dom';
import * as XLSX from "xlsx";

function Grade() {
    const { classId } = useParams();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [students, setStudents] = useState([]);
    const [gradeTypes, setGradeTypes] = useState([]);
    const [classInfo, setClassInfo] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // State để lưu điểm đang nhập
    const [grades, setGrades] = useState({});

    useEffect(() => {
        if (classId) {
            void fetchData();
            void fetchClassInfo();
        }
    }, [classId]);

    // Lấy dữ liệu
    async function fetchData() {
        try {
            setLoading(true);
            const json = await apiGet(`api/grades/class/${classId}/students`);

            if (json?.success) {
                const { students: studentData, grade_types: types } = json.data;

                setStudents(studentData);
                setGradeTypes(types);

                // Khởi tạo state cho điểm
                const gradesState = {};
                studentData.forEach(student => {
                    gradesState[student.student_id] = {};
                    types.forEach(type => {
                        const gradeInfo = student[type.code];
                        gradesState[student.student_id][type.code] = {
                            score: gradeInfo?.score !== null && gradeInfo?.score !== undefined ? gradeInfo.score : '',
                            max_score: gradeInfo?.max_score || (type.code === 'final' ? 100 : 10),
                        };
                    });
                });

                setGrades(gradesState);
            } else {
                toast.error(json?.message || 'Không thể lấy danh sách điểm');
            }
        } catch (err) {
            toast.error('Không thể lấy danh sách điểm');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function fetchClassInfo() {
        try {
            const json = await apiGet(`api/classes/${classId}`);
            if (json?.success) {
                setClassInfo(json.data);
            }
        } catch (err) {
            console.error('Fetch class info error:', err);
        }
    }

    // Xử lý thay đổi điểm
    const handleGradeChange = (studentId, typeCode, field, value) => {
        setGrades(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [typeCode]: {
                    ...prev[studentId][typeCode],
                    [field]: field === 'score' || field === 'max_score' ? parseFloat(value) || '' : value
                }
            }
        }));
    };

    // Lưu điểm cho một ô
    const saveSingleGrade = async (studentId, typeCode) => {
        const gradeData = grades[studentId]?.[typeCode];
        if (!gradeData || gradeData.score === '' || gradeData.score === null) {
            toast.error('Vui lòng nhập điểm');
            return;
        }

        try {
            setSaving(true);

            const payload = {
                type: typeCode,
                score: parseFloat(gradeData.score),
                max_score: parseFloat(gradeData.max_score)
            };

            const json = await apiPost(`api/grades/class/${classId}/student/${studentId}/save`, payload);

            if (json?.success) {
                toast.success(json.message || 'Lưu điểm thành công');
                // Cập nhật lại dữ liệu sau khi lưu
                setTimeout(() => {
                    fetchData();
                }, 500);
            } else {
                toast.error(json?.message || 'Lỗi khi lưu điểm');
            }

        } catch (err) {
            toast.error('Lỗi khi lưu điểm');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // Lưu tất cả điểm
    const saveAllGrades = async () => {
        try {
            setSaving(true);
            let savedCount = 0;

            for (const studentId in grades) {
                for (const typeCode in grades[studentId]) {
                    const gradeData = grades[studentId][typeCode];

                    if (gradeData.score !== '' && gradeData.score !== null) {
                        const payload = {
                            type: typeCode,
                            score: parseFloat(gradeData.score),
                            max_score: parseFloat(gradeData.max_score)
                        };

                        await apiPost(`api/grades/class/${classId}/student/${studentId}/save`, payload);
                        savedCount++;
                    }
                }
            }

            if (savedCount === 0) {
                toast.warning('Không có điểm nào để lưu');
                return;
            }

            toast.success(`Đã lưu ${savedCount} điểm thành công`);
            // Cập nhật lại dữ liệu sau khi lưu
            setTimeout(() => {
                fetchData();
            }, 500);

        } catch (err) {
            toast.error('Lỗi khi lưu điểm');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // Render ô nhập điểm
    const renderGradeCell = (student, type) => {
        const gradeData = grades[student.student_id]?.[type.code];
        if (!gradeData) return null;

        return (
            <td key={type.code} className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                    <input
                        type="number"
                        step="0.1"
                        min="0"
                        max={gradeData.max_score}
                        value={gradeData.score}
                        onChange={(e) => handleGradeChange(student.student_id, type.code, 'score', e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Điểm"
                    />
                    <button
                        onClick={() => saveSingleGrade(student.student_id, type.code)}
                        disabled={saving}
                        className="px-3 py-1 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Lưu
                    </button>
                </div>
            </td>
        );
    };

    // Render ô điểm tổng kết SỐ
    const renderTotalScoreCell = (student) => {
        if (!student.final_grade) {
            return (
                <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-400">-</span>
                </td>
            );
        }

        const { total_score } = student.final_grade;
        
        return (
            <td className="px-4 py-3 whitespace-nowrap text-center">
                <span className="text-sm font-medium text-gray-900">
                    {total_score.toFixed(1)}
                </span>
            </td>
        );
    };

    // Render ô điểm tổng kết CHỮ
    const renderLetterGradeCell = (student) => {
        if (!student.final_grade) {
            return (
                <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-400">-</span>
                </td>
            );
        }

        const { letter_grade } = student.final_grade;
        
        return (
            <td className="px-4 py-3 whitespace-nowrap text-center">
                <span className="text-sm font-medium text-gray-900">
                    {letter_grade}
                </span>
            </td>
        );
    };

    // Lọc dữ liệu theo search term
    const filteredStudents = React.useMemo(() => {
        if (!searchTerm.trim()) return students;

        return students.filter(student => {
            return student.mssv.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.name.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [students, searchTerm]);

    const exportToExcel = () => {
        if (students.length === 0) {
            toast.warning("Không có dữ liệu để xuất");
            return;
        }

        try {
            const dataForExcel = students.map((student, index) => ({
                "STT": index + 1,
                "Mã SV": student.mssv || "-",
                "Họ tên": student.name || "-",
                "Chuyên cần": student.attendance?.score || "-",
                "Bài tập": student.assignment?.score || "-",
                "Giữa kỳ": student.midterm?.score || "-",
                "Cuối kỳ": student.final?.score || "-",
                "Điểm tổng (số)": student.final_grade?.total_score || "-",
                "Điểm tổng (chữ)": student.final_grade?.letter_grade || "-",
            }));

            // Tạo worksheet
            const worksheet = XLSX.utils.json_to_sheet(dataForExcel);

            // Tạo workbook
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Kết quả điểm");

            const fileName = `ket-qua-diem-${classInfo?.name || classId}-${new Date().toISOString().split('T')[0]}.xlsx`;

            // Xuất file
            XLSX.writeFile(workbook, fileName);
            toast.success("Xuất file Excel thành công!");
        } catch (error) {
            console.error("Lỗi khi xuất Excel:", error);
            toast.error("Có lỗi khi xuất file Excel");
        }
    };

    return (
        <div className="p-6">
            {/* Header với các nút chức năng */}
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800">
                        {classInfo?.name ? `Quản lý điểm - ${classInfo.name}` : 'Quản lý điểm'}
                    </h1>
                    {classInfo?.subject?.name && (
                        <p className="text-sm text-gray-600 mt-1">Môn: {classInfo.subject.name}</p>
                    )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={saveAllGrades}
                        disabled={saving || loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                    >
                        {saving ? 'Đang lưu...' : 'Lưu tất cả điểm'}
                    </button>
                    
                    <button
                        onClick={exportToExcel}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded hover:bg-green-700 transition-colors duration-200"
                    >
                        Xuất Excel
                    </button>
                </div>
            </div>

            {/* Search bar */}
            <div className="flex items-center justify-between gap-4 pb-4">
                <div className="w-full sm:w-64">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Tìm kiếm MSSV hoặc tên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="flex items-center justify-center p-12">
                        <div className="flex items-center justify-center space-x-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                            <span className="text-gray-600">Đang tải dữ liệu...</span>
                        </div>
                    </div>
                </div>
            ) : !filteredStudents || filteredStudents.length === 0 ? (
                <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="flex flex-col items-center justify-center p-12">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6" />
                            </svg>
                        </div>
                        <p className="text-gray-500 text-sm">
                            {searchTerm ? "Không tìm thấy sinh viên" : "Chưa có sinh viên nào trong lớp"}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        STT
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        MSSV
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Họ tên
                                    </th>
                                    {gradeTypes.map(type => (
                                        <th key={type.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div className="font-medium">{type.name}</div>
                                            <div className="text-xs text-gray-400 mt-1">{type.default_weight}%</div>
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="font-medium">Tổng (số)</div>
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="font-medium">Tổng (chữ)</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredStudents.map((student, index) => (
                                    <tr
                                        key={student.student_id}
                                        className="hover:bg-gray-50 transition-colors duration-150"
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {student.mssv}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {student.name}
                                        </td>
                                        {gradeTypes.map(type =>
                                            renderGradeCell(student, type)
                                        )}
                                        {renderTotalScoreCell(student)}
                                        {renderLetterGradeCell(student)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
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

export default Grade;