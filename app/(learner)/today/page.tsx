import React from 'react';
import Link from 'next/link';
import { getTodayDashboardData } from '@/app/actions/srs';
import {
  Flame,
  RotateCcw,
  BookOpen,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Trang /today: Phiên học hằng ngày (Daily Learning Session) & Streak
export default async function TodayPage() {
  const dashboard = await getTodayDashboardData();

  const { streakCount, dueVocabCount, nextLesson, recommendedPractice, unresolvedErrorCount, userProfile } = dashboard;

  return (
    <div className="space-y-6 pb-8 max-w-md mx-auto">
      {/* Header Chào mừng & Chuỗi Streak (🔥) */}
      <header className="flex items-center justify-between bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
        <div className="space-y-0.5">
          <p className="text-xs text-slate-500 font-medium">Phiên học hằng ngày</p>
          <h1 className="text-lg font-extrabold text-slate-900">
            Xin chào, {userProfile?.full_name || 'Học viên DailyE'} 👋
          </h1>
        </div>

        {/* Cụm Streak 🔥 */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-2xl font-black text-sm shadow-md animate-pulse">
          <Flame className="w-5 h-5 text-yellow-300 fill-yellow-300" />
          <span>{streakCount} ngày</span>
        </div>
      </header>

      {/* THÔNG BÁO / KHỦNG LONG ĐỘC LẬP TỪ SEARCH PARAMS */}
      {/* KHỐI 1: 🔤 TỪ VỰNG ĐẾN HẠN ÔN NĂM (SRS LEITNER) */}
      <section className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl text-white shadow-lg space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-blue-100 font-bold uppercase tracking-wider">
          <span>Khối 1 • Lặp lại ngắt quãng (SRS)</span>
          <span className="px-2 py-0.5 bg-white/20 rounded-full">{dueVocabCount} từ cần ôn</span>
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-black tracking-tight">🔤 Ôn tập Từ vựng đến hạn</h2>
          <p className="text-xs text-blue-100 leading-relaxed">
            {dueVocabCount > 0
              ? `Bạn có ${dueVocabCount} từ vựng cần ôn tập hôm nay để khắc sâu vào trí nhớ dài hạn.`
              : 'Hiện chưa có từ vựng nào đến hạn ôn tập hôm nay. Hãy học thêm từ mới!'}
          </p>
        </div>

        <Link
          href="/learn/vocabulary"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 text-blue-700 font-bold rounded-2xl text-xs transition shadow-md"
        >
          <span>Lật thẻ ngay ({dueVocabCount} thẻ)</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
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

      {/* KHỐI 3: 📝 BÀI LUYỆN ĐỀ XUẤT THÔNG MINH (RULE-BASED) */}
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
              : 'Định hướng'}
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            <span>{recommendedPractice.title}</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">{recommendedPractice.description}</p>

          <Link
            href={`/practice/session?part=${recommendedPractice.targetPart}&tag=${encodeURIComponent(
              recommendedPractice.tag
            )}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition shadow-md mt-1"
          >
            <span>Luyện ngay bài đề xuất</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* KHỐI 4: 🔁 SỐ CÂU SAI ĐANG CHỜ ÔN TRONG SỔ LỖI SAI */}
      <section className="p-5 bg-rose-50 border border-rose-200 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-rose-800 uppercase tracking-wider">Khối 4 • Sổ lỗi sai</span>
          <span className="px-2 py-0.5 bg-rose-200 text-rose-900 rounded-full font-bold">
            {unresolvedErrorCount} câu chờ ôn
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Ôn tập câu làm sai</span>
          </h3>
          <p className="text-xs text-rose-800 leading-relaxed">
            {unresolvedErrorCount > 0
              ? `Bạn có ${unresolvedErrorCount} câu hỏi từng làm sai chưa được giải quyết. Ôn lại ngay để không lặp lại lỗi cũ!`
              : 'Sổ lỗi sai của bạn hiện đang trống. Rất xuất sắc!'}
          </p>

          <Link
            href="/practice/errors"
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-xs transition shadow-md mt-1"
          >
            <span>Mở Sổ lỗi sai ({unresolvedErrorCount})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
