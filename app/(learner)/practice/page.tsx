import React from 'react';
import { FileSpreadsheet, Layers } from 'lucide-react';

// Tab 3: Màn hình "Luyện" - Luyện đề Part 1-7 và sổ lỗi sai
export default function PracticePage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Luyện đề TOEIC</h1>
          <p className="text-sm text-slate-500">Luyện tập theo từng Part & Sổ lỗi sai</p>
        </div>
        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
      </header>

      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
        <div>
          <h3 className="font-bold text-emerald-900">Sổ lỗi sai của bạn</h3>
          <p className="text-xs text-emerald-700 mt-1">Ôn lại các câu trả lời sai bằng phương pháp SRS</p>
        </div>
        <button className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition">
          Ôn tập ngay
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
          <Layers className="w-4 h-4 text-slate-500" /> Các Part luyện đề
        </h3>
        
        {['Part 5: Điền câu', 'Part 6: Điền đoạn văn', 'Part 7: Đọc hiểu'].map((partTitle, idx) => (
          <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
            <span className="font-medium text-slate-800 text-sm">{partTitle}</span>
            <span className="text-xs text-blue-600 font-semibold">Bắt đầu</span>
          </div>
        ))}
      </div>
    </div>
  );
}
