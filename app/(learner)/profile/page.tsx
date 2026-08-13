'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useUserProfile } from '@/hooks/use-user-profile';
import { logout } from '@/app/actions/auth';
import { User, Settings, ShieldCheck, LogOut, Award, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tab 5: Màn hình "Cá nhân" - Hiển thị tên, email, mục tiêu điểm & Đăng xuất
export default function ProfilePage() {
  const { data: profile, isLoading } = useUserProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tài khoản</h1>
          <p className="text-sm text-slate-500">Quản lý thông tin cá nhân & cài đặt</p>
        </div>
        <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
          <User className="w-6 h-6" />
        </div>
      </header>

      {/* Thông tin hồ sơ học viên */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-3 py-4">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs text-slate-500">Đang tải thông tin hồ sơ...</span>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-black text-xl shadow-md">
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="space-y-1">
              <h2 className="font-bold text-slate-900 text-base">{profile?.fullName || 'Học viên DailyE'}</h2>
              <p className="text-xs text-slate-500">{profile?.email || 'N/A'}</p>
              <div className="flex items-center gap-2 pt-1">
                <span
                  className={cn(
                    "inline-block px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider",
                    profile?.accessLevel === 'admin'
                      ? "bg-purple-100 text-purple-700"
                      : profile?.accessLevel === 'premium'
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                  )}
                >
                  {profile?.accessLevel || 'free'}
                </span>
                
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  Mục tiêu: {profile?.targetScore || 500}+ TOEIC
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Menu cài đặt */}
      <div className="space-y-2">
        <Link
          href="/settings"
          className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-slate-800 font-semibold text-sm hover:bg-slate-50 transition cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>⚙️ Thiết lập tài khoản</span>
          </div>
          <span className="text-xs text-slate-400 font-normal">Sửa hồ sơ, mật khẩu & cài đặt &rarr;</span>
        </Link>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-slate-700 text-sm hover:bg-slate-50 transition cursor-pointer">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Mục tiêu điểm số TOEIC</span>
          </div>
          <span className="text-xs font-bold text-blue-600">{profile?.targetScore || 500}+ TOEIC</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center gap-3 text-slate-700 text-sm hover:bg-slate-50 transition cursor-pointer">
          <Settings className="w-5 h-5 text-slate-400" />
          <span>Cài đặt nhắc nhở học tập</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center gap-3 text-slate-700 text-sm hover:bg-slate-50 transition cursor-pointer">
          <ShieldCheck className="w-5 h-5 text-slate-400" />
          <span>Điều khoản & Chính sách quyền riêng tư</span>
        </div>

        {/* Nút đăng xuất */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full p-3.5 bg-red-50 hover:bg-red-100/80 border border-red-100 rounded-xl flex items-center justify-between text-red-600 text-sm transition font-medium disabled:opacity-50 mt-4"
        >
          <div className="flex items-center gap-3">
            {isLoggingOut ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
            <span>Đăng xuất tài khoản</span>
          </div>
        </button>
      </div>
    </div>
  );
}
