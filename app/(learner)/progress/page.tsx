import React from 'react';
import Link from 'next/link';
import { getUserProgressStats } from '@/app/actions/progress';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Trang /progress: Báo cáo Tiến độ học tập & Thống kê 14 ngày
export default async function ProgressPage() {
  const stats = await getUserProgressStats();

  const { totalAnsweredCount, resolvedErrorCount, streakCount, overallAccuracy, dailyStats, partStats, weakTags } = stats;

  const maxDailyCount = Math.max(...dailyStats.map((d) => d.total), 1);

  return (
    <div className="space-y-6 pb-8 max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tiến độ học tập</h1>
          <p className="text-xs text-slate-500">Thống kê hiệu suất 14 ngày & Lỗ hổng kiến thức</p>
        </div>
        <div className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl">
          <BarChart3 className="w-6 h-6" />
        </div>
      </header>

      {/* 4 CARD THỐNG KÊ CHÍNH */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Answered */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Target className="w-4 h-4 text-blue-600" />
            <span>Đã làm</span>
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

      {/* BIỂU ĐỒ 14 NGÀY GẦN NHẤT */}
      <section className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Số câu làm đúng / sai 14 ngày gần nhất</span>
          </h2>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Đúng
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" /> Sai
            </span>
          </div>
        </div>

        {/* Dynamic Bar Chart */}
        <div className="pt-4 pb-2 flex items-end justify-between gap-1 h-44 border-b border-slate-100">
          {dailyStats.map((item) => {
            const correctHeight = item.total > 0 ? Math.round((item.correct / maxDailyCount) * 120) : 0;
            const wrongHeight = item.total > 0 ? Math.round((item.wrong / maxDailyCount) * 120) : 0;

            return (
              <div key={item.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                {/* Tooltip hover */}
                {item.total > 0 && (
                  <div className="absolute -top-8 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
                    Đúng {item.correct} / Sai {item.wrong}
                  </div>
                )}

                <div className="w-full flex flex-col items-center justify-end h-32 gap-0.5">
                  {item.correct > 0 && (
                    <div
                      className="w-full max-w-[14px] bg-emerald-500 rounded-t-sm transition-all duration-300"
                      style={{ height: `${correctHeight}px` }}
                    />
                  )}
                  {item.wrong > 0 && (
                    <div
                      className="w-full max-w-[14px] bg-rose-400 rounded-t-sm transition-all duration-300"
                      style={{ height: `${wrongHeight}px` }}
                    />
                  )}
                  {item.total === 0 && <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
                </div>

                <span className="text-[10px] text-slate-400 font-medium">{item.displayDate}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* TOP 3 CHỦ ĐIỂM YẾU NHẤT (CẦN CẢI THIỆN GẤP) */}
      {weakTags.length > 0 && (
        <section className="p-5 bg-amber-50/80 border border-amber-200 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h2 className="font-bold text-sm">3 Chủ điểm cần cải thiện nhất</h2>
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
          <span>Tỷ lệ chính xác theo từng Part</span>
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

      {totalAnsweredCount === 0 && (
        <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-3 shadow-sm">
          <Award className="w-10 h-10 text-blue-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Chưa có dữ liệu làm bài</h3>
            <p className="text-xs text-slate-500">Hãy làm bài luyện đề đầu tiên để bắt đầu theo dõi tiến độ!</p>
          </div>
          <Link
            href="/practice"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs transition shadow-md"
          >
            Luyện đề ngay
          </Link>
        </div>
      )}
    </div>
  );
}
