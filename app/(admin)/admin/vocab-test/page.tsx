'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { VocabQuizEngine } from '@/components/vocab/VocabQuizEngine';
import { GenerateVocabQuizParams } from '@/app/actions/vocab';
import { Sparkles, Play, Settings, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function AdminVocabTestPage() {
  const [params, setParams] = useState<GenerateVocabQuizParams>({
    mode: 'mixed',
    source: 'mixed',
    count: 10,
    topic: 'all',
    level: 'all',
  });

  const [activeParams, setActiveParams] = useState<GenerateVocabQuizParams | null>(null);

  const handleStartTest = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveParams({ ...params });
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/dashboard"
              className="p-1.5 bg-white hover:bg-slate-200 text-slate-600 rounded-lg transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Kiểm thử Vocab Quiz Engine</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Công cụ dành cho Admin xem trước & thử nghiệm các dạng bài tập từ vựng</p>
        </div>
      </header>

      {/* Form cấu hình chạy thử */}
      <form
        onSubmit={handleStartTest}
        className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4 max-w-lg mx-auto"
      >
        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm border-b pb-2">
          <Settings className="w-4 h-4 text-blue-600" />
          <span>Cấu hình Tham số Phiên học</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Mode */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Dạng bài tập (Mode)</label>
            <select
              value={params.mode}
              onChange={(e) => setParams({ ...params, mode: e.target.value as any })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="mixed">🔀 Hỗn hợp (Mixed)</option>
              <option value="mcq_en_vi">🇬🇧 Trắc nghiệm Anh → Việt</option>
              <option value="mcq_vi_en">🇻🇳 Trắc nghiệm Việt → Anh</option>
              <option value="matching">🧩 Ghép cặp (Matching)</option>
            </select>
          </div>

          {/* Source */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Nguồn từ vựng (Source)</label>
            <select
              value={params.source}
              onChange={(e) => setParams({ ...params, source: e.target.value as any })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="mixed">🌐 Hỗn hợp (Mixed)</option>
              <option value="new">✨ Từ chưa học (New)</option>
              <option value="weak">⚠️ Từ yếu (Weak)</option>
              <option value="due">⏰ Đến hạn ôn (SRS Due)</option>
            </select>
          </div>

          {/* Count */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Số lượng từ (Count)</label>
            <select
              value={params.count}
              onChange={(e) => setParams({ ...params, count: Number(e.target.value) })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10 từ</option>
              <option value={20}>20 từ</option>
              <option value={30}>30 từ</option>
            </select>
          </div>

          {/* Topic */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Chủ đề (Topic)</label>
            <select
              value={params.topic}
              onChange={(e) => setParams({ ...params, topic: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả chủ đề</option>
              <option value="office">🏢 Văn phòng</option>
              <option value="hr">👥 Nhân sự & Tuyển dụng</option>
              <option value="finance">💰 Tài chính & Ngân hàng</option>
              <option value="marketing">📣 Marketing & Bán hàng</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-md"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Khởi chạy VocabQuizEngine</span>
        </button>
      </form>

      {/* Hiển thị VocabQuizEngine Live */}
      {activeParams && (
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <div className="text-center space-y-1">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
              Engine đang chạy Live
            </span>
          </div>

          <VocabQuizEngine
            params={activeParams}
            onFinish={() => console.log('Phiên học đã hoàn thành!')}
          />
        </div>
      )}
    </div>
  );
}
