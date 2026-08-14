'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Mail } from 'lucide-react';

function AccountBannedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 text-red-400 rounded-3xl flex items-center justify-center mx-auto shadow-xl text-3xl">
          🚫
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl">
          Tài khoản của bạn đã bị khóa
        </h1>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          Tài khoản của bạn đã bị tạm dừng hoặc khóa truy cập do vi phạm quy định sử dụng hoặc theo chỉ thị của Quản trị viên.
        </p>
      </div>

      {/* Hiển thị Lý do bị khóa (nếu có) */}
      {reason && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl space-y-1 text-left">
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Lý do khóa tài khoản:</span>
          </div>
          <p className="text-xs text-slate-300 italic pl-6 leading-relaxed">
            "{decodeURIComponent(reason)}"
          </p>
        </div>
      )}

      {/* Thông tin liên hệ hỗ trợ */}
      <div className="p-4 bg-slate-900/60 border border-slate-700/60 rounded-2xl space-y-2 text-xs text-slate-400 text-left">
        <p className="font-semibold text-slate-300 flex items-center gap-2">
          <Mail className="w-4 h-4 text-blue-400" />
          <span>Cần hỗ trợ hoặc khiếu nại?</span>
        </p>
        <p className="leading-relaxed">
          Nếu bạn cho rằng đây là sự nhầm lẫn, vui lòng liên hệ với bộ phận hỗ trợ của DailyE qua email:{' '}
          <a
            href="mailto:support@dailye.com"
            className="text-blue-400 font-semibold hover:underline"
          >
            support@dailye.com
          </a>
        </p>
      </div>

      {/* Nút quay về trang Login */}
      <div className="pt-2">
        <Link
          href="/login"
          className="w-full py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 border border-slate-600 shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang Đăng nhập</span>
        </Link>
      </div>
    </div>
  );
}

export default function AccountBannedPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-4 relative overflow-hidden">
      <main className="max-w-md w-full mx-auto bg-slate-800/90 border border-slate-700 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto">
        <Suspense
          fallback={
            <div className="py-12 text-center text-xs text-slate-400">
              Đang tải thông tin...
            </div>
          }
        >
          <AccountBannedContent />
        </Suspense>
      </main>

      <footer className="max-w-md mx-auto w-full text-center text-xs text-slate-500 pb-4">
        DailyE • Kiểm soát an toàn & bảo mật tài khoản
      </footer>
    </div>
  );
}
