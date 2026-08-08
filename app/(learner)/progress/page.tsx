import React from 'react';
import { BarChart2, Award, Flame } from 'lucide-react';

// Tab 4: Màn hình "Tiến độ" - Thống kê học tập và chuỗi ngày học
export default function ProgressPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tiến độ cá nhân</h1>
          <p className="text-sm text-slate-500">Thống kê điểm số & chuỗi ngày học</p>
        </div>
        <div className="p-2 bg-amber-100 text-amber-600 rounded-full">
          <BarChart2 className="w-6 h-6" />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-3">
          <Flame className="w-8 h-8 text-amber-500" />
          <div>
            <p className="text-xs text-slate-500">Chuỗi Streak</p>
            <p className="text-lg font-bold text-slate-900">3 ngày</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-3">
          <Award className="w-8 h-8 text-blue-500" />
          <div>
            <p className="text-xs text-slate-500">Dự đoán điểm</p>
            <p className="text-lg font-bold text-slate-900">650 TOEIC</p>
          </div>
        </div>
      </div>
    </div>
  );
}
