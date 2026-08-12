import React from 'react';

// Skeleton Loading cho trang Admin Taxonomy (/admin/taxonomy)
export default function AdminTaxonomyLoading() {
  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 space-y-6 max-w-5xl mx-auto animate-pulse">
      {/* Header */}
      <header className="space-y-2">
        <div className="h-7 w-64 bg-slate-200 rounded-xl" />
        <div className="h-4 w-96 bg-slate-200 rounded-lg" />
      </header>

      {/* Grid 2 Tab Cards (Topics & Levels) Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-white border border-slate-200 rounded-3xl h-96 shadow-sm space-y-4" />
        <div className="p-5 bg-white border border-slate-200 rounded-3xl h-96 shadow-sm space-y-4" />
      </div>
    </div>
  );
}
