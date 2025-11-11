// utils/fileHelpers.js
const baseUrl = import.meta.env.VITE_API_ENDPOINT || "";

//Chuẩn hóa dữ liệu file từ nhiều định dạng (string JSON, string path, object) thành object thống nhất.
export function normalizeFileUpload(fileUpload) {
    if (!fileUpload) return null;
    if (typeof fileUpload === "string") {
        try {
            return JSON.parse(fileUpload);
        } catch {
            return { path: fileUpload, name: null };
        }
    }
    return typeof fileUpload === "object" ? fileUpload : null;
}
//Tạo URL đầy đủ để truy cập file, tự động thêm base URL và xử lý đường dẫn.
export function buildFileUrlFromUpload(fu) {
    if (!fu) return null;
    let path = fu.path || fu.file || fu.file_name || fu;
    if (!path) return null;
    if (!path.startsWith("/")) path = `/storage/${path}`;
    return `${baseUrl}${path}`.replace(/([^:]\/)\/+/g, "$1");
}

//Chuyển đổi object JavaScript thành FormData để gửi lên server, hỗ trợ cả file và các kiểu dữ liệu thông thường.
export function buildFormData(data) {
    const fd = new FormData();
    Object.entries(data).forEach(([key, value]) => { //trả về một mảng chứa các cặp [key, value] của tất cả các thuộc tính có thể liệt kê (enumerable) của một object.
        if (value === undefined || value === null) return;
        
        if (value instanceof File) {
            fd.append(key, value);
        } else {
            fd.append(key, value);
        }
    });
    return fd;
}

