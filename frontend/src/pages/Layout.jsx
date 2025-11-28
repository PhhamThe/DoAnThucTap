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
  MenuUnfoldOutlined
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
    // Mock data - thay bằng API call thực tế
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
    location.pathname === path
      ? ' bg-[#1E40AF] text-white'
      : 'text-white hover:bg-gray-700 ';

  const isSubMenuActive = (path) =>
    location.pathname === path
      ? 'bg-[#1E40AF] text-white'
      : 'text-gray-300 hover:bg-gray-700';

  const subMenuItems = (classId) => [
    {
      id: 'assignments',
      label: 'Bài thực hành',
      icon: <FileTextOutlined />,
      path: `admin/assignment-list/${classId}/`
    },
    {
      id: 'students',
      label: 'Quản lý sinh viên',
      icon: <TeamOutlined />,
      path: `admin/student_by_class/${classId}`
    },
    {
      id: 'materials',
      label: 'Bài giảng',
      icon: <BookOutlined />,
      path: `admin/chapters/${classId}/`
    },
    {
      id: 'practice',
      label: 'Kiểm tra',
      icon: <CodeOutlined />,
      path: `admin/class/${classId}/practice`
    },
    {
      id: 'discussion',
      label: 'Thảo luận',
      icon: <MessageOutlined />,
      path: `admin/class/${classId}/discussion`
    },
    {
      id: 'grades',
      label: 'Bảng điểm',
      icon: <BarChartOutlined />,
      path: `admin/class/${classId}/grades`
    },
  ];

  const subStudentMenuItems = (classId) => [
    {
      id: 'assignments',
      label: 'Bài thực hành',
      icon: <FileTextOutlined />,
      path: `/assignment-list/${classId}/`
    },
    {
      id: 'materials',
      label: 'Tài liệu học tập',
      icon: <BookOutlined />,
      path: `/chapters/${classId}`
    },
    {
      id: 'practice',
      label: 'Kiểm tra',
      icon: <CodeOutlined />,
      path: `/class/${classId}/practice`
    },
    {
      id: 'discussion',
      label: 'Thảo luận',
      icon: <MessageOutlined />,
      path: `/class/${classId}/discussion`
    },
    {
      id: 'grades',
      label: 'Điểm số',
      icon: <BarChartOutlined />,
      path: `/class/${classId}/grades`
    },
  ];

  const teacherMenu = (
    <>
      <Link
        to="/teacher_dashboard"
        className={`group flex items-center px-4 py-3 text-md font-medium transition-all duration-200 ${isActive('/teacher_dashboard')}`}
      >
        <div className="flex items-center">
          <span className="ml-2">Trang chủ</span>
        </div>
      </Link>

      <div className="mt-2 border-t border-gray-600 pt-2">
        {teacherClass.map((cls) => (
          <div key={cls.id} className="mb-1">
            <button
              onClick={() => setOpenClass(openClass === cls.id ? null : cls.id)}
              className="flex justify-between items-center w-full text-left px-4 py-3 text-md text-white hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="flex items-center flex-1 min-w-0">
                <span className="break-words whitespace-normal text-left flex-1">
                  {cls.name} - {cls.subject.name}
                </span>
              </div>
              {openClass === cls.id ? <DownOutlined className="text-xs flex-shrink-0 ml-2" /> : <RightOutlined className="text-xs flex-shrink-0 ml-2" />}
            </button>

            {openClass === cls.id && (
              <div className="ml-2 mt-1 space-y-1 border-l border-gray-600">
                {subMenuItems(cls.id).map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`flex items-center gap-3 text-md px-4 py-2 mx-2 transition-all duration-200 ${isSubMenuActive(item.path)}`}
                  >
                    <span className="text-md flex-shrink-0">{item.icon}</span>
                    <span className="break-words whitespace-normal flex-1">{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  const studentMenu = (
    <>
      <Link
        to="/student_dashboard"
        className={`group flex items-center px-4 py-3 text-md font-medium transition-all duration-200 ${isActive('/student_dashboard')}`}
      >
        <div className="flex items-center">
          <span className="ml-2">Trang chủ</span>
        </div>
      </Link>

      <div className="mt-2 border-t border-gray-600 pt-2">
        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Lớp học của tôi
        </div>
        {studentClass.map((cls) => (
          <div key={cls.id} className="mb-1">
            <button
              onClick={() => setOpenClass(openClass === cls.id ? null : cls.id)}
              className="flex justify-between items-center w-full text-left px-4 py-3 text-md text-white hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="flex items-center flex-1 min-w-0">
                <span className="break-words whitespace-normal text-left flex-1">
                  {cls.subject_name}
                </span>
              </div>
              {openClass === cls.id ? <DownOutlined className="text-xs flex-shrink-0 ml-2" /> : <RightOutlined className="text-xs flex-shrink-0 ml-2" />}
            </button>
            {openClass === cls.id && (
              <div className="ml-2 mt-1 space-y-1 border-l border-gray-600">
                {subStudentMenuItems(cls.id).map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`flex items-center gap-3 text-md px-4 py-2 mx-2 rounded transition-all duration-200 ${isSubMenuActive(item.path)}`}
                  >
                    <span className="text-md flex-shrink-0">{item.icon}</span>
                    <span className="break-words whitespace-normal flex-1">{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  const adminMenu = (
    <>
      <Link
        to="/admin_dashboard"
        className={`group flex items-center px-4 py-3 text-md font-medium transition-all duration-200 ${isActive('/admin_dashboard')}`}
      >
        <div className="flex items-center">
          <span className="ml-2">Trang chủ</span>
        </div>
      </Link>

      <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Quản trị hệ thống
      </div>
      <Link to="/admin/user_list" className={`group flex items-center px-4 py-3 text-md  text-md text-white hover:bg-gray-700 transition-colors duration-200 ${isActive('/user_list')}`}>
        Quản lý người dùng
      </Link>
      <Link to="/admin/faculty_list" className={`group flex items-center px-4 py-3 text-md  text-md text-white hover:bg-gray-700 transition-colors duration-200 ${isActive('/faculty_list')}`}>
        Quản lý khoa-viện
      </Link>
      <Link to="/admin/major_list" className={`group flex items-center px-4 py-3 text-md  text-md text-white hover:bg-gray-700 transition-colors duration-200 ${isActive('/major_list')}`}>
        Quản lý ngành học
      </Link>
      <Link to="/admin/semester_list" className={`group flex items-center px-4 py-3 text-md  text-md text-white hover:bg-gray-700 transition-colors duration-200 ${isActive('/semester_list')}`}>
        Quản lý kỳ học
      </Link>
      <Link to="/admin/subject_list" className={`group flex items-center px-4 py-3 text-md  text-md text-white hover:bg-gray-700 transition-colors duration-200 ${isActive('/subject_list')}`}>
        Quản lý học phần
      </Link>
      <Link to="/admin/class_list" className={`group flex items-center px-4 py-3 text-md  text-md text-white hover:bg-gray-700 transition-colors duration-200 ${isActive('/class_list')}`}>
        Quản lý lớp học
      </Link>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-200">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'flex' : 'hidden'} md:flex md:flex-shrink-0`}>
        <div className="flex flex-col w-64 bg-[#111827]">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <img src="/public/Minimalist logo desi.png" alt="" className='h-[70px]' />
              <h1 className="text-white text-xl font-bold ml-2">Elearning</h1>
            </div>

            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {user?.role === 'admin' && adminMenu}
                {user?.role === 'teacher' && teacherMenu}
                {user?.role === 'student' && studentMenu}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-[#2563EB] shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-white hover:bg-blue-600 md:hidden"
              >
                {sidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
              </button>
              <h2 className="ml-2 text-lg font-semibold text-white">
                {location.pathname.includes('dashboard') && 'Dashboard'}
                {location.pathname.includes('assignment') && 'Bài thực hành'}
                {location.pathname.includes('student') && 'Quản lý học sinh'}
                {location.pathname.includes('lesson') && 'Bài giảng'}
                {location.pathname.includes('chapters') && 'Tài liệu học tập'}
                {location.pathname.includes('practice') && 'Kiểm tra'}
                {location.pathname.includes('discussion') && 'Thảo luận'}
                {location.pathname.includes('grade') && 'Điểm số'}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 text-white hover:bg-blue-600 rounded-full relative transition-colors duration-200">
                  <BellOutlined className="text-lg" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
              </div>

              {/* User menu */}
              <div className="relative">
                <button className="flex items-center space-x-2 text-white hover:text-white">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <UserOutlined className="text-white text-md" />
                  </div>
                  <span className="hidden md:block text-md font-medium">
                    {user?.full_name || user?.username}
                  </span>
                </button>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-white hover:text-white p-2 rounded-md hover:bg-blue-600 transition-colors duration-200"
                title="Đăng xuất"
              >
                <LogoutOutlined />
                <span className="hidden md:block text-md">Đăng xuất</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;