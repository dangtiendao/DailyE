'use client';

import React from 'react';
import Link from 'next/link';

// Trang Đăng ký (Public - UI Placeholder cho Phase 1)
export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Đăng ký DailyE</h1>
          <p className="text-xs text-slate-500">Tạo tài khoản học TOEIC hoàn toàn miễn phí</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Họ và tên</label>
            <input
              type="text"
              placeholder="Nguyễn Văn A"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="example@gmail.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition"
          >
            Đăng ký tài khoản
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
