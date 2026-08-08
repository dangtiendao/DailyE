'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTodayDashboardData, TodayDashboardData } from '@/app/actions/srs';
import { VocabQuizEngine } from '@/components/vocab/VocabQuizEngine';
import { GenerateVocabQuizParams } from '@/app/actions/vocab';
import {
  Flame,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Play,
  RotateCcw,
  Loader2,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TodayPage() {
  const [data, setData] = useState<TodayDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeVocabQuiz, setActiveVocabQuiz] = useState<GenerateVocabQuizParams | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getTodayDashboardData();
      setData(res);
    } catch (err) {
      console.error('Lỗi nạp bảng điều khiển /today:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-12 bg-white border border-slate-200 rounded-3xl text-center space-y-3 shadow-sm max-w-xl mx-auto">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Đang chuẩn bị phiên học hôm nay...</p>
      </div>
    );
  }

  const streakCount = data?.streakCount || 0;
  const dueVocabCount = data?.dueVocabCount || 0;
  const nextLesson = data?.nextLesson || null;
  const recommendedPractice = data?.recommendedPractice || {
    type: 'same_level',
    title: 'Luyện tập Part 5',
    description: 'Luyện 15 câu hoàn thành câu cơ bản',
    tag: 'Grammar',
    targetPart: 'part5',
    difficulty: 'medium',
  };
  const unresolvedErrorCount = data?.unresolvedErrorCount || 0;
  const userProfile = data?.userProfile || null;

  return (
    <div className="space-y-6 pb-6 max-w-xl mx-auto">
      {/* Header Chào mừng & Streak 🔥 */}
      <header className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black text-slate-900">
            Xin chào, {userProfile?.full_name || 'Học viên'}! 👋
          </h1>
          <p className="text-xs text-slate-500 font-medium">Học đúng lỗi sai, tiến bộ mỗi ngày</p>
        </div>

        {/* Streak Badge */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-sm shadow-md animate-bounce-subtle">
          <Flame className="w-5 h-5 fill-white" />
          <span>{streakCount} ngày</span>
        </div>
      </header>

      {/* HIỂN THỊ VOCAB QUIZ ENGINE LIVE NẾU BẤM BẮT ĐẦU ÔN TỪ ĐẾN HẠN */}
      {activeVocabQuiz ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setActiveVocabQuiz(null);
                loadData();
              }}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl transition shadow-xs"
            >
              ← Quay lại Trang chủ
            </button>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              Ôn tập Từ vựng SRS đến hạn
            </span>
          </div>

          <VocabQuizEngine
            params={activeVocabQuiz}
            onFinish={() => {
              loadData();
            }}
          />
        </div>
      ) : (
        <>
          {/* KHỐI 1: 🔤 TỪ VỰNG ĐẾN HẠN ÔN (SRS LEITNER) */}
          <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-5 text-white shadow-lg space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-100">Khối 1 • SRS Spaced Repetition</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black tracking-tight">🔤 {dueVocabCount} từ vựng đến hạn ôn tập</h2>
              <p className="text-xs text-blue-100 leading-relaxed">
                {dueVocabCount > 0
                  ? `Bạn có ${dueVocabCount} từ vựng đến hạn ôn tập hôm nay theo thuật toán ngắt quãng Leitner.`
                  : 'Hiện chưa có từ vựng nào đến hạn ôn tập hôm nay. Hãy học thêm từ mới nhé! 🎉'}
              </p>
            </div>

            {dueVocabCount > 0 ? (
              <button
                onClick={() =>
                  setActiveVocabQuiz({
                    mode: 'mixed',
                    source: 'due',
                    count: Math.min(30, dueVocabCount),
                  })
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 text-blue-700 font-bold rounded-2xl text-xs transition shadow-md"
              >
                <Play className="w-4 h-4 fill-blue-700" />
                <span>Bắt đầu Quiz Ôn tập ({dueVocabCount} từ)</span>
              </button>
            ) : (
              <Link
                href="/learn/vocabulary"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 text-blue-700 font-bold rounded-2xl text-xs transition shadow-md"
              >
                <span>Học từ mới ngay 👉</span>
              </Link>
            )}
          </section>

          {/* KHỐI 2: 📘 BÀI HỌC TIẾP THEO TRONG LỘ TRÌNH */}
          <section className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider">Khối 2 • Lộ trình kiến thức</span>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold">
                {nextLesson?.level_tag || '500+'}
              </span>
            </div>

            {nextLesson ? (
              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600 shrink-0" />
                  <span>{nextLesson.title}</span>
                </h3>
                <p className="text-xs text-slate-500">Chủ đề: {nextLesson.skill}</p>

                <Link
                  href={`/learn/${nextLesson.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition shadow-md mt-1"
                >
                  <span>Vào bài học ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Bạn đã hoàn thành tất cả bài học hiện có!</p>
            )}
          </section>

          {/* KHỐI 3: 📝 BÀI LUYỆN ĐỀ XUẤT THÔNG MINH */}
          <section className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider">Khối 3 • Luyện đề cá nhân hóa</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-md font-bold uppercase text-[10px]',
                  recommendedPractice.type === 'remedial'
                    ? 'bg-amber-100 text-amber-800'
                    : recommendedPractice.type === 'challenge'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-emerald-100 text-emerald-800'
                )}
              >
                {recommendedPractice.type === 'remedial'
                  ? 'Củng cố'
                  : recommendedPractice.type === 'challenge'
                  ? 'Thử thách'
                  : 'Tiêu chuẩn'}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base">{recommendedPractice.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{recommendedPractice.description}</p>

              <Link
                href={`/practice/session?part=${recommendedPractice.targetPart}&difficulty=${recommendedPractice.difficulty}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition shadow-md mt-1"
              >
                <span>Bắt đầu bài luyện đề xuất</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          {/* KHỐI 4: 📕 SỔ LỖI SAI (CÂU CHƯA KHẮC PHỤC) */}
          <section className="p-5 bg-rose-50/80 border border-rose-200 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-900">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-sm">Sổ lỗi sai ({unresolvedErrorCount} câu chưa sửa)</h3>
                  <p className="text-[11px] text-rose-700">Trả lời đúng 2 lần liên tiếp để gạch bỏ câu sai</p>
                </div>
              </div>

              {unresolvedErrorCount > 0 && (
                <Link
                  href="/practice/errors"
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ôn ngay</span>
                </Link>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
