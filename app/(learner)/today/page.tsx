import React from 'react';
import { CalendarDays, Sparkles } from 'lucide-react';

// Tab 1: Màn hình "Hôm nay" - Lộ trình và nhiệm vụ học hàng ngày
export default function TodayPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hôm nay</h1>
          <p className="text-sm text-slate-500">Nhiệm vụ học tập daily của bạn</p>
        </div>
        <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
          <CalendarDays className="w-6 h-6" />
        </div>
      </header>

      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">Lộ trình mục tiêu</span>
        </div>
        <h2 className="text-xl font-bold">Chinh phục TOEIC 750+</h2>
        <p className="text-sm text-blue-100 mt-1">Hoàn thành bài luyện từ vựng và 10 câu Part 5 ngay hôm nay!</p>
      </section>

      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <p className="text-center text-slate-500 text-sm">Giao diện nhiệm vụ sẽ được triển khai ở các phase tiếp theo.</p>
      </div>
    </div>
  );
}
