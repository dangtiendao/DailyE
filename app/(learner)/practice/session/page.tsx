'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPracticeQuestions, submitPracticeAttempt, SafeQuestion } from '@/app/actions/practice';
import {
  ArrowLeft,
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function QuizEngineContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const part = searchParams.get('part') || undefined;
  const tag = searchParams.get('tag') || undefined;
  const mode = searchParams.get('mode') || undefined;

  const [questions, setQuestions] = useState<SafeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [questionTimeSpent, setQuestionTimeSpent] = useState<Record<string, number>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Countdown timer cho Mini Test (20 phút = 1200 giây)
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(
    mode === 'mini' ? 1200 : null
  );

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Tải danh sách câu hỏi an toàn từ Server Action
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      const data = await getPracticeQuestions({
        part,
        tag,
        limit: mode === 'mini' ? 20 : 15,
      });
      setQuestions(data);
      setIsLoading(false);
    };
    fetchQuestions();
  }, [part, tag, mode]);

  // Đồng hồ đếm ngược cho Mini Test
  useEffect(() => {
    if (secondsRemaining === null) return;

    if (secondsRemaining <= 0) {
      // Hết giờ -> Tự động nộp bài
      handleSubmitAttempt();
      return;
    }

    timerRef.current = setTimeout(() => {
      setSecondsRemaining((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [secondsRemaining]);

  // Đếm thời gian làm bài của từng câu
  useEffect(() => {
    if (questions.length === 0) return;

    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const interval = setInterval(() => {
      setQuestionTimeSpent((prev) => ({
        ...prev,
        [currentQ.id]: (prev[currentQ.id] || 0) + 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex, questions]);

  const currentQuestion = questions[currentIndex];

  // Chọn đáp án A/B/C/D
  const handleSelectOption = (optionKey: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionKey,
    }));
  };

  // Gắn cờ phân vân
  const handleToggleFlag = () => {
    if (!currentQuestion) return;
    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  // Nộp bài thi lên Server Action chấm điểm
  const handleSubmitAttempt = async () => {
    if (isSubmitting || questions.length === 0) return;

    setIsSubmitting(true);
    setShowConfirmModal(false);
    setErrorMessage(null);

    const totalTimeSpentSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    const answersPayload = questions.map((q) => ({
      questionId: q.id,
      selectedAnswer: selectedAnswers[q.id] || 'A', // Fallback A nếu chưa chọn
      timeSpentSeconds: questionTimeSpent[q.id] || 0,
    }));

    try {
      const result = await submitPracticeAttempt({
        answers: answersPayload,
        totalTimeSpentSeconds,
      });

      if (!result.success || !result.attemptId) {
        setErrorMessage(result.error || 'Nộp bài thất bại');
        setIsSubmitting(false);
      } else {
        // Chuyển hướng sang trang báo cáo kết quả chi tiết
        router.push(`/practice/result/${result.attemptId}`);
        router.refresh();
      }
    } catch (err) {
      setErrorMessage((err as Error).message || 'Lỗi gửi bài thi về máy chủ');
      setIsSubmitting(false);
    }
  };

  // Format mm:ss cho đồng hồ đếm ngược
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(selectedAnswers).length;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs text-slate-500 font-medium">Đang khởi tạo đề thi an toàn...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-4 max-w-md mx-auto my-8">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Không tìm thấy câu hỏi</h2>
        <p className="text-xs text-slate-500">Chưa có câu hỏi xuất bản phù hợp với chế độ luyện đã chọn.</p>
        <Link
          href="/practice"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Về trang chọn chế độ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8 max-w-md mx-auto relative">
      {/* Header Quiz Bar */}
      <header className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
        <button
          onClick={() => setShowConfirmModal(true)}
          className="text-xs font-semibold text-slate-500 hover:text-red-600 transition flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Thoát</span>
        </button>

        {/* Counter */}
        <div className="text-xs font-bold text-slate-800">
          Câu <span className="text-emerald-600">{currentIndex + 1}</span> / {questions.length}
        </div>

        {/* Đồng hồ đếm ngược (nếu có) hoặc Nút Flag */}
        <div className="flex items-center gap-2">
          {secondsRemaining !== null && (
            <div className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>
          )}

          <button
            onClick={handleToggleFlag}
            className={cn(
              'p-2 rounded-xl border transition',
              flaggedQuestions[currentQuestion.id]
                ? 'bg-amber-100 border-amber-300 text-amber-700'
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
            )}
            title="Đánh dấu câu phân vân"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-emerald-600 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Thẻ Nội dung câu hỏi */}
      <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-md space-y-4 min-h-[220px]">
        <div className="flex items-center justify-between text-xs">
          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold uppercase">
            {currentQuestion.exam_part} • {currentQuestion.code}
          </span>
          {currentQuestion.level_tag && (
            <span className="text-slate-400 font-medium">{currentQuestion.level_tag}</span>
          )}
        </div>

        <p className="text-sm font-semibold text-slate-900 leading-relaxed">
          {currentQuestion.question_text}
        </p>

        {/* 4 Lựa chọn A/B/C/D */}
        <div className="space-y-2.5 pt-2">
          {(['A', 'B', 'C', 'D'] as const).map((key) => {
            const optionText = currentQuestion.options[key];
            const isSelected = selectedAnswers[currentQuestion.id] === key;

            return (
              <button
                key={key}
                onClick={() => handleSelectOption(key)}
                className={cn(
                  'w-full p-3.5 rounded-2xl border-2 text-left text-xs transition flex items-center justify-between font-medium',
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 font-bold shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs shrink-0',
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {key}
                  </span>
                  <span>{optionText}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid chọn nhanh câu hỏi */}
      <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Danh sách câu hỏi:</span>
          <span>Đã trả lời: {answeredCount}/{questions.length}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {questions.map((q, idx) => {
            const isAns = !!selectedAnswers[q.id];
            const isFlag = !!flaggedQuestions[q.id];
            const isCurr = idx === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  'w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition border',
                  isCurr ? 'ring-2 ring-emerald-600 font-black' : '',
                  isFlag
                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                    : isAns
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                )}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer Controls */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Câu trước</span>
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs transition flex items-center gap-1"
          >
            <span>Câu tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Nộp bài thi</span>
          </button>
        )}
      </div>

      {/* Modal Xác nhận nộp bài */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <HelpCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Xác nhận nộp bài?</h3>
              <p className="text-xs text-slate-500">
                Bạn đã hoàn thành <span className="font-bold text-slate-800">{answeredCount}/{questions.length}</span> câu hỏi.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Làm tiếp
              </button>
              <button
                onClick={handleSubmitAttempt}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Nộp luôn</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Trang Quiz Session bọc Suspense Boundary
export default function PracticeSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-xs text-slate-500 font-medium">Đang tải phòng thi...</p>
        </div>
      }
    >
      <QuizEngineContent />
    </Suspense>
  );
}
