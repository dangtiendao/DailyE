import React from 'react';
import Link from 'next/link';

// Trang Quản lý Nội dung Admin placeholder
export default function AdminContentPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý nội dung câu hỏi</h1>
          <p className="text-xs text-slate-500">Danh sách câu hỏi TOEIC (Part 5, 6, 7 & bài học)</p>
        </div>
        <Link
          href="/admin/import"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
        >
          + Import mới
        </Link>
      </header>

      <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-slate-500 text-sm">
        Chưa có câu hỏi nào. Hãy sử dụng tính năng Import Excel để thêm câu hỏi vào hệ thống.
      </div>
    </div>
  );
}
