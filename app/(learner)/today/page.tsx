import React from 'react';
import { CalendarDays, Sparkles, AlertTriangle, Info } from 'lucide-react';

interface TodayPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Tab 1: Màn hình "Hôm nay" - Lộ trình & Nhiệm vụ học hàng ngày
export default async function TodayPage({ searchParams }: TodayPageProps) {
  const params = await searchParams;
  const errorParam = params?.error;
  const noticeParam = params?.notice;

  return (
    <div className="space-y-6">
      {/* Thông báo sai quyền từ Middleware */}
      {errorParam === 'unauthorized' && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-600 text-xs shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
          <div>
            <p className="font-bold text-slate-900">Không có quyền truy cập</p>
            <p className="text-slate-600">Trang quản trị chỉ dành cho tài khoản Admin.</p>
          </div>
        </div>
      )}

      {/* Thông báo làm bài test đầu vào sau Onboarding */}
      {noticeParam === 'placement_test_soon' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 text-blue-700 text-xs shadow-sm">
          <Info className="w-5 h-5 shrink-0 text-blue-600" />
          <div>
            <p className="font-bold text-slate-900">Thông báo bài Test đầu vào</p>
            <p className="text-slate-600">Tính năng bài test sẽ ra mắt ở các phase tiếp theo. Hãy bắt đầu học các bài học kiến thức trước nhé!</p>
          </div>
        </div>
      )}

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
        <p className="text-center text-slate-500 text-sm">Giao diện nhiệm vụ sẽ được tích hợp dữ liệu ở các phase tiếp theo.</p>
      </div>
    </div>
  );
}
