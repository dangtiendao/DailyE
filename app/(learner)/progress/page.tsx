'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUserProgressStats, UserProgressData } from '@/app/actions/progress';
import { VocabQuizEngine } from '@/components/vocab/VocabQuizEngine';
import { GenerateVocabQuizParams } from '@/app/actions/vocab';
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  BookOpen,
  ArrowRight,
  Target,
  BarChart3,
  Award,
  Sparkles,
  Play,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProgressPage() {
  const [stats, setStats] = useState<UserProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeVocabQuiz, setActiveVocabQuiz] = useState<GenerateVocabQuizParams | null>(null);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const res = await getUserProgressStats();
      setStats(res);
    } catch (err) {
      console.error('Lỗi nạp thống kê /progress:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="p-12 bg-white border border-slate-200 rounded-3xl text-center space-y-3 shadow-sm max-w-md mx-auto">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Đang chuẩn bị báo cáo tiến độ...</p>
      </div>
    );
  }

  const {
    totalAnsweredCount = 0,
    resolvedErrorCount = 0,
    streakCount = 0,
    overallAccuracy = 0,
    vocabLearnedCount = 0,
    vocabLearningCount = 0,
    weakestVocabWords = [],
    dailyStats = [],
    partStats = [],
    weakTags = [],
  } = stats || {};

  const maxDailyCount = Math.max(...dailyStats.map((d) => d.total), 1);

  return (
    <div className="space-y-6 pb-8 max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tiến độ học tập</h1>
          <p className="text-xs text-slate-500">Thống kê hiệu suất 14 ngày & Từ vựng cá nhân</p>
        </div>
        <div className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl">
          <BarChart3 className="w-6 h-6" />
        </div>
      </header>

      {/* HIỂN THỊ VOCAB QUIZ ENGINE LIVE NẾU BẤM ÔN TỪ YẾU */}
      {activeVocabQuiz ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setActiveVocabQuiz(null);
                loadStats();
              }}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl transition shadow-xs"
            >
              ← Quay lại Báo cáo Tiến độ
            </button>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              Ôn tập từ vựng hay sai
            </span>
          </div>

          <VocabQuizEngine
            params={activeVocabQuiz}
            onFinish={() => {
              loadStats();
            }}
          />
        </div>
      ) : (
        <>
          {/* 4 CARD THỐNG KÊ CHÍNH */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total Answered */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Target className="w-4 h-4 text-blue-600" />
                <span>Đã làm TOEIC</span>
              </div>
              <p className="text-2xl font-black text-slate-900">{totalAnsweredCount} câu</p>
            </div>

            {/* Resolved Errors */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Lỗi đã sửa</span>
              </div>
              <p className="text-2xl font-black text-emerald-600">{resolvedErrorCount} câu</p>
            </div>

            {/* Streak */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Streak học</span>
              </div>
              <p className="text-2xl font-black text-amber-600">{streakCount} ngày</p>
            </div>

            {/* Overall Accuracy */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Độ chính xác</span>
              </div>
              <p className="text-2xl font-black text-indigo-600">{overallAccuracy}%</p>
            </div>
          </div>

          {/* KHỐI MỚI: THỐNG KÊ TỪ VỰNG & TOP 5 TỪ HAY SAI */}
          <section className="p-5 bg-white border-2 border-indigo-200 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Tiến độ Từ vựng Active Recall</span>
              </h2>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                {vocabLearnedCount + vocabLearningCount} từ đã nạp
              </span>
            </div>

            {/* Sub-stats Từ vựng */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-0.5">
                <span className="text-[11px] font-bold text-emerald-800">Đã thuộc hoàn toàn</span>
                <p className="text-xl font-black text-emerald-700">{vocabLearnedCount} từ</p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl space-y-0.5">
                <span className="text-[11px] font-bold text-amber-800">Đang trong lộ trình học</span>
                <p className="text-xl font-black text-amber-700">{vocabLearningCount} từ</p>
              </div>
            </div>

            {/* Top 5 từ hay sai nhất */}
            {weakestVocabWords.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    Top {weakestVocabWords.length} từ vựng hay sai nhất
                  </span>
                  <button
                    onClick={() =>
                      setActiveVocabQuiz({
                        mode: 'mixed',
                        source: 'weak',
                        count: 10,
                      })
                    }
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] rounded-xl transition shadow-xs flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Ôn ngay các từ này</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {weakestVocabWords.map((item) => (
                    <div
                      key={item.vocabId}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{item.word}</span>
                        <span className="text-slate-500 ml-2">({item.meaningVi})</span>
                      </div>
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded text-[10px]">
                        Sai {item.totalWrong} lần
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* BIỂU ĐỒ 14 NGÀY GẦN NHẤT (GỘP ĐỦ TOEIC VÀ VOCAB) */}
          <section className="p-4 sm:p-5 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4 w-full max-w-full overflow-hidden">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Hoạt động làm bài 14 ngày gần nhất</span>
              </h2>
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-4 text-[11px] pt-1 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Đúng TOEIC
              </span>
              <span className="flex items-center gap-1 font-semibold text-indigo-700">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Đúng Từ vựng
              </span>
              <span className="flex items-center gap-1 font-semibold text-rose-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" /> Câu Sai
              </span>
            </div>

            {/* Dynamic Bar Chart */}
            <div className="pt-4 pb-2 flex items-end justify-between gap-0.5 sm:gap-1 h-44 border-b border-slate-100 w-full min-w-0">
              {dailyStats.map((item, idx) => {
                const toeicHeight = item.total > 0 ? Math.round((item.toeicCorrect / maxDailyCount) * 120) : 0;
                const vocabHeight = item.total > 0 ? Math.round((item.vocabCorrect / maxDailyCount) * 120) : 0;
                const wrongHeight = item.total > 0 ? Math.round((item.wrong / maxDailyCount) * 120) : 0;

                // Format display date: "13/08" -> "13/8"
                const parts = item.displayDate.split('/');
                const shortDate = parts.length === 2 ? `${parseInt(parts[0], 10)}/${parseInt(parts[1], 10)}` : item.displayDate;
                // Interval: On small mobile, show label every 2 days or for last day to prevent text overlap
                const showOnMobile = idx % 2 === 0 || idx === dailyStats.length - 1;

                return (
                  <div key={item.date} className="flex-1 min-w-0 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip hover */}
                    {item.total > 0 && (
                      <div className="absolute -top-10 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10 shadow-lg">
                        {item.displayDate}: TOEIC {item.toeicCorrect} | Vocab {item.vocabCorrect} | Sai {item.wrong}
                      </div>
                    )}

                    <div className="w-full flex flex-col items-center justify-end h-32 gap-0.5">
                      {item.toeicCorrect > 0 && (
                        <div
                          className="w-full max-w-[8px] sm:max-w-[12px] bg-emerald-500 rounded-t-sm transition-all duration-300"
                          style={{ height: `${toeicHeight}px` }}
                        />
                      )}
                      {item.vocabCorrect > 0 && (
                        <div
                          className="w-full max-w-[8px] sm:max-w-[12px] bg-indigo-500 rounded-t-sm transition-all duration-300"
                          style={{ height: `${vocabHeight}px` }}
                        />
                      )}
                      {item.wrong > 0 && (
                        <div
                          className="w-full max-w-[8px] sm:max-w-[12px] bg-rose-400 rounded-t-sm transition-all duration-300"
                          style={{ height: `${wrongHeight}px` }}
                        />
                      )}
                      {item.total === 0 && <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
                    </div>

                    <span
                      className={cn(
                        'text-[9px] sm:text-[10px] text-slate-400 font-medium truncate max-w-full text-center',
                        !showOnMobile && 'hidden sm:block'
                      )}
                    >
                      {shortDate}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* TOP 3 CHỦ ĐIỂM YẾU NHẤT TOEIC */}
          {weakTags.length > 0 && (
            <section className="p-5 bg-amber-50/80 border border-amber-200 rounded-3xl shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h2 className="font-bold text-sm">3 Chủ điểm TOEIC cần cải thiện nhất</h2>
                  <p className="text-[11px] text-amber-700">Tỷ lệ chính xác thấp. Hãy ôn tập lại các bài học này!</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {weakTags.map((item) => (
                  <div key={item.tag} className="p-3 bg-white border border-amber-100 rounded-2xl shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{item.tag}</span>
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-[11px]">
                        {item.correct}/{item.total} câu ({item.accuracy}%)
                      </span>
                    </div>

                    {item.recommendedLessonSlug ? (
                      <Link
                        href={`/learn/${item.recommendedLessonSlug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline pt-0.5"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Học bài: {item.recommendedLessonTitle}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Link
                        href={`/practice/session?tag=${encodeURIComponent(item.tag)}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:underline pt-0.5"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Luyện thêm 10 câu dễ tag {item.tag}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TỶ LỆ CHÍNH XÁC THEO PART */}
          <section className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Tỷ lệ chính xác theo từng Part TOEIC</span>
            </h2>

            <div className="space-y-3 pt-1">
              {partStats.map((item) => (
                <div key={item.part} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.label}</span>
                    <span className="font-bold text-emerald-600">
                      {item.correct}/{item.total} câu ({item.accuracy}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
