import React from 'react';

// Skeleton Loading cho trang /practice - Quản lý luyện đề TOEIC
export default function PracticeLoading() {
  return (
    <div className="space-y-6 pb-6 max-w-xl mx-auto animate-pulse">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded-xl" />
          <div className="h-4 w-64 bg-slate-200 rounded-lg" />
        </div>
        <div className="w-10 h-10 bg-emerald-100 rounded-2xl" />
      </header>

      {/* Mode Switcher Banner */}
      <div className="p-3 bg-white border border-slate-200 rounded-2xl h-14 flex items-center justify-between shadow-sm" />

      {/* Part Cards Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((p) => (
          <div key={p} className="p-5 bg-white border border-slate-200 rounded-3xl h-36 shadow-sm space-y-3">
            <div className="flex justify-between">
              <div className="h-5 w-36 bg-slate-200 rounded" />
              <div className="h-5 w-16 bg-emerald-100 rounded-full" />
            </div>
            <div className="h-3 w-4/5 bg-slate-100 rounded" />
            <div className="h-9 w-32 bg-emerald-600/30 rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
