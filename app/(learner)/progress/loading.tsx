import React from 'react';

// Skeleton Loading cho trang /progress - Báo cáo tiến độ 14 ngày & từ vựng
export default function ProgressLoading() {
  return (
    <div className="space-y-6 pb-8 max-w-md mx-auto animate-pulse">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-slate-200 rounded-xl" />
          <div className="h-4 w-60 bg-slate-200 rounded-lg" />
        </div>
        <div className="w-10 h-10 bg-blue-100 rounded-2xl" />
      </header>

      {/* 4 Cards Thống kê chính Skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 bg-white border border-slate-200 rounded-2xl h-24 shadow-sm space-y-2">
            <div className="h-3 w-20 bg-slate-200 rounded" />
            <div className="h-7 w-16 bg-slate-300 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Tiến độ từ vựng Active Recall Skeleton */}
      <div className="p-5 bg-white border-2 border-indigo-100 rounded-3xl h-48 shadow-sm space-y-4" />

      {/* Biểu đồ 14 ngày Skeleton */}
      <div className="p-5 bg-white border border-slate-200 rounded-3xl h-64 shadow-sm space-y-4" />

      {/* Part Accuracy Skeleton */}
      <div className="p-5 bg-white border border-slate-200 rounded-3xl h-44 shadow-sm space-y-3" />
    </div>
  );
}
