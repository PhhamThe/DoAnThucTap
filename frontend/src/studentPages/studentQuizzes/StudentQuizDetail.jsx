import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiGet, apiPost } from '../../api/client';

function StudentQuizDetail() {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const [quizData, setQuizData] = useState(null);
    const [questionsList, setQuestionsList] = useState([]);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [hasQuizStarted, setHasQuizStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizStatus, setQuizStatus] = useState('checking');

    const startTimeRef = useRef(null);
    const timerIntervalRef = useRef(null);

    // Lấy thông tin và kiểm tra trạng thái bài thi
    const fetchQuizAndCheckStatus = async () => {
        try {
            setIsLoading(true);
            setQuizStatus('checking');

            const statusResponse = await apiGet(`api/student/quiz/${quizId}/status`);

            if (!statusResponse?.success) {
                setQuizStatus('error');
                toast.error('Không thể kiểm tra trạng thái đề thi');
                return;
            }

            const { quiz_status, has_taken, quiz } = statusResponse.data;

            if (has_taken) {
                setQuizStatus('already_taken');
                return;
            }

            if (quiz_status === 'not_started') {
                setQuizStatus('not_started');
                return;
            }

            if (quiz_status === 'ended') {
                setQuizStatus('ended');
                return;
            }

            const now = new Date();
            const quizStartTime = new Date(quiz.start_time);
            const quizEndTime = new Date(quizStartTime.getTime() + (quiz.time_limit * 60000));

            if (now > quizEndTime) {
                setQuizStatus('ended');
                return;
            }

            if (now < quizStartTime) {
                setQuizStatus('not_started');
                return;
            }

            const quizResponse = await apiGet(`api/student/quiz/${quizId}`);

            if (quizResponse?.success) {
                const fetchedQuizData = quizResponse.data;
                setQuizData(fetchedQuizData);
                setQuizStatus('available');
                setQuestionsList(fetchedQuizData.questions || []);

                const initialAnswers = {};
                (fetchedQuizData.questions || []).forEach(question => {
                    initialAnswers[question.id] = question.question_type === 'single' ? null : [];
                });
                setSelectedAnswers(initialAnswers);

                if (fetchedQuizData.time_limit) {
                    const now = new Date();
                    const startTime = new Date(fetchedQuizData.start_time);
                    const endTime = new Date(startTime.getTime() + (fetchedQuizData.time_limit * 60000));
                    const remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
                    setTimeRemaining(remainingSeconds);
                    startTimeRef.current = now;
                }
            } else {
                setQuizStatus('error');
                toast.error('Không thể tải nội dung đề thi');
            }
        } catch (error) {
            console.error('Error:', error);
            setQuizStatus('error');
            toast.error('Lỗi hệ thống');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizAndCheckStatus();
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [quizId]);

    useEffect(() => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }

        if (hasQuizStarted && timeRemaining > 0) {
            timerIntervalRef.current = setInterval(() => {
                setTimeRemaining(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(timerIntervalRef.current);
                        submitQuiz();
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [hasQuizStarted, timeRemaining]);

    const handleAnswerSelect = (questionId, answerId, questionType) => {
        setSelectedAnswers(prevAnswers => {
            if (questionType === 'single') {
                return { ...prevAnswers, [questionId]: answerId };
            } else {
                const currentSelections = prevAnswers[questionId] || [];
                const isAlreadySelected = currentSelections.includes(answerId);

                return {
                    ...prevAnswers,
                    [questionId]: isAlreadySelected
                        ? currentSelections.filter(id => id !== answerId)
                        : [...currentSelections, answerId]
                };
            }
        });
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const submitQuiz = async () => {
        if (window.confirm('Bạn có chắc muốn nộp bài thi không?')) {
            const answeredQuestionsCount = Object.values(selectedAnswers).filter(answer =>
                (Array.isArray(answer) && answer.length > 0) || (!Array.isArray(answer) && answer !== null)
            ).length;

            if (answeredQuestionsCount < questionsList.length) {
                const shouldSubmit = window.confirm(
                    `Bạn đã trả lời ${answeredQuestionsCount}/${questionsList.length} câu hỏi. Nộp bài?`
                );
                if (!shouldSubmit) return;
            }

            try {
                setIsSubmitting(true);

                const submissionData = {
                    answers: Object.entries(selectedAnswers)
                        .filter(([_, answerIds]) =>
                            (Array.isArray(answerIds) && answerIds.length > 0) ||
                            (!Array.isArray(answerIds) && answerIds !== null)
                        )
                        .map(([questionId, answerIds]) => ({
                            question_id: parseInt(questionId),
                            answer_ids: Array.isArray(answerIds) ? answerIds : [answerIds]
                        }))
                };

                if (startTimeRef.current) {
                    const timeTaken = Math.floor((new Date() - startTimeRef.current) / 1000);
                    submissionData.time_taken = timeTaken;
                }

                const response = await apiPost(`api/student/quiz/${quizId}/submit`, submissionData);

                if (response?.success) {
                    toast.success('Nộp bài thành công!');
                    navigate(`/quiz-result/${quizId}`);
                } else {
                    toast.error(response?.message || 'Nộp bài thất bại');
                }
            } catch (error) {
                console.error('Error submitting quiz:', error);
                toast.error('Lỗi khi nộp bài thi');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const goToNextQuestion = () => {
        if (currentQuestionIndex < questionsList.length - 1) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        }
    };

    const goToPreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prevIndex => prevIndex - 1);
        }
    };

    // Render loading
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Đang tải đề thi...</p>
                </div>
            </div>
        );
    }



    if (quizStatus === 'already_taken') {
        return (
            <div className="min-h-screen bg-gray-50 grid place-items-center p-4">
                <div className="bg-white rounded-lg shadow-sm max-w-md w-full p-8 text-center">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Bạn đã làm bài thi này</h2>
                
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => navigate('/quizzes')}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Quay lại danh sách
                        </button>

                        <button
                            onClick={() => navigate(`/quiz-result/${quizId}`)}
                            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Xem kết quả
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (quizStatus === 'not_started') {
        return (
            <div className="min-h-screen bg-gray-50 grid place-items-center p-4">
                <div className="bg-white rounded-lg shadow-sm max-w-md w-full p-8 text-center">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Đề thi chưa đến giờ mở</h2>
                    <p className="text-gray-600 mb-6">Vui lòng quay lại khi đến thời gian làm bài.</p>
                    <button
                        onClick={() => navigate('/quizzes')}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    if (quizStatus === 'ended') {
        return (
            <div className="min-h-screen bg-gray-50 grid place-items-center p-4">
                <div className="bg-white rounded-lg shadow-sm max-w-md w-full p-8 text-center">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Đề thi đã kết thúc</h2>
                    <p className="text-gray-600 mb-6">Thời gian làm bài đã hết.</p>
                    <button
                        onClick={() => navigate('/quizzes')}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    if (quizStatus === 'error' || !quizData) {
        return (
            <div className="min-h-screen bg-gray-50 grid place-items-center p-4">
                <div className="bg-white rounded-lg shadow-sm max-w-md w-full p-8 text-center">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Không thể tải đề thi</h2>
                    <p className="text-gray-600 mb-6">Đã có lỗi xảy ra. Vui lòng thử lại sau.</p>
                    <button
                        onClick={() => navigate('/quizzes')}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    // Màn hình bắt đầu
    if (!hasQuizStarted) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="bg-white border border-gray-300 w-full max-w-3xl p-8">
                    <div className="text-center border-b border-gray-300 pb-6 mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">{quizData.title}</h1>
                        <div className="mt-2 text-sm text-green-700 font-medium">Trạng thái: Đang mở</div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
                        <div>
                            <div className="text-gray-600 mb-1">Số câu hỏi</div>
                            <div className="text-xl font-semibold text-gray-900">{questionsList.length}</div>
                        </div>
                        <div>
                            <div className="text-gray-600 mb-1">Thời gian làm bài</div>
                            <div className="text-xl font-semibold text-gray-900">{quizData.time_limit} phút</div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-800 mb-2">Hướng dẫn làm bài</h3>
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                            <li>Bài thi sẽ tự động nộp khi hết thời gian</li>
                            <li>Chọn đáp án đúng cho từng câu hỏi</li>
                            <li>Có thể xem lại và chỉnh sửa trước khi nộp</li>
                            <li>Có thể nộp bài thủ công bất kỳ lúc nào</li>
                        </ul>
                    </div>

                    {quizData.time_limit && (
                        <div className="mb-6 border border-yellow-400 bg-yellow-50 p-4 text-sm text-yellow-800">
                            Bài thi sẽ tự động kết thúc sau <strong>{quizData.time_limit}</strong> phút.
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                setHasQuizStarted(true);
                                startTimeRef.current = new Date();
                            }}
                            className="w-full py-3 bg-blue-700 text-white font-semibold hover:bg-blue-800 transition"
                        >
                            Bắt đầu làm bài
                        </button>
                        <button
                            onClick={() => navigate("/quizzes")}
                            className="w-full py-2 border border-gray-400 text-gray-700 hover:bg-gray-50"
                        >
                            Quay lại danh sách bài thi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Màn hình làm bài thi
    const currentQuestion = questionsList[currentQuestionIndex];
    const answeredQuestionsCount = Object.values(selectedAnswers).filter(answer =>
        (Array.isArray(answer) && answer.length > 0) || (!Array.isArray(answer) && answer !== null)
    ).length;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white sticky top-0 z-50 border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="text-center sm:text-left">
                            <h1 className="font-bold text-gray-800 text-lg truncate max-w-xs sm:max-w-md">
                                {quizData.title}
                            </h1>
                            <p className="text-sm text-gray-600">
                                Câu: <span className="font-medium">{currentQuestionIndex + 1}/{questionsList.length}</span>
                                <span className="mx-2">•</span>
                                <span>Đã trả lời: {answeredQuestionsCount}</span>
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {quizData.time_limit && (
                                <div className={`px-4 py-2 rounded-lg font-medium border ${timeRemaining < 300 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={submitQuiz}
                                disabled={isSubmitting}
                                className="px-5 py-2.5 text-white rounded-lg bg-blue-600 disabled:opacity-70 font-medium"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Đang nộp...
                                    </div>
                                ) : 'Nộp bài'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nội dung chính */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white shadow-sm p-5 sticky top-24">
                            <h3 className="font-semibold text-gray-800 mb-4">Danh sách câu hỏi</h3>

                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-6">
                                {questionsList.map((question, index) => {
                                    const isCurrentQuestion = index === currentQuestionIndex;
                                    return (
                                        <button
                                            key={question.id}
                                            onClick={() => setCurrentQuestionIndex(index)}
                                            className={`h-10 w-10 rounded-lg flex items-center justify-center text-sm font-medium ${isCurrentQuestion
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Tiến độ làm bài</span>
                                    <span className="font-medium">{answeredQuestionsCount}/{questionsList.length}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full"
                                        style={{ width: `${(answeredQuestionsCount / questionsList.length) * 100}%` }}
                                    ></div>
                                </div>

                                {quizData.time_limit && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-gray-600">Thời gian còn lại</span>
                                            <span className="font-medium text-blue-600">{formatTime(timeRemaining)}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div
                                                className={`h-1.5 rounded-full ${timeRemaining < 300 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                style={{
                                                    width: `${Math.max(0, (timeRemaining / (quizData.time_limit * 60)) * 100)}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Phần câu hỏi hiện tại */}
                    <div className="lg:col-span-3">
                        <div className="bg-white shadow-sm p-6 mb-6">
                            <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 font-medium text-sm rounded-lg">
                                    Câu {currentQuestionIndex + 1}
                                </span>
                                <span className="text-sm text-gray-600">
                                    {currentQuestion.question_type === 'single' ? '(Chọn một đáp án)' : '(Chọn nhiều đáp án)'}
                                </span>
                            </div>

                            <div className="mb-8">
                                <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
                                    {currentQuestion.question_text}
                                </p>
                            </div>

                            <div className="space-y-3">
                                {currentQuestion.answers.map((answer, index) => {
                                    const isSelected = currentQuestion.question_type === 'single'
                                        ? selectedAnswers[currentQuestion.id] === answer.id
                                        : (selectedAnswers[currentQuestion.id] || []).includes(answer.id);

                                    return (
                                        <div
                                            key={answer.id}
                                            onClick={() => handleAnswerSelect(currentQuestion.id, answer.id, currentQuestion.question_type)}
                                            className={`p-4 border cursor-pointer ${isSelected
                                                ? 'border-blue-400 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center ${isSelected
                                                    ? 'border-blue-600 bg-blue-600'
                                                    : 'border-gray-400'
                                                    }`}>
                                                    {isSelected && (
                                                        <span className="text-white text-sm font-medium">
                                                            {currentQuestion.question_type === 'single' ? '✓' : index + 1}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-gray-800">{answer.answer_text}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Nút điều hướng */}
                        <div className="flex gap-2">
                            <button
                                onClick={goToPreviousQuestion}
                                disabled={currentQuestionIndex === 0}
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                Câu trước
                            </button>

                            <button
                                onClick={goToNextQuestion}
                                disabled={currentQuestionIndex === questionsList.length - 1}
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                Câu sau
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
        </div>
    );
}

export default StudentQuizDetail;