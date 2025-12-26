import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Send, Loader2, Edit2, Trash2, User } from 'lucide-react';
import { useParams } from "react-router-dom";
import { apiGet, apiPost, apiPut, apiDelete } from '../../api/client';
import { buildFileUrlFromUpload, normalizeFileUpload } from '../../ulities/fileHelpers';

const Chat = ({ classId }) => {
    const { classId: paramClassId } = useParams();
    const effectiveClassId = classId || paramClassId;

    // State
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [userLoading, setUserLoading] = useState(true);

    // Refs
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const pollingRef = useRef(null);
    const lastUpdateRef = useRef(Date.now());

    // Lấy thông tin user hiện tại
    const fetchCurrentUser = useCallback(async () => {
        try {
            const json = await apiGet('api/me');
            if (json?.success && json?.user) {
                const avatarData = normalizeFileUpload(json.user.avatar);
                const avatarUrl = buildFileUrlFromUpload(avatarData);
                setCurrentUser({
                    id: json.user.id,
                    name: json.user.name,
                    email: json.user.email,
                    role: json.user.role,
                    avatar: avatarUrl
                });
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin user:', error);
        } finally {
            setUserLoading(false);
        }
    }, []);

    // Lấy danh sách tin nhắn
    const fetchMessages = useCallback(async (isInitial = false) => {
        if (!effectiveClassId) return;

        try {
            const url = `api/chat/class/${effectiveClassId}/messages`;
            const params = isInitial
                ? '?limit=100'
                : `?since=${lastUpdateRef.current}`;

            const json = await apiGet(url + params);

            if (json?.success) {
                if (isInitial) {
                    setMessages(json.messages || []);
                } else if (json.messages?.length > 0) {
                    setMessages(prev => {
                        const existingIds = new Set(prev.map(m => m.id));
                        const newMessages = json.messages.filter(m => !existingIds.has(m.id));
                        return [...prev, ...newMessages];
                    });
                }

                lastUpdateRef.current = Date.now();
            }
        } catch (err) {
            console.error('Lỗi tải tin nhắn:', err);
        } finally {
            if (isInitial) {
                setLoading(false);
            }
        }
    }, [effectiveClassId]);

    // Gửi tin nhắn mới
    const sendMessage = useCallback(async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        const text = newMessage;
        setNewMessage('');
        setSending(true);

        // Tạo tin nhắn tạm
        const tempId = Date.now();
        const tempMessage = {
            id: tempId,
            class_id: effectiveClassId,
            message: text,
            sender: {
                id: currentUser.id,
                full_name: currentUser.name || 'Bạn',
                avatar: currentUser.avatar,
                role: currentUser.role
            },
            created_at: new Date().toISOString(),
            is_temp: true
        };

        // Thêm vào UI ngay lập tức
        setMessages(prev => [...prev, tempMessage]);

        try {
            // Gửi lên server
            const json = await apiPost(`api/chat/class/${effectiveClassId}/send`, {
                message: text
            });

            if (json?.success && json?.message) {
                // Xử lý avatar cho tin nhắn từ server
                if (json.message.sender?.avatar) {
                    const avatarData = normalizeFileUpload(json.message.sender.avatar);
                    json.message.sender.avatar = buildFileUrlFromUpload(avatarData);
                }

                // Thay thế tin nhắn tạm bằng tin nhắn thật
                setMessages(prev =>
                    prev.map(m =>
                        m.id === tempId ? { ...json.message, id: json.message.id } : m
                    )
                );
            } else {
                // Xóa tin nhắn tạm nếu gửi thất bại
                setTimeout(() => {
                    setMessages(prev => prev.filter(m => m.id !== tempId));
                }, 2000);
            }
        } catch (err) {
            console.error('Lỗi gửi tin nhắn:', err);
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } finally {
            setSending(false);
        }
    }, [newMessage, currentUser, effectiveClassId]);

    // Sửa tin nhắn
    const handleEdit = useCallback(async (id) => {
        if (!editText.trim()) {
            setEditingId(null);
            return;
        }

        try {
            await apiPut(`api/chat/message/${id}`, {
                message: editText
            });

            setMessages(prev =>
                prev.map(m => m.id === id ? { ...m, message: editText } : m)
            );

            setEditingId(null);
            setEditText('');
        } catch (err) {
            console.error('Lỗi sửa tin nhắn:', err);
        }
    }, [editText]);

    // Xóa tin nhắn
    const handleDelete = useCallback(async (id) => {
        if (!window.confirm('Xóa tin nhắn này?')) return;

        try {
            await apiDelete(`api/chat/message/${id}`);
            setMessages(prev => prev.filter(m => m.id !== id));
        } catch (err) {
            console.error('Lỗi xóa tin nhắn:', err);
        }
    }, []);

    // Kiểm tra tin nhắn có phải của mình không
    const isMyMessage = useCallback((message) => {
        return currentUser && message.sender?.id === currentUser.id;
    }, [currentUser]);

    // Format thời gian
    const formatTime = useCallback((dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch {
            return 'Vừa xong';
        }
    }, []);

   

    // Xử lý avatar cho tin nhắn khi fetch
    const processMessages = useCallback((messages) => {
        return messages.map(message => {
            if (message.sender?.avatar) {
                const avatarData = normalizeFileUpload(message.sender.avatar);
                message.sender.avatar = buildFileUrlFromUpload(avatarData);
            }
            return message;
        });
    }, []);

    // Component hiển thị từng tin nhắn
    const MessageItem = React.memo(({ message, isMine, isEditing }) => {
        return (
            <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                {/* Avatar người gửi (chỉ hiện nếu không phải mình) */}
                {!isMine && message.sender?.avatar && (
                  
                    <img
                        src={buildFileUrlFromUpload(normalizeFileUpload(message.sender.avatar))}
                        alt={message.sender.full_name}
                        className="w-6 h-6 rounded-full mt-2 mr-2"
                    />
                )}

                {/* Nội dung tin nhắn */}
                <div className={`max-w-[70%] rounded-lg px-4 py-2 relative group 
                    ${isMine ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}>

                    {/* Tên người gửi */}
                    <div className="font-medium text-sm mb-1">
                        {isMine ? 'Bạn' : message.sender?.full_name || 'Ẩn danh'}
                    </div>

                    {/* Nội dung tin nhắn hoặc form sửa */}
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="flex-1 border rounded px-2 py-1 text-black text-sm"
                                autoFocus
                            />
                            <button
                                onClick={() => handleEdit(message.id)}
                                className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                            >
                                Lưu
                            </button>
                            <button
                                onClick={() => setEditingId(null)}
                                className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
                            >
                                Hủy
                            </button>
                        </div>
                    ) : (
                        <div className="break-words whitespace-pre-wrap">
                            {message.message}
                        </div>
                    )}

                    {/* Thời gian gửi */}
                    <div className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-gray-500'}`}>
                        {formatTime(message.created_at)}
                        {message.is_temp && ' • Đang gửi...'}
                    </div>

                    {/* Nút sửa/xóa (chỉ hiện với tin nhắn của mình) */}
                    {isMine && !isEditing && !message.is_temp && (
                        <div className="absolute -right-10 top-2 hidden group-hover:flex gap-1">
                            <button
                                onClick={() => {
                                    setEditingId(message.id);
                                    setEditText(message.message);
                                }}
                                className="p-1 bg-yellow-500 text-white rounded"
                                title="Sửa tin nhắn"
                            >
                                <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => handleDelete(message.id)}
                                className="p-1 bg-red-500 text-white rounded"
                                title="Xóa tin nhắn"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Avatar của mình (hiển thị bên phải) */}
                {isMine && currentUser?.avatar && (
                    <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-6 h-6 rounded-full mt-2 ml-2"
                    />
                )}
            </div>
        );
    });

    // Effects
    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);

    useEffect(() => {
        if (currentUser && effectiveClassId) {
            fetchMessages(true);

         // Polling để cập nhật tin nhắn mới   
            pollingRef.current = setInterval(() => {
                fetchMessages();
            }, 5000);

            return () => {
                clearInterval(pollingRef.current);
            };
        }
    }, [currentUser, effectiveClassId, fetchMessages]);

    // Xử lý avatar cho tin nhắn khi fetch
    useEffect(() => {
        if (messages.length > 0) {
            const processedMessages = processMessages(messages);
            setMessages(processedMessages);
        }
    }, []);

    // Loading state
    if (userLoading || (loading && currentUser)) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2">Đang tải...</span>
            </div>
        );
    }

    // Error state: không có user
    if (!currentUser) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <User className="w-12 h-12 text-gray-400 mb-2" />
                <h3 className="text-lg font-medium">Không thể xác định người dùng</h3>
                <p className="text-gray-500 mt-1">Vui lòng đăng nhập lại để tiếp tục</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 h-[80vh] flex flex-col shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">Kênh chat lớp học</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danh sách tin nhắn */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
            >
                {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p className="text-lg font-medium">Chưa có tin nhắn nào</p>
                        <p className="text-sm mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
                    </div>
                ) : (
                    messages.map(message => (
                        <MessageItem
                            key={message.id}
                            message={message}
                            isMine={isMyMessage(message)}
                            isEditing={editingId === message.id}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Form gửi tin nhắn */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={sending || !currentUser}
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim() || !currentUser}
                        className="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center disabled:opacity-50"
                    >
                        {sending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
             
            </form>
        </div>
    );
};

export default Chat;