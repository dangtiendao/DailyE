'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getVocabularyItems, VocabularyFlashcardItem } from '@/app/actions/learn';
import { ArrowLeft, RotateCw, CheckCircle2, XCircle, Sparkles, RefreshCw, Trophy, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Trang Flashcards Từ vựng TOEIC tương tác trong-phiên
export default function FlashcardsPage() {
  const [initialItems, setInitialItems] = useState<VocabularyFlashcardItem[]>([]);
  const [queue, setQueue] = useState<VocabularyFlashcardItem[]>([]);
  const [masteredCount, setMasteredCount] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Tải danh sách từ vựng
  const loadVocab = async () => {
    setIsLoading(true);
    const data = await getVocabularyItems();
    setInitialItems(data);
    setQueue(data);
    setMasteredCount(0);
    setIsFlipped(false);
    setIsLoading(false);
  };

  useEffect(() => {
    loadVocab();
  }, []);

  const currentCard = queue[0];

  // Xử lý khi nhấn "Đã nhớ" (Loại bỏ từ khỏi phiên)
  const handleRemember = () => {
    if (queue.length === 0) return;
    setIsFlipped(false);
    setMasteredCount((prev) => prev + 1);
    setQueue((prev) => prev.slice(1));
  };

  // Xử lý khi nhấn "Chưa nhớ" (Đẩy từ về cuối hàng đợi phiên hiện tại)
  const handleForget = () => {
    if (queue.length === 0) return;
    setIsFlipped(false);
    setQueue((prev) => {
      const [first, ...rest] = prev;
      return [...rest, first];
    });
  };

  const totalCards = initialItems.length;
  const progressPercent = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;

  return (
    <div className="space-y-6 pb-8 max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang Học</span>
        </Link>
        <span className="font-bold text-xs text-slate-700 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Flashcards từ vựng
        </span>
      </header>

      {/* Progress Bar Phiên học */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">Tiến độ phiên học</span>
          <span className="font-bold text-blue-600">{masteredCount} / {totalCards} từ ({progressPercent}%)</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center space-y-3 bg-white border border-slate-200 rounded-3xl">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs text-slate-500">Đang chuẩn bị bộ thẻ Flashcards...</p>
        </div>
      ) : queue.length > 0 ? (
        /* Thẻ Flashcard tương tác */
        <div className="space-y-6">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[280px] bg-white border-2 border-blue-200 hover:border-blue-400 rounded-3xl p-6 shadow-xl flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-300 relative select-none"
          >
            {/* Tag Level & Topic */}
            <div className="w-full flex items-center justify-between text-xs text-slate-400">
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold">
                {currentCard.level_tag || '500+'}
              </span>
              <span className="font-medium text-slate-500">{currentCard.topic || 'General'}</span>
            </div>

            {/* MẶT TRƯỚC / MẶT SAU */}
            {!isFlipped ? (
              <div className="space-y-2 my-auto">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{currentCard.word}</h2>
                <p className="text-xs text-blue-600 font-medium flex items-center justify-center gap-1">
                  <RotateCw className="w-3.5 h-3.5" /> Nhấp vào thẻ để xem nghĩa
                </p>
              </div>
            ) : (
              <div className="space-y-3 my-auto animate-fade-in">
                <h3 className="text-2xl font-bold text-blue-600">{currentCard.meaning_vi}</h3>
                {currentCard.example && (
                  <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{currentCard.example}"
                  </p>
                )}
              </div>
            )}

            {/* Hướng dẫn góc dưới */}
            <span className="text-[11px] text-slate-400">
              {isFlipped ? 'Chạm để lật về mặt trước' : 'Chạm để lật mặt sau'}
            </span>
          </div>

          {/* Nút đánh giá: "Chưa nhớ" vs "Đã nhớ" */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleForget}
              className="py-3.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <XCircle className="w-4 h-4 text-amber-600" />
              <span>Chưa nhớ (Lặp lại)</span>
            </button>

            <button
              onClick={handleRemember}
              className="py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã nhớ</span>
            </button>
          </div>
        </div>
      ) : (
        /* Màn hình Hoàn thành phiên Flashcards */
        <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">Xuất sắc!</h2>
            <p className="text-xs text-slate-500">
              Bạn đã thuộc toàn bộ {totalCards} từ vựng trong phiên học này.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadVocab}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Học lại phiên này</span>
            </button>

            <Link
              href="/learn"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs transition flex items-center justify-center"
            >
              Về bài học
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
