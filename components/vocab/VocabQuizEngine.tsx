'use client';

import React, { useState, useEffect } from 'react';
import {
  generateVocabQuiz,
  GenerateVocabQuizParams,
  VocabQuizQuestion,
  VocabMatchingPair,
  finishVocabSession,
} from '@/app/actions/vocab';
import { MCQVocabCard } from './MCQVocabCard';
import { MatchingVocabBoard } from './MatchingVocabBoard';
import { VocabSummaryCard, AttentionWordItem } from './VocabSummaryCard';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { VocabSessionMode } from '@/types/database';

import { flushPendingProgressQueue } from '@/lib/sync-queue';

interface VocabQuizEngineProps {
  params: GenerateVocabQuizParams;
  onFinish?: () => void;
}

export function VocabQuizEngine({ params, onFinish }: VocabQuizEngineProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dữ liệu quiz từ server
  const [questions, setQuestions] = useState<VocabQuizQuestion[]>([]);
  const [matchingPairs, setMatchingPairs] = useState<VocabMatchingPair[]>([]);

  // State quản lý phiên làm bài MCQ (Dạng Queue Hàng Đợi)
  const [activeQueue, setActiveQueue] = useState<VocabQuizQuestion[]>([]);
  const [initialTotalItems, setInitialTotalItems] = useState(0);

  // Thống kê kết quả
  const [firstTryCorrectCount, setFirstTryCorrectCount] = useState(0);
  const [attentionWordsMap, setAttentionWordsMap] = useState<Map<number, AttentionWordItem>>(new Map());
  const [attemptedVocabIds, setAttemptedVocabIds] = useState<Set<number>>(new Set());

  // Trạng thái hoàn thành & thời gian
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [durationSeconds, setDurationSeconds] = useState<number>(0);

  // Khởi tạo và nạp Quiz từ Server
  const loadQuiz = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsCompleted(false);
    setFirstTryCorrectCount(0);
    setAttentionWordsMap(new Map());
    setAttemptedVocabIds(new Set());
    setStartTime(Date.now());

    try {
      const res = await generateVocabQuiz(params);

      if (!res.success) {
        setErrorMessage(res.error || 'Không thể khởi tạo phiên học từ vựng');
      } else if (params.mode === 'matching') {
        if (!res.matchingPairs || res.matchingPairs.length === 0) {
          setErrorMessage('Không tìm thấy từ vựng phù hợp để ghép cặp');
        } else {
          setMatchingPairs(res.matchingPairs);
          setInitialTotalItems(res.matchingPairs.length);
        }
      } else {
        if (!res.questions || res.questions.length === 0) {
          setErrorMessage('Không tìm thấy câu hỏi từ vựng phù hợp');
        } else {
          setQuestions(res.questions);
          setActiveQueue(res.questions);
          setInitialTotalItems(res.questions.length);
        }
      }
    } catch (err) {
      setErrorMessage((err as Error).message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
  }, [JSON.stringify(params)]);

  // Xử lý nạp câu tiếp theo trong Queue MCQ
  const handleMCQNext = (isFirstTryCorrect: boolean, isFinalCorrect: boolean, feedback?: any) => {
    if (activeQueue.length === 0) return;

    const currentItem = activeQueue[0];

    // Ghi nhận nếu đúng lần đầu
    if (!attemptedVocabIds.has(currentItem.vocabId)) {
      setAttemptedVocabIds((prev) => new Set([...prev, currentItem.vocabId]));
      if (isFirstTryCorrect) {
        setFirstTryCorrectCount((c) => c + 1);
      }
    }

    // Nếu trả lời sai -> Ghi vào danh sách từ cần chú ý (Dùng meaningVi từ server feedback)
    if (!isFinalCorrect) {
      setAttentionWordsMap((prev) => {
        const next = new Map(prev);
        next.set(currentItem.vocabId, {
          vocabId: currentItem.vocabId,
          word: feedback?.word || currentItem.word,
          meaningVi: feedback?.meaningVi || currentItem.meaningVi || '',
        });
        return next;
      });
    }

    // CƠ CHẾ HÀNG ĐỢI:
    // Nếu sai -> Đẩy câu hiện tại xuống CUỐI hàng đợi phiên
    // Nếu đúng -> Xóa khỏi hàng đợi
    let nextQueue: VocabQuizQuestion[] = [];
    if (isFinalCorrect) {
      nextQueue = activeQueue.slice(1);
    } else {
      nextQueue = [...activeQueue.slice(1), currentItem];
    }

    setActiveQueue(nextQueue);

    // When session finishes, flush any remaining pending local progress items
    if (nextQueue.length === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      setDurationSeconds(elapsed);
      setIsCompleted(true);

      // Flush ngầm toàn bộ pending progress trong localStorage
      flushPendingProgressQueue();

      // Ghi nhận vocab_sessions về Server
      const mode = (params.mode || 'mixed') as VocabSessionMode;
      finishVocabSession({
        mode,
        totalItems: initialTotalItems,
        correctItems: firstTryCorrectCount + (isFirstTryCorrect ? 1 : 0),
        durationSeconds: elapsed,
      });

      if (onFinish) onFinish();
    }
  };

  // Xử lý khi hoàn thành Matching
  const handleMatchingComplete = (
    firstTryCorrect: number,
    wrongCount: number,
    wrongVocabIds: Set<number>
  ) => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    setDurationSeconds(elapsed);

    const attentionList = matchingPairs.filter((p) => wrongVocabIds.has(p.vocabId));
    const attMap = new Map<number, AttentionWordItem>();
    attentionList.forEach((a) => attMap.set(a.vocabId, { vocabId: a.vocabId, word: a.word, meaningVi: a.meaningVi }));

    setFirstTryCorrectCount(firstTryCorrect);
    setAttentionWordsMap(attMap);
    setIsCompleted(true);

    finishVocabSession({
      mode: 'matching',
      totalItems: initialTotalItems,
      correctItems: firstTryCorrect,
      durationSeconds: elapsed,
    });

    if (onFinish) onFinish();
  };

  // State: Loading Skeletons
  if (isLoading) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-4 shadow-sm max-w-md mx-auto">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Đang khởi tạo các câu hỏi từ vựng...</p>
      </div>
    );
  }

  // State: Error State
  if (errorMessage) {
    return (
      <div className="p-6 bg-white border border-slate-200 rounded-3xl text-center space-y-4 shadow-sm max-w-md mx-auto">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">Khởi tạo thất bại</h3>
          <p className="text-xs text-slate-500">{errorMessage}</p>
        </div>
        <button
          onClick={loadQuiz}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-md"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Thử lại</span>
        </button>
      </div>
    );
  }

  // State: Summary Card
  if (isCompleted) {
    return (
      <VocabSummaryCard
        firstTryCorrectCount={firstTryCorrectCount}
        totalItems={initialTotalItems}
        attentionWords={Array.from(attentionWordsMap.values())}
        durationSeconds={durationSeconds}
        onRestart={loadQuiz}
      />
    );
  }

  // State: Render Mode Matching
  if (params.mode === 'matching') {
    return (
      <MatchingVocabBoard
        matchingPairs={matchingPairs}
        batchSize={5}
        onComplete={handleMatchingComplete}
      />
    );
  }

  // State: Render Mode MCQ (mcq_en_vi, mcq_vi_en, mixed)
  const currentQuestion = activeQueue[0];
  const currentIndex = initialTotalItems - activeQueue.length;

  return (
    <MCQVocabCard
      key={currentQuestion.quizItemId}
      question={currentQuestion}
      currentIndex={currentIndex}
      totalQuestions={initialTotalItems}
      onNext={handleMCQNext}
    />
  );
}
