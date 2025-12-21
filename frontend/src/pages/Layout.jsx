import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { apiGet } from '../api/client';
import {
  DownOutlined,
  RightOutlined,
  FileTextOutlined,
  TeamOutlined,
  BookOutlined,
  CodeOutlined,
  MessageOutlined,
  BarChartOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserSwitchOutlined,
  BankOutlined,
  BookOutlined as BookFilledOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  HomeOutlined,
  ProfileOutlined,
  FileDoneOutlined,
  CommentOutlined,
  PieChartOutlined,
  UsergroupAddOutlined,
  AuditOutlined
} from '@ant-design/icons';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [studentClass, setStudentClasses] = useState([]);
  const [teacherClass, setTeacherClasses] = useState([]);
  const [openClass, setOpenClass] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    fetchUser(token);
    fetchNotifications();
  }, [navigate]);

  const fetchUser = async (token) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_ENDPOINT}api/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      setUser(data.user);

      if (data.user?.role === 'teacher') {
        await fetchTeacherClasses();
      }
      else if (data.user.role === 'student') {
        await fetchStudentClasses();
      }
    } catch (err) {
      console.error(err);
      localStorage.removeItem('token');
      navigate('/login', { replace: true });
    }
  };

  const fetchNotifications = async () => {
    setNotifications([
      { id: 1, title: 'Bài tập mới', message: 'Có Bài tập mới trong lớp CS101', time: '5 phút trước', read: false },
      { id: 2, title: 'Deadline sắp đến', message: 'Bài tập lập trình hết hạn trong 2 ngày', time: '1 giờ trước', read: false },
    ]);
  };

  const fetchTeacherClasses = async () => {
    try {
      const json = await apiGet(`api/class_list_by_teacher`);
      if (json?.success) {
        setTeacherClasses(json.data || []);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách lớp', err);
    }
  };

  const fetchStudentClasses = async () => {
    try {
      const json = await apiGet(`api/class_list_by_student`);
      if (json.success) {
        setStudentClasses(json.data || []);
      }
    }
    catch (err) {
      console.log('Lỗi khi lấy danh sách học phần', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path)
      ? 'bg-blue-600 text-white'
      : 'text-gray-300 hover:bg-blue-600 hover:text-white';

  const isSubMenuActive = (path) =>
    location.pathname.startsWith(path.replace(/\/[^/]*$/, ''))
      ? 'bg-blue-600 text-white'
      : 'text-gray-300 hover:bg-blue-600 hover:text-white';

  const handleClassClick = (classId) => {
    if (openClass === classId) {
      setOpenClass(null);
    } else {
      setOpenClass(classId);
    }
  };

  const handleMenuItemClick = (path, classId) => {
    navigate(path, {
      state: {
        timestamp: Date.now(),
        classId: classId
      }
    });
  };

  const subMenuItems = (classId) => [
    {
      id: 'assignments',
      label: 'Bài thực hành',
      icon: <FileDoneOutlined className="text-sm" />,
      path: `admin/assignment-list/${classId}/`
    },
    {
      id: 'students',
      label: 'Quản lý sinh viên',
      icon: <UsergroupAddOutlined className="text-sm" />,
      path: `admin/student_by_class/${classId}`
    },
    {
      id: 'materials',
      label: 'Bài giảng',
      icon: <BookOutlined className="text-sm" />,
      path: `admin/chapters/${classId}/`
    },
    {
      id: 'practice',
      label: 'Kiểm tra',
      icon: <CodeOutlined className="text-sm" />,
      path: `admin/quizzes/${classId}`
    },
    {
      id: 'discussion',
      label: 'Thảo luận',
      icon: <CommentOutlined className="text-sm" />,
      path: `admin/class/${classId}/discussion`
    },
    {
      id: 'grades',
      label: 'Điểm số',
      icon: <AuditOutlined className="text-sm" />,
      path: `admin/grades/${classId}`
    },
  ];

  const subStudentMenuItems = (classId) => [
    {
      id: 'assignments',
      label: 'Bài thực hành',
      icon: <FileDoneOutlined className="text-sm" />,
      path: `/assignment-list/${classId}/`
    },
    {
      id: 'materials',
      label: 'Tài liệu học tập',
      icon: <BookOutlined className="text-sm" />,
      path: `/chapters/${classId}`
    },
    {
      id: 'practice',
      label: 'Kiểm tra',
      icon: <CodeOutlined className="text-sm" />,
      path: `/quizzes/${classId}`
    },
    {
      id: 'discussion',
      label: 'Thảo luận',
      icon: <CommentOutlined className="text-sm" />,
      path: `/class/${classId}/discussion`
    },
    {
      id: 'grades',
      label: 'Điểm số',
      icon: <AuditOutlined className="text-sm" />,
      path: `/grades/${classId}`
    },
  ];

  // Chỉnh sửa: Thêm section header cho teacher và student menu giống admin
  const teacherMenu = (
    <>
      {/* Thêm phần Quản lý giảng dạy giống admin */}
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Quản lý giảng dạy
      </div>

      <Link
        to="/teacher_dashboard"
        className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md ${isActive('/teacher_dashboard')}`}
      >
        <DashboardOutlined className="text-base flex-shrink-0" />
        <span className="break-words">Trang chủ</span>
      </Link>

      <div className="mt-1">
        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Lớp học của tôi
        </div>
        {teacherClass.length > 0 ? (
          teacherClass.map((cls) => (
            <div key={cls.id} className="mb-1">
              <button
                onClick={() => handleClassClick(cls.id)}
                className="flex justify-between items-center w-full text-left px-3 py-2.5 rounded-md text-gray-300 hover:bg-blue-600 hover:text-white"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <HomeOutlined className="text-sm flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="break-words text-sm leading-tight">
                      {cls.name} - {cls.subject.name}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-2">
                  {openClass === cls.id ? <DownOutlined className="text-xs" /> : <RightOutlined className="text-xs" />}
                </div>
              </button>

              {openClass === cls.id && (
                <div className="ml-8 mt-1 space-y-0.5">
                  {subMenuItems(cls.id).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleMenuItemClick(item.path, cls.id)}
                      className={`flex items-center gap-3 text-sm px-3 py-2 rounded-md w-full text-left ${isSubMenuActive(item.path)}`}
                    >
                      <span className="text-sm flex-shrink-0">{item.icon}</span>
                      <span className="break-words">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="px-3 py-2 text-sm text-gray-400">
            Chưa có lớp học nào
          </div>
        )}
      </div>
    </>
  );

  const studentMenu = (
    <>
      {/* Thêm phần Học tập giống admin */}
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Học tập
      </div>

      <Link
        to="/student_dashboard"
        className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md ${isActive('/student_dashboard')}`}
      >
        <DashboardOutlined className="text-base flex-shrink-0" />
        <span className="break-words">Trang chủ</span>
      </Link>

      <div className="mt-1">
        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Lớp học của tôi
        </div>
        {studentClass.length > 0 ? (
          studentClass.map((cls) => (
            <div key={cls.id} className="mb-1">
              <button
                onClick={() => handleClassClick(cls.id)}
                className="flex justify-between items-center w-full text-left px-3 py-2.5 rounded-md text-gray-300 hover:bg-blue-600 hover:text-white"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <HomeOutlined className="text-sm flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="break-words text-sm leading-tight">
                      {cls.subject_name}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-2">
                  {openClass === cls.id ? <DownOutlined className="text-xs" /> : <RightOutlined className="text-xs" />}
                </div>
              </button>

              {openClass === cls.id && (
                <div className="ml-8 mt-1 space-y-0.5">
                  {subStudentMenuItems(cls.id).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleMenuItemClick(item.path, cls.id)}
                      className={`flex items-center gap-3 text-sm px-3 py-2 rounded-md w-full text-left ${isSubMenuActive(item.path)}`}
                    >
                      <span className="text-sm flex-shrink-0">{item.icon}</span>
                      <span className="break-words">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="px-3 py-2 text-sm text-gray-400">
            Chưa đăng ký lớp học nào
          </div>
        )}
      </div>
    </>
  );

  const adminMenu = (
    <>
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Quản trị hệ thống
      </div>

      <Link to="/admin_dashboard" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md ${isActive('/admin_dashboard')}`}>
        <DashboardOutlined className="text-base flex-shrink-0" />
        <span className="break-words">Trang chủ</span>
      </Link>

      <Link to="/admin/user_list" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md ${isActive('/admin/user_list')}`}>
        <UserSwitchOutlined className="text-base flex-shrink-0" />
        <span className="break-words">Quản lý người dùng</span>
      </Link>

      <Link to="/admin/faculty_list" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md ${isActive('/admin/faculty_list')}`}>
        <BankOutlined className="text-base flex-shrink-0" />
        <span className="break-words">Quản lý khoa-viện</span>
      </Link>

      <Link to="/admin/major_list" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md ${isActive('/admin/major_list')}`}>
        <ProfileOutlined className="text-base flex-shrink-0" />
        <span className="break-words">Quản lý ngành học</span>
      </Link>

      <Link to="/admin/semester_list" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md ${isActive('/admin/semester_list')}`}>
        <CalendarOutlined className="text-base flex-shrink-0" />
        <span className="break-words">Quản lý kỳ học</span>
      </Link>

      <Link to="/admin/subject_list" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md ${isActive('/admin/subject_list')}`}>
        <BookFilledOutlined className="text-base flex-shrink-0" />
        <span className="break-words">Quản lý học phần</span>
      </Link>

      <Link to="/admin/class_list" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md ${isActive('/admin/class_list')}`}>
        <AppstoreOutlined className="text-base flex-shrink-0" />
        <span className="break-words">Quản lý lớp học</span>
      </Link>

      <Link to="/admin/grade_component_list" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md ${isActive('/admin/grade_component_list')}`}>
        <AppstoreOutlined className="text-base flex-shrink-0" />
        <span className="break-words">Quản lý loại điểm</span>
      </Link>

      <Link to="/admin/grade_rule_list" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md ${isActive('/admin/grade_rule_list')}`}>
        <AppstoreOutlined className="text-base flex-shrink-0" />
        <span className="break-words">Quy tắc tính điểm</span>
      </Link>

     

      <Link to="/admin/statistics" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md ${isActive('/admin/statistics')}`}>
        <PieChartOutlined className="text-base flex-shrink-0" />
        <span className="break-words">Thống kê</span>
      </Link>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'flex' : 'hidden'} md:flex md:flex-shrink-0 transition-all duration-300`}>
        <div className="flex flex-col w-64 bg-gray-900 border-r border-gray-700">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <img src="/public/Minimalist logo desi.png" alt="Logo" className="h-10 flex-shrink-0" />
              <h1 className="text-white text-lg font-bold truncate">E-Learning</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 md:hidden flex-shrink-0"
            >
              {sidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            </button>
          </div>

          {/* Navigation */}
          <div className="flex flex-col flex-1 px-2 py-4 overflow-y-auto">
            <nav className="flex-1 space-y-2">
              {/* Hiển thị menu theo role */}
              {user?.role === 'admin' && adminMenu}
              {user?.role === 'teacher' && teacherMenu}
              {user?.role === 'student' && studentMenu}
            </nav>

            {/* User profile at bottom */}
            <div className="mt-auto pt-4 border-t border-gray-700 flex-shrink-0">
              <div className="px-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserOutlined className="text-white text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.full_name || user?.username}
                    </p>
                    <p className="text-xs text-gray-400 capitalize truncate">{user?.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 hidden md:block"
              >
                {sidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full relative">
                  <BellOutlined className="text-lg" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 px-3 py-2 rounded-md hover:bg-gray-100"
                title="Đăng xuất"
              >
                <LogoutOutlined />
                <span className="hidden md:block text-sm">Đăng xuất</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <Outlet key={location.pathname + location.search} />
        </main>
      </div>
    </div>
  );
};

export default Layout;