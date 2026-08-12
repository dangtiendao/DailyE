import React from 'react';

// Skeleton Loading cho trang Admin Quản lý nội dung (/admin/content)
export default function AdminContentLoading() {
  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 space-y-6 max-w-6xl mx-auto animate-pulse">
      {/* Header Admin */}
      <header className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-slate-200 rounded-xl" />
          <div className="h-4 w-96 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-9 w-36 bg-blue-600/40 rounded-xl" />
      </header>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 gap-2 h-12 bg-white/50 rounded-t-xl" />

      {/* Filters Bar Skeleton */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl h-16 shadow-sm flex items-center gap-3" />

      {/* Table Skeleton (6 hàng) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="h-8 bg-slate-100 rounded-xl w-full" />
        {[1, 2, 3, 4, 5, 6].map((r) => (
          <div key={r} className="h-12 bg-slate-50 border border-slate-100 rounded-xl w-full" />
        ))}
      </div>
    </div>
  );
}
