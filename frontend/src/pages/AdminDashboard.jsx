import { RiseOutlined, FallOutlined, CheckCircleOutlined, ExclamationCircleOutlined, UserOutlined, TeamOutlined, BookOutlined, AppstoreOutlined } from '@ant-design/icons';

const AdminDashboard = () => {
    // Mock data
    const stats = [
        {
            title: 'Tổng sinh viên',
            value: '1,248',
            change: '+12%',
            trend: 'up',
            icon: <TeamOutlined className="text-gray-600" />
        },
        {
            title: 'Tổng giảng viên',
            value: '45',
            change: '+5%',
            trend: 'up',
            icon: <UserOutlined className="text-gray-600" />
        },
        {
            title: 'Lớp học đang hoạt động',
            value: '32',
            change: '+8%',
            trend: 'up',
            icon: <BookOutlined className="text-gray-600" />
        },
        {
            title: 'Môn học',
            value: '28',
            change: '-3%',
            trend: 'down',
            icon: <AppstoreOutlined className="text-gray-600" />
        }
    ];

    const recentActivities = [
        { user: 'Nguyễn Văn A', action: 'đã đăng ký môn học', time: '5 phút trước' },
        { user: 'Trần Thị B', action: 'đã nộp bài tập', time: '10 phút trước' },
        { user: 'Phạm Văn C', action: 'đã tạo lớp mới', time: '15 phút trước' },
        { user: 'Lê Thị D', action: 'đã cập nhật điểm', time: '20 phút trước' },
        { user: 'Hoàng Văn E', action: 'đã upload tài liệu', time: '25 phút trước' }
    ];

    const pendingTasks = [
        { task: 'Duyệt đăng ký môn học mới', count: 12, priority: 'high' },
        { task: 'Phê duyệt bài giảng', count: 5, priority: 'medium' },
        { task: 'Xử lý khiếu nại', count: 3, priority: 'high' },
        { task: 'Cập nhật học kỳ mới', count: 1, priority: 'medium' }
    ];

    const systemStatus = [
        { service: 'Database', status: 'online' },
        { service: 'API Server', status: 'online' },
        { service: 'File Storage', status: 'warning' },
        { service: 'Email Service', status: 'online' }
    ];

    const semesterInfo = [
        { semester: 'Học kỳ 1 - 2024', status: 'Đang diễn ra', classes: 15, students: 650 },
        { semester: 'Học kỳ 2 - 2024', status: 'Sắp bắt đầu', classes: 12, students: 520 },
        { semester: 'Học kỳ Hè - 2024', status: 'Đã kết thúc', classes: 8, students: 300 }
    ];

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-2">
                <h1 className="text-2xl font-semibold text-gray-800">Trang chủ</h1>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-5 border border-gray-200 ">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm mb-1">{stat.title}</p>
                                <p className="text-2xl font-semibold text-gray-800">{stat.value}</p>
                            </div>
                            <div className="text-2xl text-gray-400">
                                {stat.icon}
                            </div>
                        </div>
                        <div className={`flex items-center mt-3 text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            {stat.trend === 'up' ? <RiseOutlined /> : <FallOutlined />}
                            <span className="ml-1">{stat.change} so với tháng trước</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activities */}
                <div className="lg:col-span-2 bg-white p-6 border border-gray-200 ">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Hoạt động gần đây</h3>
                    <div className="space-y-3">
                        {recentActivities.map((activity, index) => (
                            <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                        <span className="text-gray-600 text-sm font-medium">
                                            {activity.user.split(' ').pop()?.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-gray-800 font-medium">{activity.user}</p>
                                        <p className="text-gray-600 text-sm">{activity.action}</p>
                                    </div>
                                </div>
                                <span className="text-gray-500 text-sm">{activity.time}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Pending Tasks */}
                    <div className="bg-white p-6 border border-gray-200 ">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Công việc cần xử lý</h3>
                        <div className="space-y-3">
                            {pendingTasks.map((task, index) => (
                                <div key={index} className="flex items-center justify-between py-2">
                                    <div className="flex items-center space-x-3">
                                        {task.priority === 'high' ?
                                            <ExclamationCircleOutlined className="text-red-500" /> :
                                            <CheckCircleOutlined className="text-blue-500" />
                                        }
                                        <span className="text-gray-700">{task.task}</span>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${task.priority === 'high' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                                        {task.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="bg-white p-6 border border-gray-200 ">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Trạng thái hệ thống</h3>
                        <div className="space-y-3">
                            {systemStatus.map((service, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="text-gray-700">{service.service}</span>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${service.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                        <span className="text-gray-600 text-sm capitalize">{service.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Semester Overview */}
            <div className="bg-white p-6 border border-gray-200 ">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Tổng quan học kỳ</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {semesterInfo.map((semester, index) => (
                        <div key={index} className="p-4 border border-gray-200 ">
                            <h4 className="font-semibold text-gray-800">{semester.semester}</h4>
                            <p className={`text-sm mt-1 ${semester.status === 'Đang diễn ra' ? 'text-green-600' :
                                semester.status === 'Sắp bắt đầu' ? 'text-blue-600' : 'text-gray-600'
                                }`}>
                                {semester.status}
                            </p>
                            <div className="flex justify-between mt-3 text-sm text-gray-600">
                                <span>{semester.classes} lớp</span>
                                <span>{semester.students} sinh viên</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;