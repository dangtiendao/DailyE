'use client';

import React, { useState } from 'react';
import { LearnableVocabItem } from '@/app/actions/vocab_learn';
import { BookOpen, Sparkles, ArrowRight, Volume2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WordIntroCardProps {
  words: LearnableVocabItem[];
  batchIndex: number;
  totalBatches: number;
  onFinishIntro: () => void;
}

export function WordIntroCard({
  words,
  batchIndex,
  totalBatches,
  onFinishIntro,
}: WordIntroCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentWord = words[currentIndex];

  const handleNext = () => {
    if (currentIndex + 1 < words.length) {
      setCurrentIndex((idx) => idx + 1);
    } else {
      onFinishIntro();
    }
  };

  if (!currentWord) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 max-w-md mx-auto animate-in fade-in zoom-in-95 duration-300">
      {/* Header & Step Counter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="flex items-center gap-1.5 font-bold text-amber-600">
            <Sparkles className="w-4 h-4" />
            Giới thiệu từ mới (Đợt {batchIndex + 1}/{totalBatches})
          </span>
          <span className="font-bold text-slate-700">
            Từ {currentIndex + 1} / {words.length}
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-amber-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Hero Card từ vựng */}
      <div className="p-6 bg-gradient-to-b from-amber-50/60 to-orange-50/40 border border-amber-200/70 rounded-3xl text-center space-y-3 relative shadow-inner">
        <span className="text-[11px] font-bold tracking-wider uppercase text-amber-700 bg-amber-100 px-3 py-1 rounded-full inline-block">
          Từ vựng mới
        </span>

        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
          {currentWord.word}
        </h2>

        {currentWord.wordType && (
          <span className="inline-block px-3 py-0.5 bg-white border border-amber-200 text-amber-800 rounded-full text-xs font-bold shadow-xs">
            ({currentWord.wordType})
          </span>
        )}

        <div className="pt-2 border-t border-amber-200/50">
          <p className="text-lg font-bold text-slate-900 leading-snug">{currentWord.meaningVi}</p>
        </div>
      </div>

      {/* Ví dụ minh họa */}
      {currentWord.example && (
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Ví dụ ngữ cảnh
          </span>
          <p className="text-xs text-slate-700 font-medium italic leading-relaxed">
            &quot;{currentWord.example}&quot;
          </p>
        </div>
      )}

      {/* Button Điều hướng */}
      <button
        onClick={handleNext}
        className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition shadow-md"
      >
        <span>
          {currentIndex + 1 < words.length
            ? 'Đã hiểu, xem từ tiếp theo'
            : 'Sẵn sàng Luyện tập 5 từ này'}
        </span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
