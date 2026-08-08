'use client';

import React from 'react';
import Link from 'next/link';

// Trang Đăng nhập (Public - UI Placeholder cho Phase 1)
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Đăng nhập DailyE</h1>
          <p className="text-xs text-slate-500">Chức năng Auth sẽ được kết nối Supabase ở các phase sau</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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
            Đăng nhập
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-blue-600 font-semibold hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
