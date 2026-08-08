import React from 'react';
import { BookOpen, BookMarked, GraduationCap } from 'lucide-react';

// Tab 2: Màn hình "Học" - Học kiến thức từ vựng & ngữ pháp
export default function LearnPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Học kiến thức</h1>
          <p className="text-sm text-slate-500">Từ vựng & Ngữ pháp TOEIC trọng tâm</p>
        </div>
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full">
          <BookOpen className="w-6 h-6" />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-blue-300 transition cursor-pointer">
          <BookMarked className="w-8 h-8 text-blue-600 mb-2" />
          <h3 className="font-semibold text-slate-900">Từ vựng TOEIC</h3>
          <p className="text-xs text-slate-500 mt-1">600 từ vựng theo chủ đề xuất hiện nhiều nhất</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-blue-300 transition cursor-pointer">
          <GraduationCap className="w-8 h-8 text-indigo-600 mb-2" />
          <h3 className="font-semibold text-slate-900">Ngữ pháp cơ bản</h3>
          <p className="text-xs text-slate-500 mt-1">Chủ điểm ngữ pháp TOEIC Part 5, 6</p>
        </div>
      </div>
    </div>
  );
}
