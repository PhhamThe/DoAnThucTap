import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet } from '../../api/client';
import { toast } from 'react-toastify';

function QuizResultPage() {
    const { resultId } = useParams();
    const navigate = useNavigate();
    
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResult();
    }, [resultId]);

    const fetchResult = async () => {
        try {
            const response = await apiGet(`api/student/quiz/result/${resultId}`);
            if (response?.success) {
                setResult(response.data);
            } else {
                toast.error('Không thể tải kết quả');
            }
        } catch (error) {
            toast.error('Lỗi khi tải kết quả');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-6">Đang tải...</div>;
    }

    if (!result) {
        return (
            <div className="p-6">
                <p className="text-red-600">Không tìm thấy kết quả</p>
                <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
                    Quay lại
                </button>
            </div>
        );
    }

    const { summary, detailed_results, quiz } = result;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Kết quả bài thi</h1>
                <p className="text-gray-600 mb-6">{quiz.title}</p>
                
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-blue-50 p-4 rounded">
                        <p className="text-sm text-blue-600">Điểm số</p>
                        <p className="text-2xl font-bold">{summary.score}/{detailed_results.length}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded">
                        <p className="text-sm text-green-600">Câu đúng</p>
                        <p className="text-2xl font-bold">{summary.correct_answers}/{summary.total_questions}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded">
                        <p className="text-sm text-purple-600">Tỷ lệ</p>
                        <p className="text-2xl font-bold">{summary.percentage}%</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                        <p className="text-sm text-gray-600">Hoàn thành</p>
                        <p className="text-lg">{new Date(summary.completed_at).toLocaleString()}</p>
                    </div>
                </div>

                {/* Detailed Results */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800">Chi tiết câu trả lời</h2>
                    
                    {detailed_results.map((item, index) => (
                        <div key={item.question_id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-medium text-gray-800">Câu {index + 1}: {item.question_text}</h3>
                                <span className={`px-2 py-1 rounded text-sm ${
                                    item.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {item.is_correct ? 'Đúng' : 'Sai'}
                                </span>
                            </div>
                            
                            <div className="space-y-2">
                                {item.answers.map(answer => (
                                    <div key={answer.id} className={`p-3 rounded ${
                                        answer.is_correct 
                                            ? 'bg-green-50 border border-green-200'
                                            : answer.is_selected && !answer.is_correct
                                            ? 'bg-red-50 border border-red-200'
                                            : 'bg-gray-50'
                                    }`}>
                                        <div className="flex items-center gap-2">
                                            <span>{answer.answer_text}</span>
                                            {answer.is_correct && (
                                                <span className="text-green-600 text-sm">(Đáp án đúng)</span>
                                            )}
                                            {answer.is_selected && !answer.is_correct && (
                                                <span className="text-red-600 text-sm">(Bạn chọn)</span>
                                            )}
                                            {answer.is_selected && answer.is_correct && (
                                                <span className="text-green-600 text-sm">(Bạn chọn đúng)</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t">
                    <button
                        onClick={() => navigate(`/classes/${quiz.class_id}/quizzes`)}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Quay lại danh sách đề thi
                    </button>
                </div>
            </div>
        </div>
    );
}

export default QuizResultPage;