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
            if (response?.success) setResult(response.data);
            else toast.error('Không thể tải kết quả');
        } catch {
            toast.error('Lỗi khi tải kết quả');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-6 text-center">Đang tải...</div>;

    if (!result) return (
        <div className="p-6 text-center">
            <p className="text-red-600 mb-4">Không tìm thấy kết quả</p>
            <button onClick={() => navigate(-1)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Quay lại
            </button>
        </div>
    );

    const { summary, detailed_results, quiz } = result;

    return (
        <div className="max-w-3xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow p-5">
                <div className="mb-6">
                    <h1 className="text-xl font-bold mb-1">Kết quả bài thi</h1>
                    <p className="text-gray-600 text-sm">{quiz.title}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-blue-50 p-3 rounded text-center">
                        <p className="text-blue-600 text-sm">Điểm</p>
                        <p className="text-xl font-bold">{summary.score}/{detailed_results.length}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded text-center">
                        <p className="text-green-600 text-sm">Câu đúng</p>
                        <p className="text-xl font-bold">{summary.correct_answers}/{summary.total_questions}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded text-center">
                        <p className="text-purple-600 text-sm">Tỷ lệ</p>
                        <p className="text-xl font-bold">{summary.percentage}%</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-center">
                        <p className="text-gray-600 text-sm">Hoàn thành</p>
                        <p className="text-sm">{new Date(summary.completed_at).toLocaleString()}</p>
                    </div>
                </div>

                <h2 className="text-lg font-semibold mb-4">Chi tiết câu trả lời</h2>
                
                <div className="space-y-4">
                    {detailed_results.map((item, index) => (
                        <div key={item.question_id} className="border border-gray-300 rounded p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-medium">Câu {index + 1}</p>
                                    <p className="text-sm text-gray-600 mt-1">{item.question_text}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded ${
                                    item.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {item.is_correct ? 'Đúng' : 'Sai'}
                                </span>
                            </div>
                            
                            <div className="space-y-2">
                                {item.answers.map(answer => (
                                    <div key={answer.id} className={`p-2 rounded text-sm ${
                                        answer.is_correct 
                                            ? 'bg-green-50 border border-green-200'
                                            : answer.is_selected && !answer.is_correct
                                            ? 'bg-red-50 border border-red-200'
                                            : 'bg-gray-50'
                                    }`}>
                                        <div className="flex justify-between">
                                            <span>{answer.answer_text}</span>
                                            <span className={`text-xs ${
                                                answer.is_correct ? 'text-green-600' : 
                                                answer.is_selected ? 'text-red-600' : 'text-gray-400'
                                            }`}>
                                                {answer.is_correct && answer.is_selected && '✓ Đã chọn đúng'}
                                                {answer.is_correct && !answer.is_selected && '✓ Đáp án đúng'}
                                                {!answer.is_correct && answer.is_selected && '✗ Đã chọn sai'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t text-center">
                    <button
                        onClick={() => navigate(`/quizzes/${quiz.class_id}`)}
                        className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        </div>
    );
}

export default QuizResultPage;