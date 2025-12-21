import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiGet, apiPost } from '../../api/client';
import { useParams } from 'react-router-dom';

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
            <td key={type.code} className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-1">
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max={gradeData.max_score}
                            value={gradeData.score}
                            onChange={(e) => handleGradeChange(student.student_id, type.code, 'score', e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Điểm"
                        />
                        <span className="text-gray-500 text-sm">/</span>
                        <input
                            type="number"
                            step="0.1"
                            min="1"
                            value={gradeData.max_score}
                            onChange={(e) => handleGradeChange(student.student_id, type.code, 'max_score', e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <button
                        onClick={() => saveSingleGrade(student.student_id, type.code)}
                        disabled={saving}
                        className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors duration-200 disabled:opacity-50"
                    >
                        {saving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                </div>
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

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Điểm</h1>
                    {classInfo && (
                        <p className="text-gray-600 mt-1 text-sm">
                            Lớp: <span className="font-semibold text-gray-800">{classInfo.name}</span>
                            {classInfo.subject && (
                                <> - Môn: <span className="font-semibold text-gray-800">{classInfo.subject.name}</span></>
                            )}
                        </p>
                    )}
                </div>
                <button
                    onClick={saveAllGrades}
                    disabled={saving || loading}
                    className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors duration-200 disabled:opacity-50 flex items-center"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    {saving ? 'Đang lưu...' : 'Lưu tất cả điểm'}
                </button>
            </div>

            {/* Search bar - giống DataTable core */}
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

            {/* Table - giống style DataTable core */}
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        STT
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        MSSV
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Họ tên
                                    </th>
                                    {gradeTypes.map(type => (
                                        <th key={type.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div className="font-medium">{type.name}</div>
                                            <div className="text-xs text-gray-400 mt-1">{type.default_weight}%</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredStudents.map((student, index) => (
                                    <tr
                                        key={student.student_id}
                                        className="hover:bg-gray-50 transition-colors duration-150"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {student.mssv}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {student.name}
                                        </td>
                                        {gradeTypes.map(type => 
                                            renderGradeCell(student, type)
                                        )}
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