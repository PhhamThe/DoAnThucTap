import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiGet, apiPost } from '../../api/client';

function StudentQuizDetail() {
    const { quizId } = useParams();
    const navigate = useNavigate();

    // State management
    const [quizData, setQuizData] = useState(null);
    const [questionsList, setQuestionsList] = useState([]);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [hasQuizStarted, setHasQuizStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizStatus, setQuizStatus] = useState('checking');

    useEffect(() => {
        fetchQuizAndCheckStatus();
    }, [quizId]);

    useEffect(() => {
        let timerInterval;

        if (hasQuizStarted && timeRemaining > 0 && quizData?.time_limit) {
            timerInterval = setInterval(() => {
                setTimeRemaining(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(timerInterval);
                        handleAutoSubmit();
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        }

        return () => clearInterval(timerInterval);
    }, [hasQuizStarted, timeRemaining, quizData]);

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

            const { quiz_status, has_taken } = statusResponse.data;

            if (has_taken) {
                setQuizStatus('already_taken');
                toast.info('Bạn đã làm bài thi này');
                return;
            }

            if (quiz_status !== 'available') {
                setQuizStatus('not_available');
                toast.error(quiz_status === 'not_started'
                    ? 'Đề thi chưa được mở'
                    : 'Đề thi đã kết thúc'
                );
                return;
            }

            const quizResponse = await apiGet(`api/student/quiz/${quizId}`);

            if (quizResponse?.success) {
                const fetchedQuizData = quizResponse.data;
                setQuizData(fetchedQuizData);
                setQuizStatus('available');

                const initialAnswersState = {};
                fetchedQuizData.questions.forEach(question => {
                    initialAnswersState[question.id] = question.question_type === 'single' ? null : [];
                });

                setSelectedAnswers(initialAnswersState);
                setQuestionsList(fetchedQuizData.questions);

                if (fetchedQuizData.time_limit) {
                    setTimeRemaining(fetchedQuizData.time_limit * 60);
                }
            } else {
                setQuizStatus('error');
                toast.error('Không thể tải nội dung đề thi');
            }
        } catch (error) {
            console.error('Error fetching quiz:', error);
            setQuizStatus('error');
            toast.error('Lỗi hệ thống khi tải đề thi');
        } finally {
            setIsLoading(false);
        }
    };

    const startQuiz = () => {
        setHasQuizStarted(true);
    };

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

    const handleAutoSubmit = () => {
        toast.info('Hết thời gian! Tự động nộp bài...');
        submitQuiz();
    };

    const submitQuiz = async () => {
        const answeredQuestionsCount = Object.values(selectedAnswers).filter(answer =>
            (Array.isArray(answer) && answer.length > 0) || (!Array.isArray(answer) && answer !== null)
        ).length;

        if (answeredQuestionsCount < questionsList.length) {
            const shouldSubmit = window.confirm(
                `Bạn đã trả lời ${answeredQuestionsCount}/${questionsList.length} câu hỏi. Bạn có chắc chắn muốn nộp bài?`
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


    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Đang tải thông tin đề thi...</p>
                </div>
            </div>
        );
    }


    if (quizStatus === 'already_taken') {
        return (
            <div className="min-h-screen bg-gray-50 grid place-items-center p-4">
                <div className="bg-white rounded-xl shadow-sm max-w-md w-full p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 grid place-items-center">
                        <span className="text-3xl text-green-600">✓</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Đã hoàn thành</h2>
                    <p className="text-gray-600 mb-6">Bạn đã hoàn thành bài thi này</p>
                </div>
            </div>
        );
    }

    if (quizStatus === 'not_available') {
        return (
            <div className="min-h-screen grid place-items-center p-4 bg-gray-50">
                <div className="bg-white rounded-lg shadow p-5 max-w-xs w-full text-center">
                    <div className="text-3xl mb-2">⏰</div>
                    <h2 className="font-medium mb-1">Không khả dụng</h2>
                    <p className="text-gray-500 text-sm mb-4">
                        {quizData ? `"${quizData.title}"` : 'Đề thi'} đã kết thúc
                    </p>
                    <button
                        onClick={() => navigate('/quizzes')}
                        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    if (quizStatus === 'error' || !quizData || questionsList.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-xl shadow-sm max-w-md w-full p-8">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                            <span className="text-3xl text-red-600">X</span>
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Không thể tải đề thi</h2>
                        <p className="text-gray-600 mb-6">
                            Đã xảy ra lỗi khi tải đề thi. Vui lòng thử lại sau.
                        </p>
                    </div>

                </div>
            </div>
        );
    }


    if (!hasQuizStarted) {
        return (
            <div className="min-h-screen grid place-items-center p-4">
                <div className="bg-white rounded-lg shadow p-5 max-w-sm w-full">
                    <h1 className="text-lg font-semibold text-center mb-4">{quizData.title}</h1>

                    <div className="space-y-3 mb-5">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Câu hỏi:</span>
                            <span className="font-medium">{questionsList.length}</span>
                        </div>
                        {quizData.time_limit && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Thời gian:</span>
                                <span className="font-medium">{quizData.time_limit} phút</span>
                            </div>
                        )}
                    </div>

                    <div className="text-sm text-gray-500 mb-5 space-y-1">
                        <p>• Bài thi tự động nộp khi hết giờ</p>
                        <p>• Bấm bắt đầu để thi</p>
                    </div>

                    <button
                        onClick={startQuiz}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Bắt đầu
                    </button>
                </div>
            </div>
        );
    }


    const currentQuestion = questionsList[currentQuestionIndex];
    const answeredQuestionsCount = Object.values(selectedAnswers).filter(answer =>
        (Array.isArray(answer) && answer.length > 0) || (!Array.isArray(answer) && answer !== null)
    ).length;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Fixed header */}
            <div className="bg-white  sticky top-0 z-50 border border-gray-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
                        <div className="text-center sm:text-left">
                            <h1 className="font-bold text-gray-800 text-lg truncate max-w-xs sm:max-w-md">
                                {quizData.title}
                            </h1>
                            <p className="text-sm text-gray-600">
                                Câu hỏi: <span className="font-medium">{currentQuestionIndex + 1}/{questionsList.length}</span>
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Timer */}
                            {quizData.time_limit && (
                                <div className={`px-4 py-2 rounded-lg font-medium transition-all ${timeRemaining < 300
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-blue-50 text-blue-700'
                                    }`}>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-mono">{formatTime(timeRemaining)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Submit button */}
                            <button
                                onClick={submitQuiz}
                                disabled={isSubmitting}
                                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-70 font-medium transition-colors shadow-sm"
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

            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Thanh sidebar câu hỏi */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm p-5 sticky top-28">
                            <h3 className="font-semibold text-gray-800 mb-4">Danh sách câu hỏi</h3>

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
                                            className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${isCurrentQuestion
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : isAnswered
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(answeredQuestionsCount / questionsList.length) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Phần câu hỏi*/}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mb-6">
                            <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 font-medium text-sm rounded-lg">
                                    Câu {currentQuestionIndex + 1}
                                </span>
                                <span className="text-sm text-gray-600">
                                    {currentQuestion.question_type === 'single'
                                        ? '(Chọn một đáp án đúng)'
                                        : '(Có thể chọn nhiều đáp án)'}
                                </span>
                            </div>

                            <div className="mb-8">
                                <p className="text-lg text-gray-800 leading-relaxed">
                                    {currentQuestion.question_text}
                                </p>
                            </div>

                            <div className="space-y-3">
                                {currentQuestion.answers.map((answer) => {
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
                                            className={`p-4 rounded-xl border transition-all cursor-pointer group ${isSelected
                                                ? 'border-blue-300 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isSelected
                                                    ? 'border-blue-600 bg-blue-600'
                                                    : 'border-gray-400 group-hover:border-gray-500'
                                                    }`}>
                                                    {isSelected && (
                                                        <span className="text-white text-xs">
                                                            {currentQuestion.question_type === 'single' ? '●' : '✓'}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-gray-800 select-none">{answer.answer_text}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Nút chuyển */}
                        <div className="flex justify-between">
                            <button
                                onClick={goToPreviousQuestion}
                                disabled={currentQuestionIndex === 0}
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Câu trước
                            </button>

                            {currentQuestionIndex < questionsList.length - 1 ? (
                                <button
                                    onClick={goToNextQuestion}
                                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2 shadow-sm"
                                >
                                    Câu tiếp theo
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            ) : (
                                <button
                                    onClick={submitQuiz}
                                    className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-medium transition-all flex items-center gap-2 shadow-sm"
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
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />
        </div>
    );
}

export default StudentQuizDetail;