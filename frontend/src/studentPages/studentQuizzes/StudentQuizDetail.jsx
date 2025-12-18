import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiGet, apiPost } from '../../api/client';

function StudentQuizDetail() {
    const { quizId } = useParams();
    const navigate = useNavigate();

    // State
    const [quizData, setQuizData] = useState(null);
    const [questionsList, setQuestionsList] = useState([]);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [hasQuizStarted, setHasQuizStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizStatus, setQuizStatus] = useState('checking');
    const [quizStartTime, setQuizStartTime] = useState(null);

    // Refs
    const startTimeRef = useRef(null);
    const timerIntervalRef = useRef(null);

    // Khởi tạo bài thi
    useEffect(() => {
        fetchQuizAndCheckStatus();
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [quizId]);

    // Đếm ngược thời gian
    useEffect(() => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }

        if (hasQuizStarted && timeRemaining > 0) {
            timerIntervalRef.current = setInterval(() => {
                setTimeRemaining(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(timerIntervalRef.current);
                        handleAutoSubmit();
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

            // Kiểm tra các trạng thái không hợp lệ
            if (has_taken) {
                setQuizStatus('already_taken');
                toast.info('Bạn đã làm bài thi này rồi');
                return;
            }

            if (quiz_status === 'not_started') {
                setQuizStatus('not_started');
                toast.warning('Đề thi chưa đến giờ mở');
                return;
            }

            if (quiz_status === 'ended') {
                setQuizStatus('ended');
                toast.error('Đề thi đã kết thúc');
                return;
            }

            // Kiểm tra thời gian làm bài
            const now = new Date();
            const quizStartTime = new Date(quiz.start_time);

            // Tính thời gian kết thúc dựa trên time_limit
            const quizEndTime = new Date(quizStartTime.getTime() + (quiz.time_limit * 60000));

            // Nếu đã quá thời gian kết thúc
            if (now > quizEndTime) {
                setQuizStatus('ended');
                toast.error('Đề thi đã kết thúc');
                return;
            }

            // Nếu chưa đến giờ bắt đầu
            if (now < quizStartTime) {
                setQuizStatus('not_started');
                toast.warning('Đề thi chưa đến giờ mở');
                return;
            }

            // Lấy thông tin bài thi
            const quizResponse = await apiGet(`api/student/quiz/${quizId}`);

            if (quizResponse?.success) {
                const fetchedQuizData = quizResponse.data;
                setQuizData(fetchedQuizData);
                setQuizStatus('available');
                setQuestionsList(fetchedQuizData.questions || []);

                // Khởi tạo state cho câu trả lời
                const initialAnswers = {};
                (fetchedQuizData.questions || []).forEach(question => {
                    initialAnswers[question.id] = question.question_type === 'single' ? null : [];
                });
                setSelectedAnswers(initialAnswers);

                // Thiết lập thời gian làm bài
                if (fetchedQuizData.time_limit) {
                    const now = new Date();
                    const startTime = new Date(fetchedQuizData.start_time);
                    const endTime = new Date(startTime.getTime() + (fetchedQuizData.time_limit * 60000));

                    // Tính thời gian còn lại (tính bằng giây)
                    const remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
                    setTimeRemaining(remainingSeconds);

                    // Lưu thời gian bắt đầu làm bài (thời điểm hiện tại)
                    setQuizStartTime(now);
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

    // Xử lý chọn đáp án
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

    // Format thời gian
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Tự động nộp khi hết giờ
    const handleAutoSubmit = () => {
        toast.info('Hết thời gian! Tự động nộp bài...');
        submitQuiz();
    };

    // Nộp bài thi
    const submitQuiz = async () => {
        const answeredQuestionsCount = Object.values(selectedAnswers).filter(answer =>
            (Array.isArray(answer) && answer.length > 0) || (!Array.isArray(answer) && answer !== null)
        ).length;

        // Xác nhận nếu chưa trả lời hết câu hỏi
        if (answeredQuestionsCount < questionsList.length) {
            const shouldSubmit = window.confirm(
                `Bạn đã trả lời ${answeredQuestionsCount}/${questionsList.length} câu hỏi. Nộp bài?`
            );
            if (!shouldSubmit) return;
        }

        try {
            setIsSubmitting(true);

            // Chuẩn bị dữ liệu nộp bài
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

            // Thêm thời gian nộp bài (nếu cần)
            if (startTimeRef.current) {
                const timeTaken = Math.floor((new Date() - startTimeRef.current) / 1000); // Tính bằng giây
                submissionData.time_taken = timeTaken;
            }

            const response = await apiPost(`api/student/quiz/${quizId}/submit`, submissionData);

            if (response?.success) {
                toast.success('Nộp bài thành công!');
                navigate(`/quiz-result/${response.data.result_id}`);
            } else {
                toast.error(response?.message || 'Nộp bài thất bại');
            }
        } catch (error) {
            console.error('Error submitting quiz:', error);
            toast.error('Lỗi khi nộp bài thi');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Chuyển câu hỏi
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

    // Tính thời gian còn lại cho bài thi chưa bắt đầu
    const getTimeUntilStart = () => {
        if (!quizData?.start_time) return null;

        const now = new Date();
        const startTime = new Date(quizData.start_time);
        const timeDiff = startTime - now;

        if (timeDiff <= 0) return null;

        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        return { hours, minutes, seconds };
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

    // Render các trạng thái lỗi
    if (quizStatus === 'already_taken') {
        return (
            <div className="min-h-screen bg-gray-50 grid place-items-center p-4">
                <div className="bg-white rounded-xl shadow-sm max-w-md w-full p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 grid place-items-center">
                        <span className="text-3xl text-green-600">✓</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Đã hoàn thành</h2>
                    <p className="text-gray-600 mb-6">Bạn đã làm bài thi này</p>
                    <button
                        onClick={() => navigate('/quizzes')}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    if (quizStatus === 'not_started') {
        const timeUntilStart = getTimeUntilStart();

        return (
            <div className="min-h-screen bg-gray-50 grid place-items-center p-4">
                <div className="bg-white rounded-xl shadow-sm max-w-md w-full p-8 text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4 grid place-items-center">
                        <span className="text-3xl text-yellow-600">⏱️</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Đề thi chưa mở</h2>

                    {timeUntilStart && (
                        <div className="mb-6">
                            <p className="text-gray-600 mb-3">Đề thi sẽ mở sau:</p>
                            <div className="flex justify-center gap-3">
                                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-800">{timeUntilStart.hours}</div>
                                    <div className="text-sm text-gray-600">giờ</div>
                                </div>
                                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-800">{timeUntilStart.minutes}</div>
                                    <div className="text-sm text-gray-600">phút</div>
                                </div>
                                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-800">{timeUntilStart.seconds}</div>
                                    <div className="text-sm text-gray-600">giây</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {quizData && (
                            <>
                                <div className="text-left bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-gray-800 mb-2">Thông tin đề thi</h3>
                                    <div className="space-y-2">
                                        <p className="text-gray-600">Tên đề: <span className="font-medium">{quizData.title}</span></p>
                                        <p className="text-gray-600">Thời gian bắt đầu: <span className="font-medium">{new Date(quizData.start_time).toLocaleString('vi-VN')}</span></p>
                                        <p className="text-gray-600">Thời gian làm bài: <span className="font-medium">{quizData.time_limit} phút</span></p>
                                        <p className="text-gray-600">Số câu hỏi: <span className="font-medium">{quizData.questions?.length || 0}</span></p>
                                    </div>
                                </div>
                            </>
                        )}

                        <button
                            onClick={() => navigate('/quizzes')}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full"
                        >
                            Quay lại danh sách
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (quizStatus === 'ended') {
        return (
            <div className="min-h-screen bg-gray-50 grid place-items-center p-4">
                <div className="bg-white rounded-xl shadow-sm max-w-md w-full p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 grid place-items-center">
                        <span className="text-3xl text-red-600">✗</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Đề thi đã kết thúc</h2>
                    <p className="text-gray-600 mb-6">Thời gian làm bài đã hết</p>
                    {quizData && (
                        <div className="mb-6 text-left bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-800 mb-2">Thông tin đề thi</h3>
                            <div className="space-y-1">
                                <p className="text-gray-600">Tên đề: <span className="font-medium">{quizData.title}</span></p>
                                <p className="text-gray-600">Đã bắt đầu lúc: <span className="font-medium">{new Date(quizData.start_time).toLocaleString('vi-VN')}</span></p>
                                <p className="text-gray-600">Thời gian làm bài: <span className="font-medium">{quizData.time_limit} phút</span></p>
                            </div>
                        </div>
                    )}
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

    if (quizStatus === 'error' || !quizData || questionsList.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-xl shadow-sm max-w-md w-full p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                        <span className="text-3xl text-red-600">X</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Lỗi tải đề thi</h2>
                    <p className="text-gray-600 mb-6">Vui lòng thử lại sau</p>
                    <button
                        onClick={() => navigate('/quizzes')}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
            <div className="min-h-screen grid place-items-center p-4 bg-gradient-to-br from-blue-50 to-gray-50">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">{quizData.title}</h1>
                        <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 font-medium text-sm rounded-full">
                            Đang mở
                        </div>
                    </div>

                    <div className="space-y-6 mb-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Số câu hỏi</div>
                                <div className="text-2xl font-bold text-gray-800">{questionsList.length}</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Thời gian làm bài</div>
                                <div className="text-2xl font-bold text-gray-800">{quizData.time_limit} phút</div>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-blue-800 mb-2">📝 Hướng dẫn làm bài</h3>
                            <ul className="space-y-2 text-sm text-blue-700">
                                <li className="flex items-start gap-2">
                                    <span className="mt-1">•</span>
                                    <span>Tự động nộp bài khi hết thời gian</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1">•</span>
                                    <span>Chọn đáp án đúng cho từng câu hỏi</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1">•</span>
                                    <span>Có thể xem lại và sửa đáp án trước khi nộp</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1">•</span>
                                    <span>Nộp bài bất kỳ lúc nào bằng nút "Nộp bài"</span>
                                </li>
                            </ul>
                        </div>

                        {quizData.time_limit && (
                            <div className="bg-yellow-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Lưu ý quan trọng</h3>
                                <p className="text-sm text-yellow-700">
                                    Bài thi sẽ tự động kết thúc sau {quizData.time_limit} phút kể từ thời điểm bắt đầu làm bài.
                                </p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            setHasQuizStarted(true);
                            startTimeRef.current = new Date();
                        }}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-300"
                    >
                        🚀 Bắt đầu làm bài
                    </button>

                    <button
                        onClick={() => navigate('/quizzes')}
                        className="w-full mt-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                        Quay lại
                    </button>
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
                            {/* Timer */}
                            {quizData.time_limit && (
                                <div className={`px-4 py-2 rounded-lg font-medium border ${timeRemaining < 300
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Nút nộp bài */}
                            <button
                                onClick={submitQuiz}
                                disabled={isSubmitting}
                                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-70 font-medium shadow-sm"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Đang nộp...
                                    </div>
                                ) : '📤 Nộp bài'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nội dung chính */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar câu hỏi */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24">
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Danh sách câu hỏi
                            </h3>

                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-6">
                                {questionsList.map((question, index) => {
                                    const isCurrentQuestion = index === currentQuestionIndex;
                                    const isAnswered = selectedAnswers[question.id] !== null &&
                                        (Array.isArray(selectedAnswers[question.id])
                                            ? selectedAnswers[question.id].length > 0
                                            : true);

                                    return (
                                        <button
                                            key={question.id}
                                            onClick={() => setCurrentQuestionIndex(index)}
                                            className={`h-10 w-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${isCurrentQuestion
                                                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md'
                                                : isAnswered
                                                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                                                }`}
                                            title={`Câu ${index + 1}`}
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
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-gradient-to-r from-green-400 to-green-500 h-2.5 rounded-full transition-all duration-300"
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
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                            <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                                <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 font-medium text-sm rounded-lg">
                                    Câu {currentQuestionIndex + 1}
                                </span>
                                <span className="text-sm text-gray-600">
                                    {currentQuestion.question_type === 'single'
                                        ? '(Chọn một đáp án)'
                                        : '(Chọn nhiều đáp án)'}
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
                                            onClick={() => handleAnswerSelect(
                                                currentQuestion.id,
                                                answer.id,
                                                currentQuestion.question_type
                                            )}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${isSelected
                                                ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-blue-25 shadow-sm'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
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
                        <div className="flex justify-between">
                            <button
                                onClick={goToPreviousQuestion}
                                disabled={currentQuestionIndex === 0}
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Câu trước
                            </button>

                            {currentQuestionIndex < questionsList.length - 1 ? (
                                <button
                                    onClick={goToNextQuestion}
                                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium flex items-center gap-2"
                                >
                                    Câu tiếp theo
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            ) : (
                                <button
                                    onClick={submitQuiz}
                                    className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-medium flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Hoàn thành và nộp bài
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer
                position="bottom-right"
                autoClose={3000}
                theme="colored"
            />
        </div>
    );
}

export default StudentQuizDetail;