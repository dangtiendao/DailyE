'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getVocabTopicsWithProgress,
  getNewWordsForTopic,
  recordWordsIntroduced,
  completeNewWordsSession,
  VocabTopicWithProgress,
  LearnableVocabItem,
} from '@/app/actions/vocab_learn';
import { TopicCard } from '@/components/vocab/TopicCard';
import { WordIntroCard } from '@/components/vocab/WordIntroCard';
import { VocabQuizEngine } from '@/components/vocab/VocabQuizEngine';
import {
  BookOpen,
  Sparkles,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Home,
  Award,
} from 'lucide-react';
import { VocabQuizQuestion } from '@/app/actions/vocab';

type LearnPhase = 'intro' | 'quiz';

export default function VocabularyPage() {
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [topics, setTopics] = useState<VocabTopicWithProgress[]>([]);

  // State luồng phiên học
  const [selectedTopic, setSelectedTopic] = useState<VocabTopicWithProgress | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sessionWords, setSessionWords] = useState<LearnableVocabItem[]>([]);
  const [sessionErrorMessage, setSessionErrorMessage] = useState<string | null>(null);

  // State các bước trong phiên học
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0); // 0 (5 từ đầu) hoặc 1 (5 từ sau)
  const [currentPhase, setCurrentPhase] = useState<LearnPhase>('intro');
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());

  // Tải danh sách chủ đề
  const loadTopics = async () => {
    setIsLoadingTopics(true);
    try {
      const data = await getVocabTopicsWithProgress();
      setTopics(data);
    } catch (err) {
      console.error('Lỗi đọc danh sách topics:', err);
    } finally {
      setIsLoadingTopics(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  // Bắt đầu phiên học từ mới cho 1 topic
  const handleStartTopicSession = async (topicCode: string) => {
    const topic = topics.find((t) => t.code === topicCode);
    if (!topic) return;

    setSelectedTopic(topic);
    setIsLoadingSession(true);
    setSessionErrorMessage(null);
    setIsSessionCompleted(false);
    setCurrentBatchIndex(0);
    setCurrentPhase('intro');
    setSessionStartTime(Date.now());

    try {
      const res = await getNewWordsForTopic(topicCode, 10);
      if (!res.success || !res.words) {
        setSessionErrorMessage(res.error || 'Không thể lấy từ mới cho chủ đề này');
      } else {
        setSessionWords(res.words);
      }
    } catch (err) {
      setSessionErrorMessage((err as Error).message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Hoàn thành đợt giới thiệu từ mới (5 từ)
  const handleFinishIntroBatch = async () => {
    const batchWords = sessionWords.slice(currentBatchIndex * 5, (currentBatchIndex + 1) * 5);
    const vocabIds = batchWords.map((w) => w.id);

    // Ghi nhận vào user_vocab_progress (familiarity = 1)
    await recordWordsIntroduced(vocabIds);

    // Chuyển sang Phase Quiz cho 5 từ này
    setCurrentPhase('quiz');
  };

  // Hoàn thành đợt Quiz (5 từ)
  const handleFinishQuizBatch = async () => {
    const hasNextBatch = (currentBatchIndex + 1) * 5 < sessionWords.length;

    if (hasNextBatch) {
      setCurrentBatchIndex((b) => b + 1);
      setCurrentPhase('intro');
    } else {
      // Đã hoàn thành toàn bộ phiên học -> Đẩy vào review_schedule (due ngày mai)
      const allVocabIds = sessionWords.map((w) => w.id);
      const elapsed = Math.round((Date.now() - sessionStartTime) / 1000);
      await completeNewWordsSession(allVocabIds, elapsed);

      setIsSessionCompleted(true);
      loadTopics(); // Tải lại tiến độ các topic
    }
  };

  // Thoát phiên học về danh sách chủ đề
  const handleExitSession = () => {
    setSelectedTopic(null);
    setSessionWords([]);
    setIsSessionCompleted(false);
  };

  // ============================================================================
  // GIAO DIỆN 1: BẢNG DANH SÁCH CHỦ ĐỀ
  // ============================================================================
  if (!selectedTopic) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/learn"
                className="p-1.5 bg-white hover:bg-slate-200 text-slate-600 rounded-lg transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">Học Từ vựng Active Recall</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Chọn chủ đề để học từ mới & kiểm tra ghi nhớ chủ động</p>
          </div>
          <div className="p-2.5 bg-amber-100 text-amber-600 rounded-2xl">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* Loading Topics State */}
        {isLoadingTopics ? (
          <div className="p-12 bg-white border border-slate-200 rounded-3xl text-center space-y-3 shadow-sm">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Đang nạp danh mục chủ đề & tiến độ...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topics.map((t) => (
              <TopicCard key={t.code} topic={t} onSelectTopic={handleStartTopicSession} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // GIAO DIỆN 2: PHIÊN HỌC TỪ MỚI (INTRO 5 TỪ -> QUIZ 5 TỪ -> TỔNG KẾT)
  // ============================================================================
  const currentBatchWords = sessionWords.slice(currentBatchIndex * 5, (currentBatchIndex + 1) * 5);
  const totalBatches = Math.ceil(sessionWords.length / 5);

  return (
    <div className="space-y-6 max-w-md mx-auto pb-8">
      {/* Header Phiên học */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleExitSession}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Thoát phiên học</span>
        </button>

        <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
          {selectedTopic.displayName}
        </span>
      </div>

      {/* State: Loading Session Words */}
      {isLoadingSession && (
        <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-3 shadow-sm">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Đang chuẩn bị từ vựng mới cho bạn...</p>
        </div>
      )}

      {/* State: Session Error */}
      {!isLoadingSession && sessionErrorMessage && (
        <div className="p-6 bg-white border border-slate-200 rounded-3xl text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Không thể bắt đầu</h3>
            <p className="text-xs text-slate-500">{sessionErrorMessage}</p>
          </div>
          <button
            onClick={handleExitSession}
            className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl transition shadow-md"
          >
            Quay lại chọn chủ đề
          </button>
        </div>
      )}

      {/* State: Không còn từ mới trong Topic */}
      {!isLoadingSession && !sessionErrorMessage && sessionWords.length === 0 && (
        <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">Bạn đã học hết từ mới của chủ đề này 🎉</h3>
            <p className="text-xs text-slate-500">
              Tất cả từ vựng trong chủ đề {selectedTopic.displayName} đã được nạp vào lộ trình ghi nhớ của bạn.
            </p>
          </div>
          <button
            onClick={handleExitSession}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-md"
          >
            Chọn chủ đề khác
          </button>
        </div>
      )}

      {/* State: Hoàn thành phiên học từ mới */}
      {isSessionCompleted && (
        <div className="p-6 bg-white border border-slate-200 rounded-3xl text-center space-y-5 shadow-sm animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900">Hoàn thành bài học từ mới!</h2>
            <p className="text-xs text-slate-500">
              Đã nạp thành công <span className="font-bold text-slate-900">{sessionWords.length} từ vựng</span> vào Lịch ôn tập SRS (due ngày mai).
            </p>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-900 font-semibold">
            ✨ Bạn sẽ gặp lại các từ vựng này trong Phiên học Hằng ngày tại trang /today vào ngày mai!
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleExitSession}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-md"
            >
              Học tiếp chủ đề khác
            </button>
            <Link
              href="/today"
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
            >
              <Home className="w-4 h-4" />
              <span>Về trang chủ</span>
            </Link>
          </div>
        </div>
      )}

      {/* State: Đang trong tiến trình học (Intro hoặc Quiz) */}
      {!isLoadingSession && !sessionErrorMessage && sessionWords.length > 0 && !isSessionCompleted && (
        <>
          {currentPhase === 'intro' ? (
            <WordIntroCard
              words={currentBatchWords}
              batchIndex={currentBatchIndex}
              totalBatches={totalBatches}
              onFinishIntro={handleFinishIntroBatch}
            />
          ) : (
            <VocabQuizEngine
              params={{
                mode: 'mixed',
                count: currentBatchWords.length,
                topic: selectedTopic.code,
              }}
              onFinish={handleFinishQuizBatch}
            />
          )}
        </>
      )}
    </div>
  );
}
