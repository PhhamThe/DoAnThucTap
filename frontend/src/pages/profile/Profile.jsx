import React, { useEffect, useState } from 'react'
import { apiGet, apiPut } from '../../api/client';
import { normalizeFileUpload, buildFileUrlFromUpload, buildFormData } from '../../ulities/fileHelpers';

function Profile() {
    const [myInfo, setMyInfo] = useState({
        detail_info: {}
    });
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        birth_date: '',
        gender: '',
        address: '',
        description: '',
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showAvatarModal, setShowAvatarModal] = useState(false); // Thêm state này

    async function fetchMyInfo() {
        const json = await apiGet('api/me');
        setMyInfo(json.user);
        
        // Set form data từ response
        setFormData({
            full_name: json.user.full_name || '',
            email: json.user.email || '',
            phone: json.user.detail_info?.phone || '',
            birth_date: json.user.detail_info?.birth_date || '',
            gender: json.user.detail_info?.gender || '',
            address: json.user.detail_info?.address || '',
            description: json.user.detail_info?.description || '',
            current_password: '',
            new_password: '',
            confirm_password: ''
        });

        // Hiển thị avatar nếu có
        if (json.user.avatar) {
            const avatarData = normalizeFileUpload(json.user.avatar);
            if (avatarData) {
                const avatarUrl = buildFileUrlFromUpload(avatarData);
                setAvatarPreview(avatarUrl);
            }
        }
    }

    useEffect(() => {
        fetchMyInfo();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteAvatar = () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa ảnh đại diện?')) {
            setAvatarFile(null);
            setAvatarPreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Kiểm tra mật khẩu
            if (formData.current_password && formData.new_password) {
                if (formData.new_password !== formData.confirm_password) {
                    throw new Error('Mật khẩu xác nhận không khớp');
                }
            }

            // Tạo data object và dùng buildFormData
            const submitData = {};
            
            // Thêm các trường thông tin
            ['full_name', 'email', 'phone', 'birth_date', 'gender', 'address', 'description'].forEach(field => {
                if (formData[field]) submitData[field] = formData[field];
            });

            // Thêm mật khẩu nếu có
            if (formData.current_password && formData.new_password) {
                submitData.current_password = formData.current_password;
                submitData.new_password = formData.new_password;
                submitData.confirm_password = formData.confirm_password;
            }

            // Thêm avatar nếu có
            if (avatarFile) submitData.avatar = avatarFile;

            // Build FormData
            const formDataToSend = buildFormData(submitData);

            // Gọi API
            const response = await apiPut('api/profile/update', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (response.success) {
                setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
                
                setFormData(prev => ({
                    ...prev,
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                }));
                
                await fetchMyInfo();
                setAvatarFile(null);
            } else {
                setMessage({ type: 'error', text: response.message || 'Có lỗi xảy ra' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Có lỗi xảy ra khi cập nhật thông tin' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        fetchMyInfo();
        setAvatarFile(null);
        setMessage({ type: '', text: '' });
    };

    return (
        <div className="p-6">
            <div className="max-w-5xl mx-auto">
                {/* Modal xem ảnh lớn - Thêm vào đây */}
                {showAvatarModal && avatarPreview && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowAvatarModal(false)}>
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center p-4 border-b">
                                <h3 className="text-lg font-semibold">Ảnh đại diện</h3>
                                <button onClick={() => setShowAvatarModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-4">
                                <img src={avatarPreview} alt="Ảnh đại diện" className="w-full h-auto max-h-[60vh] object-contain mx-auto" />
                            </div>
                        </div>
                    </div>
                )}

                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">Thông tin cá nhân</h1>
                    <p className="text-gray-600">Quản lý thông tin tài khoản của bạn</p>
                </div>

                {message.text && (
                    <div className={`mb-4 p-3 rounded ${
                        message.type === 'success' 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="flex flex-col items-center md:w-1/4">
                                <div className="relative w-32 h-32 bg-gray-200 rounded-full mb-4 cursor-pointer" onClick={() => avatarPreview && setShowAvatarModal(true)}>
                                    {avatarPreview ? (
                                        <img 
                                            src={avatarPreview}
                                            alt="Avatar" 
                                            className="w-full h-full object-cover rounded-full hover:opacity-90 transition-opacity"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                                            Ảnh
                                        </div>
                                    )}
                                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700" onClick={(e) => e.stopPropagation()}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*" 
                                            onChange={handleAvatarChange}
                                        />
                                    </label>
                                </div>
                                <div className="font-medium text-gray-900">{myInfo.full_name}</div>
                                {
                                    myInfo.role === 'student' && <div className="text-center">
                                        <div className="text-sm text-gray-600">Mã số sinh viên : {myInfo.detail_info.mssv || ''}</div>
                                    </div>
                                }
                                <button 
                                    type="button" 
                                    onClick={handleDeleteAvatar}
                                    className="mt-4 text-sm text-blue-600 hover:text-blue-700"
                                >
                                    Xóa ảnh
                                </button>
                            </div>

                            <div className="md:w-3/4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                                        <input
                                            type="text"
                                            name="full_name"
                                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nhập họ và tên"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nhập email"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nhập số điện thoại"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                                        <input
                                            type="date"
                                            name="birth_date"
                                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.birth_date}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                                        <input
                                            type="text"
                                            name="address"
                                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nhập địa chỉ"
                                            value={formData.address}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {
                        myInfo.role === 'student' &&
                        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin học tập</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Khoa/Viện</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 cursor-not-allowed"
                                        value={myInfo.detail_info.faculty?.name || ''}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Chuyên ngành</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 cursor-not-allowed"
                                        value={myInfo.detail_info.major?.name || ''}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                    }

                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Đổi mật khẩu</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                                <input
                                    type="password"
                                    name="current_password"
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nhập mật khẩu hiện tại"
                                    value={formData.current_password}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                                <input
                                    type="password"
                                    name="new_password"
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nhập mật khẩu mới"
                                    value={formData.new_password}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                                <input
                                    type="password"
                                    name="confirm_password"
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Xác nhận mật khẩu mới"
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <button 
                            type="button" 
                            onClick={handleCancel}
                            className="border border-gray-300 px-5 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Đang xử lý...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Profile