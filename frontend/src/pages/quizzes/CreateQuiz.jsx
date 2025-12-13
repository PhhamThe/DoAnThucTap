import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiGet, apiPost, apiPut } from '../../api/client';

function CreateQuiz () {
    const { quizId } = useParams(); // quizId là ID của quiz đã tồn tại
    const navigate = useNavigate();

    // State cho danh sách câu hỏi
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [quizTitle, setQuizTitle] = useState('');

    // Fetch câu hỏi khi component mount
    useEffect(() => {
        fetchQuestions();
    }, [quizId]);

    async function fetchQuestions() {
        try {
            setLoading(true);
            // Fetch câu hỏi của quiz
            const questionsResponse = await apiGet(`api/get_questions/${quizId}`);
            if (questionsResponse?.success && questionsResponse.data) {
                setQuestions(questionsResponse.data.map(q => ({
                    ...q,
                    answers: q.answers || [],
                    points: q.points || 1
                })));
            }
            
          
        } catch (error) {
            toast.error('Lỗi khi tải câu hỏi');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    // Thêm câu hỏi mới
    const addQuestion = () => {
        const newQuestion = {
            id: Date.now(),
            question_text: '',
            question_type: 'single',
            answers: [
                { id: 1, answer_text: '', is_correct: false },
                { id: 2, answer_text: '', is_correct: false },
                { id: 3, answer_text: '', is_correct: false },
                { id: 4, answer_text: '', is_correct: false }
            ],
            points: 1
        };
        setQuestions(prev => [...prev, newQuestion]);
    };

    // Cập nhật câu hỏi
    const updateQuestion = (index, field, value) => {
        setQuestions(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                [field]: value
            };

            // Reset correct answers nếu chuyển từ multiple sang single
            if (field === 'question_type' && value === 'single') {
                const hasCorrect = updated[index].answers.some(ans => ans.is_correct);
                if (hasCorrect) {
                    // Chỉ giữ lại 1 đáp án đúng đầu tiên
                    let foundFirst = false;
                    updated[index].answers = updated[index].answers.map(ans => ({
                        ...ans,
                        is_correct: !foundFirst && ans.is_correct ? (foundFirst = true, true) : false
                    }));
                }
            }

            return updated;
        });
    };

    // Cập nhật đáp án của câu hỏi
    const updateAnswer = (questionIndex, answerIndex, field, value) => {
        setQuestions(prev => {
            const updated = [...prev];
            const question = { ...updated[questionIndex] };

            // Cập nhật answer
            question.answers = question.answers.map((ans, idx) =>
                idx === answerIndex
                    ? { ...ans, [field]: value }
                    : ans
            );

            // Nếu là single choice và đánh dấu đúng, bỏ đánh dấu các answer khác
            if (field === 'is_correct' && value === true && question.question_type === 'single') {
                question.answers = question.answers.map((ans, idx) => ({
                    ...ans,
                    is_correct: idx === answerIndex ? true : false
                }));
            }

            updated[questionIndex] = question;
            return updated;
        });
    };

    // Thêm answer mới
    const addAnswer = (questionIndex) => {
        setQuestions(prev => {
            const updated = [...prev];
            const question = { ...updated[questionIndex] };
            const newAnswerId = Math.max(...question.answers.map(a => a.id), 0) + 1;

            question.answers = [
                ...question.answers,
                { id: newAnswerId, answer_text: '', is_correct: false }
            ];

            updated[questionIndex] = question;
            return updated;
        });
    };

    // Xóa answer
    const removeAnswer = (questionIndex, answerIndex) => {
        if (questions[questionIndex].answers.length <= 2) {
            toast.warning('Câu hỏi cần ít nhất 2 đáp án');
            return;
        }

        setQuestions(prev => {
            const updated = [...prev];
            const question = { ...updated[questionIndex] };
            question.answers = question.answers.filter((_, idx) => idx !== answerIndex);
            updated[questionIndex] = question;
            return updated;
        });
    };

    // Xóa câu hỏi
    const removeQuestion = (index) => {
        if (questions.length <= 1) {
            toast.warning('Đề thi cần ít nhất 1 câu hỏi');
            return;
        }

        if (window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
            setQuestions(prev => prev.filter((_, idx) => idx !== index));
        }
    };

    // Di chuyển câu hỏi
    const moveQuestion = (index, direction) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === questions.length - 1) return;

        setQuestions(prev => {
            const updated = [...prev];
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
            return updated;
        });
    };

    // Validate trước khi lưu
    const validateQuiz = () => {
        if (questions.length === 0) {
            toast.error('Đề thi cần ít nhất 1 câu hỏi');
            return false;
        }

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];

            if (!q.question_text.trim()) {
                toast.error(`Câu hỏi ${i + 1}: Vui lòng nhập nội dung câu hỏi`);
                return false;
            }

            if (q.answers.length < 2) {
                toast.error(`Câu hỏi ${i + 1}: Cần ít nhất 2 đáp án`);
                return false;
            }

            // Kiểm tra tất cả answer có nội dung
            for (let j = 0; j < q.answers.length; j++) {
                if (!q.answers[j].answer_text.trim()) {
                    toast.error(`Câu hỏi ${i + 1}, đáp án ${j + 1}: Vui lòng nhập nội dung`);
                    return false;
                }
            }

            // Kiểm tra có ít nhất 1 đáp án đúng
            const hasCorrectAnswer = q.answers.some(ans => ans.is_correct);
            if (!hasCorrectAnswer) {
                toast.error(`Câu hỏi ${i + 1}: Cần ít nhất 1 đáp án đúng`);
                return false;
            }
        }

        return true;
    };

    // Lưu câu hỏi
    const saveQuestions = async () => {
        if (!validateQuiz()) return;

        try {
            setSaving(true);

            // Chuẩn bị dữ liệu để lưu questions
            // Gửi toàn bộ questions lên để replace tất cả
            const questionsData = {
                questions: questions.map(q => ({
                    question_text: q.question_text,
                    question_type: q.question_type,
                    points: q.points,
                    answers: q.answers.map(ans => ({
                        answer_text: ans.answer_text,
                        is_correct: ans.is_correct
                    }))
                }))
            };

            // Gọi API để cập nhật questions của quiz
            const response = await apiPut(`api/multi_questions/${quizId}`, questionsData);

            if (response?.success) {
                toast.success(response.message || 'Lưu câu hỏi thành công');
                
            } else {
                toast.error(response?.message || 'Lưu câu hỏi thất bại');
            }
        } catch (error) {
            toast.error('Lỗi khi lưu câu hỏi');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center min-h-64">
            <div className="text-lg text-gray-600">Đang tải...</div>
        </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Tiêu đề trang */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Quản lý câu hỏi
                </h1>
                {quizTitle && (
                    <p className="text-gray-600 mt-1">
                        Đề thi: <span className="font-semibold">{quizTitle}</span>
                    </p>
                )}
                <p className="text-gray-600 mt-1">
                    Thêm/sửa câu hỏi và đáp án cho đề thi
                </p>
            </div>

            {/* Danh sách câu hỏi */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-800">Danh sách câu hỏi</h2>
                    <button
                        onClick={addQuestion}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Thêm câu hỏi
                    </button>
                </div>

                {questions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {questions.map((question, qIndex) => (
                            <div key={question.id || qIndex} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded">
                                            Câu {qIndex + 1}
                                        </span>
                                        <select
                                            value={question.question_type}
                                            onChange={(e) => updateQuestion(qIndex, 'question_type', e.target.value)}
                                            className="text-sm border border-gray-300 rounded px-2 py-1"
                                        >
                                            <option value="single">Chọn một đáp án</option>
                                            <option value="multiple">Chọn nhiều đáp án</option>
                                        </select>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">Điểm:</span>
                                            <input
                                                type="number"
                                                value={question.points}
                                                onChange={(e) => updateQuestion(qIndex, 'points', parseFloat(e.target.value) || 1)}
                                                min="0.5"
                                                step="0.5"
                                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => moveQuestion(qIndex, 'up')}
                                            disabled={qIndex === 0}
                                            className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => moveQuestion(qIndex, 'down')}
                                            disabled={qIndex === questions.length - 1}
                                            className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => removeQuestion(qIndex)}
                                            className="p-1 text-red-500 hover:text-red-700"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Nội dung câu hỏi */}
                                <div className="mb-4">
                                    <textarea
                                        value={question.question_text}
                                        onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                                        placeholder="Nhập nội dung câu hỏi..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                    />
                                </div>

                                {/* Các đáp án */}
                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-medium text-gray-700">Các đáp án:</h4>
                                        <button
                                            onClick={() => addAnswer(qIndex)}
                                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Thêm đáp án
                                        </button>
                                    </div>

                                    {question.answers.map((answer, aIndex) => (
                                        <div key={answer.id || aIndex} className="flex items-center gap-3">
                                            <input
                                                type={question.question_type === 'multiple' ? 'checkbox' : 'radio'}
                                                checked={answer.is_correct}
                                                onChange={(e) => updateAnswer(qIndex, aIndex, 'is_correct', e.target.checked)}
                                                className="h-4 w-4"
                                            />
                                            <input
                                                type="text"
                                                value={answer.answer_text}
                                                onChange={(e) => updateAnswer(qIndex, aIndex, 'answer_text', e.target.value)}
                                                placeholder={`Đáp án ${aIndex + 1}...`}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={() => removeAnswer(qIndex, aIndex)}
                                                disabled={question.answers.length <= 2}
                                                className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="text-xs text-gray-500">
                                    {question.question_type === 'single'
                                        ? 'Chọn 1 đáp án đúng'
                                        : 'Có thể chọn nhiều đáp án đúng'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Nút hành động */}
            <div className="flex justify-between items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                    Quay lại
                </button>

                <div className="flex gap-3">
                    <button
                        onClick={saveQuestions}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Lưu câu hỏi
                            </>
                        )}
                    </button>
                </div>
            </div>

            <ToastContainer position="bottom-right" autoClose={3000} />
        </div>
    );
}

export default CreateQuiz ;