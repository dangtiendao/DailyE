import React from 'react';

// Skeleton Loading cho trang /learn/vocabulary - Bảng danh mục chủ đề
export default function VocabularyLoading() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-8 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-slate-200 rounded-xl" />
          <div className="h-4 w-48 bg-slate-200 rounded-lg" />
        </div>
        <div className="w-10 h-10 bg-amber-100 rounded-2xl" />
      </div>

      {/* Grid 6 Topic Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-5 bg-white border border-slate-200 rounded-3xl h-36 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-5 w-32 bg-slate-200 rounded" />
              <div className="h-4 w-12 bg-slate-100 rounded" />
            </div>
            <div className="h-3 w-full bg-slate-100 rounded" />
            <div className="w-full bg-slate-100 h-2 rounded-full mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
