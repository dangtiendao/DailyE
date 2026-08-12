import React from 'react';

// Skeleton Loading cho trang Admin Import dữ liệu (/admin/import)
export default function AdminImportLoading() {
  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 space-y-6 max-w-5xl mx-auto animate-pulse">
      {/* Header */}
      <header className="space-y-2">
        <div className="h-7 w-64 bg-slate-200 rounded-xl" />
        <div className="h-4 w-96 bg-slate-200 rounded-lg" />
      </header>

      {/* 4 Cards Chức năng Import Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 bg-white border border-slate-200 rounded-2xl h-32 shadow-sm space-y-2">
            <div className="h-5 w-32 bg-slate-200 rounded" />
            <div className="h-3 w-full bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Upload Drag & Drop Area Skeleton */}
      <div className="p-8 bg-white border-2 border-dashed border-slate-300 rounded-3xl h-64 shadow-sm flex flex-col items-center justify-center space-y-4" />
    </div>
  );
}
