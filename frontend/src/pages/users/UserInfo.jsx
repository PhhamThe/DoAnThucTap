import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiGet } from '../../api/client';

function UserInfo() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(true);

    async function fetchUserDetail() {
        try {
            setLoading(true);
            const json = await apiGet(`api/users/${userId}`);

            if (json?.success === false) {
                toast.error(json?.message || 'Không tìm thấy người dùng');
                return;
            }

            setUser(json?.data || {});
        } catch (err) {
            toast.error('Không thể tải thông tin người dùng');
            navigate('/users');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUserDetail();
    }, [userId])


    // Định dạng ngày
    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa cập nhật';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Quay lại trang danh sách
    const handleBack = () => {
        navigate('/users');
    };


    if (loading) {
        return (
            <div className="p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Đang tải thông tin người dùng...</span>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="p-6">
            <div className="max-w-6xl mx-auto">
               
                {/* Tiêu đề chính */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                     
                        <p className="text-gray-600">Thông tin chi tiết người dùng</p>
                    </div>
                    <div className="flex gap-3">
                        <span className={`px-4 py-2 rounded-lg text-sm font-medium ${user.role === 'admin' ? 'bg-red-50 text-red-700 border border-red-200' :
                            user.role === 'teacher' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                'bg-green-50 text-green-700 border border-green-200'
                            }`}>
                            {user.role === 'admin' ? 'Quản trị viên' :
                                user.role === 'teacher' ? 'Giáo viên' : 'Sinh viên'}
                        </span>
                     
                    </div>
                </div>

                {/* Grid 2 cột */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Phần 1: Thông tin tài khoản */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-6 py-5 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800">Thông tin tài khoản</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-5">
                                <div className="flex items-start">
                                    <div className="w-1/3">
                                        <label className="text-sm font-medium text-gray-500">Tên đăng nhập</label>
                                    </div>
                                    <div className="w-2/3">
                                        <p className="text-gray-800 font-medium">{user.username || 'Chưa cập nhật'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="w-1/3">
                                        <label className="text-sm font-medium text-gray-500">Email</label>
                                    </div>
                                    <div className="w-2/3">
                                        <p className="text-gray-800">{user.email || 'Chưa cập nhật'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="w-1/3">
                                        <label className="text-sm font-medium text-gray-500">Vai trò</label>
                                    </div>
                                    <div className="w-2/3">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                            user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {user.role === 'admin' ? 'Quản trị viên' :
                                                user.role === 'teacher' ? 'Giáo viên' : 'Sinh viên'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="w-1/3">
                                        <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                                    </div>
                                    <div className="w-2/3">
                                        <div className="flex items-center">
                                            <div className={`w-2 h-2 rounded-full mr-2 ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                            <span className="text-gray-800">
                                                {user.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="w-1/3">
                                        <label className="text-sm font-medium text-gray-500">Ngày tạo</label>
                                    </div>
                                    <div className="w-2/3">
                                        <p className="text-gray-800">{formatDate(user.created_at)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Phần 2: Thông tin chi tiết */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-6 py-5 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800">Thông tin chi tiết</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-5">
                                <div className="flex items-start">
                                    <div className="w-1/3">
                                        <label className="text-sm font-medium text-gray-500">Họ và tên</label>
                                    </div>
                                    <div className="w-2/3">
                                        <p className="text-gray-800 font-medium">{user.full_name || 'Chưa cập nhật'}</p>
                                    </div>
                                </div>

                                {user.role === 'student' && user.major_id && (
                                    <div className="flex items-start">
                                        <div className="w-1/3">
                                            <label className="text-sm font-medium text-gray-500">Ngành học</label>
                                        </div>
                                        <div className="w-2/3">
                                            <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-800 rounded-lg">
                                                {user.major_name || user.major_id}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {user.info?.phone && (
                                    <div className="flex items-start">
                                        <div className="w-1/3">
                                            <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                                        </div>
                                        <div className="w-2/3">
                                            <p className="text-gray-800">{user.info.phone}</p>
                                        </div>
                                    </div>
                                )}

                                {user.info?.address && (
                                    <div className="flex items-start">
                                        <div className="w-1/3">
                                            <label className="text-sm font-medium text-gray-500">Địa chỉ</label>
                                        </div>
                                        <div className="w-2/3">
                                            <p className="text-gray-800">{user.info.address}</p>
                                        </div>
                                    </div>
                                )}

                                {user.role === 'student' && user.info?.mssv && (
                                    <div className="flex items-start">
                                        <div className="w-1/3">
                                            <label className="text-sm font-medium text-gray-500">Mã số sinh viên</label>
                                        </div>
                                        <div className="w-2/3">
                                            <p className="text-gray-800">{user.info.mssv}</p>
                                        </div>
                                    </div>
                                )}
                                {user.info?.birth_date && (
                                    <div className="flex items-start">
                                        <div className="w-1/3">
                                            <label className="text-sm font-medium text-gray-500">Ngày sinh</label>
                                        </div>
                                        <div className="w-2/3">
                                            <p className="text-gray-800">{user.info.birth_date}</p>
                                        </div>
                                    </div>
                                )}
                                {user.info?.gender && (
                                    <div className="flex items-start">
                                        <div className="w-1/3">
                                            <label className="text-sm font-medium text-gray-500">Giới tính</label>
                                        </div>
                                        <div className="w-2/3">
                                            <p className="text-gray-800">{user.info.gender}</p>
                                        </div>
                                    </div>
                                )}
                                {user.note && (
                                    <div className="pt-5 border-t border-gray-100">
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Ghi chú</label>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-gray-700 whitespace-pre-line">{user.note}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>


            </div>

            <ToastContainer position="bottom-right" autoClose={3000} />
        </div>
    );
}

export default UserInfo;