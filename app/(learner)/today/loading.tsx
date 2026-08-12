import React from 'react';

// Skeleton Loading cho trang /today - Mô phỏng 100% layout thật (Tránh Layout Shift)
export default function TodayLoading() {
  return (
    <div className="space-y-6 pb-6 max-w-xl mx-auto animate-pulse">
      {/* Header Chào mừng & Streak Skeleton */}
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded-xl" />
          <div className="h-4 w-36 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-9 w-24 bg-amber-200 rounded-2xl" />
      </header>

      {/* KHỐI 1: SRS Spaced Repetition Skeleton */}
      <div className="bg-slate-200 rounded-3xl p-5 h-36 space-y-3 shadow-sm" />

      {/* KHỐI 2: Lộ trình bài học Skeleton */}
      <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3 h-32 shadow-sm">
        <div className="flex justify-between">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-4 w-12 bg-slate-200 rounded" />
        </div>
        <div className="h-6 w-3/4 bg-slate-200 rounded" />
      </div>

      {/* KHỐI 3: Luyện đề cá nhân hóa Skeleton */}
      <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3 h-36 shadow-sm">
        <div className="flex justify-between">
          <div className="h-4 w-36 bg-slate-200 rounded" />
          <div className="h-4 w-16 bg-slate-200 rounded" />
        </div>
        <div className="h-5 w-2/3 bg-slate-200 rounded" />
        <div className="h-4 w-full bg-slate-100 rounded" />
      </div>

      {/* KHỐI 4: Sổ lỗi sai Skeleton */}
      <div className="p-5 bg-rose-50 border border-rose-100 rounded-3xl h-20 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-4 w-40 bg-rose-200 rounded" />
          <div className="h-3 w-56 bg-rose-100 rounded" />
        </div>
        <div className="h-8 w-20 bg-rose-200 rounded-xl" />
      </div>
    </div>
  );
}
