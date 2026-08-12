import React from 'react';

// Skeleton Loading cho trang /learn - Mô phỏng 100% layout thật
export default function LearnLoading() {
  return (
    <div className="space-y-6 pb-6 animate-pulse">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-slate-200 rounded-xl" />
          <div className="h-4 w-64 bg-slate-200 rounded-lg" />
        </div>
        <div className="w-10 h-10 bg-indigo-100 rounded-2xl" />
      </header>

      {/* Banner Học Từ vựng Active Recall */}
      <div className="bg-slate-200 rounded-3xl p-5 h-40 shadow-sm" />

      {/* Tiến độ học & Filter pills */}
      <div className="space-y-3">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl h-16 shadow-sm" />
        <div className="p-3 bg-white border border-slate-200 rounded-2xl flex gap-2 overflow-x-auto h-12" />
      </div>

      {/* Danh sách 3 Skill groups skeleton */}
      {[1, 2, 3].map((g) => (
        <div key={g} className="space-y-3">
          <div className="h-6 w-48 bg-slate-200 rounded-lg" />
          <div className="space-y-2.5">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 bg-white border border-slate-200 rounded-2xl h-20 shadow-sm flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-slate-200 rounded" />
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                </div>
                <div className="h-8 w-20 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
