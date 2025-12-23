const AdminDashboard = () => {
    return (
        <div className="p-6">
            {/* Hình ảnh Trường Đại Học Vinh */}
            <div className="relative overflow-hidden rounded-lg max-w-5xl mx-auto">
                <div className="relative aspect-[16/9]">
                    <img 
                        src="https://i.vietgiaitri.com/2020/7/8/an-tuong-ve-dep-truong-dai-hoc-vinh-ee4-5069455.jpg" 
                        alt="Trường Đại học Vinh"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                        <div className="p-8 text-white">
                            <div className="text-3xl font-bold mb-2">ĐẠI HỌC VINH</div>
                            <div className="text-lg opacity-90">Hệ thống Quản lý Học tập</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer đơn giản */}
            <div className="mt-8 text-center">
                <div className="text-sm text-gray-500">Phiên bản Quản trị viên</div>
                <div className="mt-2 text-xs text-gray-400">© 2024 Đại học Vinh</div>
            </div>
        </div>
    );
};

export default AdminDashboard;