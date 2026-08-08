'use client';

import React, { useState } from 'react';
import { VocabQuizQuestion, submitVocabAnswer, SubmitVocabAnswerResult } from '@/app/actions/vocab';
import { CheckCircle2, XCircle, ArrowRight, BookOpen, Sparkles, Volume2, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MCQVocabCardProps {
  question: VocabQuizQuestion;
  currentIndex: number;
  totalQuestions: number;
  onNext: (isFirstTryCorrect: boolean, isFinalCorrect: boolean) => void;
}

export function MCQVocabCard({
  question,
  currentIndex,
  totalQuestions,
  onNext,
}: MCQVocabCardProps) {
  const [selectedOptionText, setSelectedOptionText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<SubmitVocabAnswerResult | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isFirstAttempt, setIsFirstAttempt] = useState(true);

  const handleSelectOption = async (optionText: string) => {
    if (hasAnswered || isSubmitting) return;

    setSelectedOptionText(optionText);
    setIsSubmitting(true);

    try {
      const res = await submitVocabAnswer(
        question.vocabId,
        question.questionType,
        optionText
      );

      setFeedback(res);
      setHasAnswered(true);
    } catch (err) {
      console.error('Lỗi nộp đáp án:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextClick = () => {
    if (!feedback) return;
    onNext(isFirstAttempt && feedback.isCorrect, feedback.isCorrect);

    // Reset local card state for next item
    setSelectedOptionText(null);
    setFeedback(null);
    setHasAnswered(false);
    setIsFirstAttempt(true);
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6 max-w-md mx-auto">
      {/* Header & Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5 font-bold text-blue-600">
            <Sparkles className="w-4 h-4" />
            {question.questionType === 'en_vi' ? 'Chọn Nghĩa tiếng Việt' : 'Chọn Từ tiếng Anh'}
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
            btnStyle = 'border-blue-600 bg-blue-50 text-blue-900 font-bold';
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelectOption(opt.text)}
              disabled={hasAnswered || isSubmitting}
              className={cn(
                'w-full p-4 border-2 rounded-2xl text-left text-sm font-semibold transition-all duration-200 flex items-center justify-between group',
                btnStyle
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
                      : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                  )}
                >
                  {optionLabels[idx]}
                </span>
                <span className="text-sm leading-snug">{opt.text}</span>
              </div>

              {hasAnswered && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
              {hasAnswered && isWrongSelected && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Immediate Feedback Card & Explanation */}
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
