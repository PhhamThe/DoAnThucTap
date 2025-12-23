import { useEffect, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import {
    UserGroupIcon,
    AcademicCapIcon,
    BookOpenIcon,
    DocumentTextIcon,
    ClockIcon,
    CheckCircleIcon
} from "@heroicons/react/24/outline";
import { apiGet } from "../../api/client";
import { toast } from "react-toastify";

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const Statistic = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [statsData, setStatsData] = useState({
        summary: {
            totalStudents: 0,
            totalTeachers: 0,
            totalClasses: 0,
            totalSubjects: 0,
            activeQuizzes: 0,
            completedAssignments: 0,
        },
        studentDistribution: {
            labels: [],
            data: [],
        },
        classStatistics: {
            labels: [],
            data: [],
        },
        quizPerformance: {
            labels: [],
            data: [],
        },
        monthlyActivity: {
            labels: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
            data: [],
        },
    });

    useEffect(() => {
        document.title = "Thống kê - Hệ thống E-Learning";
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setIsLoaded(false);

            // Lấy dữ liệu thống kê từ API
            const statsResponse = await apiGet("api/dashboard/stats");

            if (statsResponse?.success === false) {
                toast.error("Không thể tải dữ liệu thống kê");
                return;
            }

            // Cập nhật dữ liệu từ API
            setStatsData({
                summary: statsResponse.data.summary || {
                    totalStudents: 0,
                    totalTeachers: 0,
                    totalClasses: 0,
                    totalSubjects: 0,
                    activeQuizzes: 0,
                    completedAssignments: 0,
                },
                studentDistribution: statsResponse.studentDistribution || {
                    labels: ["Năm 1", "Năm 2", "Năm 3", "Năm 4"],
                    data: [45, 35, 25, 15],
                },
                classStatistics: statsResponse.classStatistics || {
                    labels: ["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"],
                    data: [25, 20, 18, 15, 12],
                },
                quizPerformance: statsResponse.quizPerformance || {
                    labels: ["<5", "5-7", "7-8", "8-9", "9-10"],
                    data: [5, 15, 35, 30, 15],
                },
                monthlyActivity: statsResponse.monthlyActivity || {
                    labels: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
                    data: [850, 920, 1050, 1200, 1100, 1350, 1500, 1450, 1250, 1100, 1000, 1300],
                },
            });

            setIsLoaded(true);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast.error("Có lỗi khi tải dữ liệu");
            setIsLoaded(true);
        }
    };

    // Chart data configurations
    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "Số lượng sinh viên",
                },
            },
            x: {
                title: {
                    display: true,
                    text: "Khóa học",
                },
            },
        },
    };

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "Hoạt động",
                },
            },
            x: {
                title: {
                    display: true,
                    text: "Tháng",
                },
            },
        },
    };

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
            },
        },
    };

    const doughnutChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
            },
        },
    };

    // Data cho biểu đồ
    const studentDistributionChart = {
        labels: statsData.studentDistribution.labels,
        datasets: [
            {
                label: "Số lượng sinh viên",
                data: statsData.studentDistribution.data,
                backgroundColor: "rgba(59, 130, 246, 0.6)",
                borderColor: "rgba(59, 130, 246, 1)",
                borderWidth: 1,
            },
        ],
    };

    const monthlyActivityChart = {
        labels: statsData.monthlyActivity.labels,
        datasets: [
            {
                label: "Hoạt động hệ thống",
                data: statsData.monthlyActivity.data,
                borderColor: "rgb(16, 185, 129)",
                backgroundColor: "rgba(16, 185, 129, 0.2)",
                tension: 0.4,
                fill: true,
            },
        ],
    };

    const classStatisticsChart = {
        labels: statsData.classStatistics.labels,
        datasets: [
            {
                label: "Số sinh viên",
                data: statsData.classStatistics.data,
                backgroundColor: [
                    "rgba(255, 99, 132, 0.6)",
                    "rgba(54, 162, 235, 0.6)",
                    "rgba(255, 206, 86, 0.6)",
                    "rgba(75, 192, 192, 0.6)",
                    "rgba(153, 102, 255, 0.6)",
                ],
                borderColor: [
                    "rgba(255, 99, 132, 1)",
                    "rgba(54, 162, 235, 1)",
                    "rgba(255, 206, 86, 1)",
                    "rgba(75, 192, 192, 1)",
                    "rgba(153, 102, 255, 1)",
                ],
                borderWidth: 1,
            },
        ],
    };

    const quizPerformanceChart = {
        labels: statsData.quizPerformance.labels,
        datasets: [
            {
                label: "Phân phối điểm",
                data: statsData.quizPerformance.data,
                backgroundColor: [
                    "rgba(239, 68, 68, 0.6)",
                    "rgba(249, 115, 22, 0.6)",
                    "rgba(245, 158, 11, 0.6)",
                    "rgba(34, 197, 94, 0.6)",
                    "rgba(16, 185, 129, 0.6)",
                ],
                borderColor: [
                    "rgba(239, 68, 68, 1)",
                    "rgba(249, 115, 22, 1)",
                    "rgba(245, 158, 11, 1)",
                    "rgba(34, 197, 94, 1)",
                    "rgba(16, 185, 129, 1)",
                ],
                borderWidth: 1,
            },
        ],
    };

    // Format số
    const formatNumber = (num) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                    Thống kê hệ thống E-Learning
                </h1>
                <div className="text-sm text-gray-500">
                    Cập nhật: {new Date().toLocaleDateString('vi-VN')}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* Thẻ 1: Tổng sinh viên */}
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <UserGroupIcon className="h-8 w-8 text-blue-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Tổng sinh viên</p>
                            <p className="text-xl font-bold text-gray-900">
                                {formatNumber(statsData.summary.totalStudents)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Thẻ 2: Tổng giáo viên */}
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <AcademicCapIcon className="h-8 w-8 text-green-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Giáo viên</p>
                            <p className="text-xl font-bold text-gray-900">
                                {formatNumber(statsData.summary.totalTeachers)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Thẻ 3: Tổng lớp học */}
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <BookOpenIcon className="h-8 w-8 text-purple-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Lớp học</p>
                            <p className="text-xl font-bold text-gray-900">
                                {formatNumber(statsData.summary.totalClasses)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Thẻ 4: Tổng môn học */}
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <DocumentTextIcon className="h-8 w-8 text-yellow-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Môn học</p>
                            <p className="text-xl font-bold text-gray-900">
                                {formatNumber(statsData.summary.totalSubjects)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Thẻ 5: Bài kiểm tra đang hoạt động */}
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <ClockIcon className="h-8 w-8 text-red-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Bài kiểm tra</p>
                            <p className="text-xl font-bold text-gray-900">
                                {formatNumber(statsData.summary.activeQuizzes)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Thẻ 6: Bài tập đã hoàn thành */}
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-emerald-500">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <CheckCircleIcon className="h-8 w-8 text-emerald-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Bài tập đã nộp</p>
                            <p className="text-xl font-bold text-gray-900">
                                {formatNumber(statsData.summary.completedAssignments)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            {isLoaded ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bar Chart - Phân bố sinh viên theo khóa */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Phân bố sinh viên theo khóa học
                        </h2>
                        <div className="h-80">
                            <Bar data={studentDistributionChart} options={barChartOptions} />
                        </div>
                    </div>

                    {/* Line Chart - Hoạt động hàng tháng */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Hoạt động hệ thống hàng tháng
                        </h2>
                        <div className="h-80">
                            <Line data={monthlyActivityChart} options={lineChartOptions} />
                        </div>
                    </div>

                    {/* Pie Chart - Thống kê lớp học */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Thống kê lớp học
                        </h2>
                        <div className="h-80 flex items-center justify-center">
                            <Pie data={classStatisticsChart} options={pieChartOptions} />
                        </div>
                    </div>

                    {/* Doughnut Chart - Phân phối điểm bài kiểm tra */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Phân phối điểm bài kiểm tra
                        </h2>
                        <div className="h-80 flex items-center justify-center">
                            <Doughnut data={quizPerformanceChart} options={doughnutChartOptions} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex justify-center items-center h-64">
                    <div className="text-gray-500">Đang tải dữ liệu thống kê...</div>
                </div>
            )}

            {/* Thống kê chi tiết */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Tóm tắt thống kê
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Chỉ số
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Số lượng
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ghi chú
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    Tổng số người dùng
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatNumber(statsData.summary.totalStudents + statsData.summary.totalTeachers)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    Bao gồm sinh viên và giáo viên
                                </td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    Tỷ lệ sinh viên/giáo viên
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {(statsData.summary.totalTeachers > 0
                                        ? (statsData.summary.totalStudents / statsData.summary.totalTeachers).toFixed(1)
                                        : "N/A")}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    Số sinh viên trên 1 giáo viên
                                </td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    Trung bình sinh viên/lớp
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {(statsData.summary.totalClasses > 0
                                        ? (statsData.summary.totalStudents / statsData.summary.totalClasses).toFixed(1)
                                        : "N/A")}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    Tính theo lớp học hiện có
                                </td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    Tỷ lệ hoàn thành bài tập
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {(statsData.summary.totalStudents > 0
                                        ? ((statsData.summary.completedAssignments / (statsData.summary.totalStudents * 5)) * 100).toFixed(1) + "%"
                                        : "N/A")}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    Ước tính dựa trên bài tập trung bình
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Statistic;