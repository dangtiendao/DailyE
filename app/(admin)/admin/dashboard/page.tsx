import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, FileSpreadsheet, Upload, Users } from 'lucide-react';

// Trang Admin Dashboard placeholder
export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-xs text-slate-500">Quản trị hệ thống & nội dung DailyE</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/import"
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-4">
          <Users className="w-10 h-10 text-blue-600 bg-blue-50 p-2 rounded-xl" />
          <div>
            <p className="text-xs text-slate-500">Tổng người dùng</p>
            <p className="text-xl font-bold text-slate-900">1 (Admin)</p>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-4">
          <FileSpreadsheet className="w-10 h-10 text-indigo-600 bg-indigo-50 p-2 rounded-xl" />
          <div>
            <p className="text-xs text-slate-500">Tổng câu hỏi</p>
            <p className="text-xl font-bold text-slate-900">0 câu</p>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-4">
          <LayoutDashboard className="w-10 h-10 text-emerald-600 bg-emerald-50 p-2 rounded-xl" />
          <div>
            <p className="text-xs text-slate-500">Trạng thái hệ thống</p>
            <p className="text-xl font-bold text-emerald-600">Sẵn sàng</p>
          </div>
        </div>
      </div>
    </div>
  );
}
