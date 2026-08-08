import React from 'react';
import { User, Settings, ShieldCheck, LogOut } from 'lucide-react';

// Tab 5: Màn hình "Cá nhân" - Thông tin tài khoản & Cài đặt
export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tài khoản</h1>
          <p className="text-sm text-slate-500">Quản lý cá nhân & Cài đặt</p>
        </div>
        <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
          <User className="w-6 h-6" />
        </div>
      </header>

      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
          DE
        </div>
        <div>
          <h2 className="font-bold text-slate-900">Học viên DailyE</h2>
          <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold mt-1">
            Free Access
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3 text-slate-700 text-sm hover:bg-slate-50 cursor-pointer">
          <Settings className="w-5 h-5 text-slate-500" />
          <span>Cài đặt mục tiêu điểm số</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3 text-slate-700 text-sm hover:bg-slate-50 cursor-pointer">
          <ShieldCheck className="w-5 h-5 text-slate-500" />
          <span>Điều khoản & Chính sách</span>
        </div>
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm hover:bg-red-100/50 cursor-pointer">
          <LogOut className="w-5 h-5" />
          <span>Đăng xuất</span>
        </div>
      </div>
    </div>
  );
}
