import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet } from '../../api/client';
import { toast } from 'react-toastify';

function QuizResultPage() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResult();
    }, [quizId]);

    const fetchResult = async () => {
        try {
            const response = await apiGet(`api/student/quiz/result/${quizId}`);
            if (response?.success) {
                setResult(response.data);
            } else {
                toast.error(response?.message || 'Không thể tải kết quả');
            }
        } catch (error) {
            toast.error('Lỗi kết nối máy chủ');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Đang tải kết quả...</p>
                </div>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">Không tìm thấy kết quả</h2>
                    <p className="text-gray-600 mb-6">Bài thi này chưa có kết quả hoặc đã xảy ra lỗi.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const { summary, detailed_results, quiz } = result;
    const percentage = summary.percentage || 0;
    const isPassed = percentage >= 50;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="mb-2">
                        <h1 className="text-2xl font-bold text-gray-900">Kết quả bài thi</h1>
                        <p className="text-gray-600 mt-1">{quiz.title}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-500">
                            Hoàn thành: {new Date(summary.completed_at).toLocaleDateString('vi-VN')}
                        </div>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Quay lại
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Summary */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Overall Score Card */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-800 mb-4">Kết quả chung</h3>
                            
                            <div className="text-center mb-6">
                                <div className="relative inline-flex items-center justify-center">
                                    <div className="relative">
                                        <svg className="w-32 h-32">
                                            <circle
                                                className="text-gray-200"
                                                strokeWidth="8"
                                                stroke="currentColor"
                                                fill="transparent"
                                                r="56"
                                                cx="64"
                                                cy="64"
                                            />
                                            <circle
                                                className={`${isPassed ? 'text-green-500' : 'text-red-500'}`}
                                                strokeWidth="8"
                                                strokeLinecap="round"
                                                stroke="currentColor"
                                                fill="transparent"
                                                r="56"
                                                cx="64"
                                                cy="64"
                                                strokeDasharray={`${percentage * 3.51} 351`}
                                                strokeDashoffset="0"
                                                transform="rotate(-90 64 64)"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <div className={`text-3xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                                                    {percentage}%
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1">Tỷ lệ đúng</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {/* ĐIỂM SỐ - THÊM VÀO ĐÂY */}
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Điểm</span>
                                    <span className="font-medium text-blue-600">
                                        {summary.score}/{detailed_results.length}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Trạng thái</span>
                                    <span className={`font-medium ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                                        {isPassed ? 'ĐẠT' : 'KHÔNG ĐẠT'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Số câu hỏi</span>
                                    <span className="font-medium">{summary.total_questions}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Câu đúng</span>
                                    <span className="font-medium text-green-600">{summary.correct_answers}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-600">Câu sai</span>
                                    <span className="font-medium text-red-600">{summary.total_questions - summary.correct_answers}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Questions */}
                    <div className="lg:col-span-2">
                        {/* Chi tiết câu hỏi */}
                        <div className="bg-white rounded-lg border border-gray-200 mb-6">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-800">Chi tiết câu hỏi ({detailed_results.length})</h3>
                                    <div className="text-sm text-gray-600">
                                        Tổng điểm: <span className="font-medium text-blue-600">{summary.score}/{detailed_results.length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Question List */}
                            <div className="p-6">
                                <div className="space-y-6">
                                    {detailed_results.map((item, index) => (
                                        <div key={item.question_id} className="border border-gray-200 rounded-lg">
                                            {/* Question Header */}
                                            <div className={`px-4 py-3 border-b ${item.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                                            item.is_correct 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {index + 1}
                                                        </div>
                                                        <span className={`font-medium ${
                                                            item.is_correct ? 'text-green-700' : 'text-red-700'
                                                        }`}>
                                                            {item.is_correct ? 'Đúng' : 'Sai'}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-gray-500">
                                                        {item.question_type === 'single' ? 'Chọn một đáp án' : 'Chọn nhiều đáp án'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Question Content */}
                                            <div className="p-4">
                                                <p className="text-gray-800 font-medium mb-4">{item.question_text}</p>
                                                
                                                {/* Answers */}
                                                <div className="space-y-2">
                                                    {item.answers.map(answer => (
                                                        <div
                                                            key={answer.id}
                                                            className={`p-3 rounded border ${
                                                                answer.is_correct && answer.is_selected
                                                                    ? 'bg-green-50 border-green-300'
                                                                    : answer.is_correct && !answer.is_selected
                                                                    ? 'bg-green-50 border-green-200'
                                                                    : !answer.is_correct && answer.is_selected
                                                                    ? 'bg-red-50 border-red-200'
                                                                    : 'bg-white border-gray-200'
                                                            }`}
                                                        >
                                                            <div className="flex items-start">
                                                                <div className="flex-shrink-0 mt-0.5">
                                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                                        answer.is_correct
                                                                            ? 'border-green-500 bg-green-500'
                                                                            : answer.is_selected
                                                                            ? 'border-red-500 bg-red-500'
                                                                            : 'border-gray-300'
                                                                    }`}>
                                                                        {answer.is_correct || answer.is_selected ? (
                                                                            <span className={`text-xs ${answer.is_correct ? 'text-white' : 'text-white'}`}>
                                                                                {answer.is_correct ? '✓' : '✗'}
                                                                            </span>
                                                                        ) : null}
                                                                    </div>
                                                                </div>
                                                                <span className="ml-3 text-gray-800">{answer.answer_text}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuizResultPage;