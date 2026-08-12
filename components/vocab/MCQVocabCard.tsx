'use client';

import React, { useState, useCallback } from 'react';
import { VocabQuizQuestion, verifyVocabAnswer, SubmitVocabAnswerResult } from '@/app/actions/vocab';
import { syncVocabProgressWithRetry } from '@/lib/sync-queue';
import { CheckCircle2, XCircle, ArrowRight, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MCQVocabCardProps {
  question: VocabQuizQuestion;
  currentIndex: number;
  totalQuestions: number;
  onNext: (isFirstTryCorrect: boolean, isFinalCorrect: boolean, feedback?: SubmitVocabAnswerResult | null) => void;
}

// 1. Tách Component ProgressBar với React.memo để tránh re-render khi chọn đáp án
const QuizProgressBar = React.memo(function QuizProgressBar({
  currentIndex,
  totalQuestions,
  questionType,
}: {
  currentIndex: number;
  totalQuestions: number;
  questionType: 'en_vi' | 'vi_en';
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
        <span className="flex items-center gap-1.5 font-bold text-blue-600">
          <Sparkles className="w-4 h-4" />
          {questionType === 'en_vi' ? 'Chọn Nghĩa tiếng Việt' : 'Chọn Từ tiếng Anh'}
        </span>
        <span className="font-bold text-slate-700">
          {currentIndex + 1} / {totalQuestions}
        </span>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div
          className="bg-blue-600 h-full transition-all duration-300 rounded-full"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>
    </div>
  );
});

export function MCQVocabCard({
  question,
  currentIndex,
  totalQuestions,
  onNext,
}: MCQVocabCardProps) {
  // State quản lý lựa chọn & phản hồi cục bộ trong từng câu (Không đẩy ra parent)
  const [selectedOptionText, setSelectedOptionText] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [feedback, setFeedback] = useState<SubmitVocabAnswerResult | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isFirstAttempt, setIsFirstAttempt] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Xử lý chọn đáp án tức thì (Visual feedback < 100ms)
  const handleSelectOption = useCallback(
    async (optionText: string) => {
      if (hasAnswered || isVerifying) return;

      // 1. Phản hồi thị giác TỨC THÌ (0ms)
      setSelectedOptionText(optionText);
      setIsVerifying(true);
      setToastMessage(null);

      // Timeout Safety Guard (5 giây): Khôi phục nút nếu mạng treo
      const timeoutTimer = setTimeout(() => {
        setIsVerifying((verifying) => {
          if (verifying) {
            setSelectedOptionText(null);
            setToastMessage('Kết nối gián đoạn. Vui lòng chọn lại đáp án.');
            return false;
          }
          return verifying;
        });
      }, 5000);

      try {
        // 2. Xác thực đáp án SIÊU TỐC từ Server (~80ms)
        const res = await verifyVocabAnswer(
          question.vocabId,
          question.questionType,
          optionText
        );

        clearTimeout(timeoutTimer);
        setIsVerifying(false);
        setFeedback(res);
        setHasAnswered(true);

        // 3. TÁCH GHI TIẾN ĐỘ SRS CHẠY NGẦM (NON-BLOCKING) + AUTO RETRY & LOCALSTORAGE
        syncVocabProgressWithRetry(question.vocabId, res.isCorrect, (msg) => {
          setToastMessage(msg);
        });
      } catch (err) {
        clearTimeout(timeoutTimer);
        setIsVerifying(false);
        setSelectedOptionText(null);
        setToastMessage('Có lỗi kết nối máy chủ. Vui lòng bấm chọn lại.');
        console.error('Lỗi đối chiếu đáp án:', err);
      }
    },
    [hasAnswered, isVerifying, question]
  );

  // Chuyển sang câu tiếp theo
  const handleNextClick = useCallback(() => {
    if (!feedback) return;
    onNext(isFirstAttempt && feedback.isCorrect, feedback.isCorrect, feedback);

    // Reset local card state cho câu tiếp theo
    setSelectedOptionText(null);
    setFeedback(null);
    setHasAnswered(false);
    setIsFirstAttempt(true);
    setToastMessage(null);
  }, [feedback, isFirstAttempt, onNext]);

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6 max-w-md mx-auto relative">
      {/* Toast Cảnh báo nếu gặp sự cố mạng */}
      {toastMessage && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Progress Bar được Memoize */}
      <QuizProgressBar
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        questionType={question.questionType}
      />

      {/* Question Prompt Hero */}
      <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {question.questionType === 'en_vi' ? 'Từ vựng tiếng Anh' : 'Nghĩa tiếng Việt'}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
          {question.prompt}
        </h2>
        {question.wordType && (
          <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
            ({question.wordType})
          </span>
        )}
      </div>

      {/* 4 Options Grid */}
      <div className="space-y-3">
        {question.options.map((opt, idx) => {
          const isSelected = selectedOptionText === opt.text;
          const isCorrectOption = feedback && opt.text.trim().toLowerCase() === feedback.correctAnswer.trim().toLowerCase();
          const isWrongSelected = hasAnswered && isSelected && feedback && !feedback.isCorrect;

          let btnStyle = 'border-slate-200 hover:border-blue-400 bg-white text-slate-800';

          if (hasAnswered) {
            if (isCorrectOption) {
              btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-sm';
            } else if (isWrongSelected) {
              btnStyle = 'border-rose-500 bg-rose-50 text-rose-900 font-bold';
            } else {
              btnStyle = 'border-slate-100 bg-slate-50 text-slate-400 opacity-60';
            }
          } else if (isSelected) {
            if (isVerifying) {
              btnStyle = 'border-blue-600 bg-blue-50 text-blue-900 font-bold animate-pulse ring-2 ring-blue-300';
            } else {
              btnStyle = 'border-blue-600 bg-blue-50 text-blue-900 font-bold';
            }
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelectOption(opt.text)}
              disabled={hasAnswered || isVerifying}
              className={cn(
                'w-full p-4 border-2 rounded-2xl text-left text-sm font-semibold transition-all duration-200 flex items-center justify-between group',
                btnStyle,
                isVerifying && !isSelected && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition',
                    hasAnswered && isCorrectOption
                      ? 'bg-emerald-600 text-white'
                      : hasAnswered && isWrongSelected
                      ? 'bg-rose-600 text-white'
                      : isSelected && isVerifying
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                  )}
                >
                  {isSelected && isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : optionLabels[idx]}
                </span>
                <span className="text-sm leading-snug">{opt.text}</span>
              </div>

              {hasAnswered && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
              {hasAnswered && isWrongSelected && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Phản hồi tức thì & Giải thích */}
      {hasAnswered && feedback && (
        <div
          className={cn(
            'p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300',
            feedback.isCorrect ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' : 'bg-rose-50/80 border-rose-200 text-rose-950'
          )}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            {feedback.isCorrect ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Chính xác! Đã thuộc từ này.</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Chưa đúng! Từ này sẽ quay lại cuối phiên học.</span>
              </>
            )}
          </div>

          <div className="space-y-1 pt-1 border-t border-slate-200/60">
            <p className="font-medium">
              <span className="font-bold text-slate-900">{feedback.word}:</span> {feedback.meaningVi}
            </p>
            {feedback.example && (
              <p className="text-slate-600 italic">Ví dụ: &quot;{feedback.example}&quot;</p>
            )}
          </div>

          <button
            onClick={handleNextClick}
            className={cn(
              'w-full mt-3 py-3 px-4 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 transition shadow-md',
              feedback.isCorrect ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
            )}
          >
            <span>{feedback.isCorrect ? 'Tiếp tục từ tiếp theo' : 'Đã hiểu, tiếp tục'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
