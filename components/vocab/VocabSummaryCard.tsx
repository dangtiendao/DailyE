'use client';

import React from 'react';
import Link from 'next/link';
import { Award, CheckCircle2, AlertTriangle, RefreshCw, Home, BookOpen, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AttentionWordItem {
  vocabId: number;
  word: string;
  meaningVi: string;
}

interface VocabSummaryCardProps {
  firstTryCorrectCount: number;
  totalItems: number;
  attentionWords: AttentionWordItem[];
  durationSeconds?: number;
  onRestart: () => void;
}

export function VocabSummaryCard({
  firstTryCorrectCount,
  totalItems,
  attentionWords,
  durationSeconds,
  onRestart,
}: VocabSummaryCardProps) {
  const scorePercent = totalItems > 0 ? Math.round((firstTryCorrectCount / totalItems) * 100) : 0;

  const formatDuration = (totalSecs?: number) => {
    if (!totalSecs) return '00:00';
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 max-w-md mx-auto text-center animate-in fade-in zoom-in-95 duration-300">
      {/* Hero Badge */}
      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
        <Award className="w-10 h-10" />
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-black text-slate-900">Hoàn thành Phiên học!</h2>
        <p className="text-xs text-slate-500">Bạn đã hoàn thành tốt các câu hỏi từ vựng hôm nay</p>
      </div>

      {/* Stats Summary Card */}
      <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold text-slate-500">Đúng ngay lần đầu</span>
          <p className="text-xl font-black text-emerald-600">
            {firstTryCorrectCount} / {totalItems} <span className="text-xs font-normal">({scorePercent}%)</span>
          </p>
        </div>
        <div className="space-y-0.5 border-l border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500">Thời gian làm</span>
          <p className="text-xl font-black text-slate-800">{formatDuration(durationSeconds)}</p>
        </div>
      </div>

      {/* Words Needing Attention List */}
      {attentionWords.length > 0 && (
        <div className="space-y-3 text-left bg-amber-50/80 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Từ vựng cần chú ý ({attentionWords.length} từ)</span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {attentionWords.map((item) => (
              <div key={item.vocabId} className="p-2.5 bg-white border border-amber-100 rounded-xl text-xs flex items-center justify-between">
                <span className="font-bold text-slate-900">{item.word}</span>
                <span className="text-slate-600">{item.meaningVi}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          onClick={onRestart}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-md"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Học tiếp phiên mới</span>
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
  );
}
