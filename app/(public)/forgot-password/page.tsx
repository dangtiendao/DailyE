'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, ForgotPasswordInput } from '@/lib/validators';
import { sendForgotPasswordEmail } from '@/app/actions/auth';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsSubmitting(true);
    setSuccessMessage(null);

    const result = await sendForgotPasswordEmail(data);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage(result.message || 'Nếu địa chỉ email tồn tại, liên kết đã được gửi.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-4 relative overflow-hidden">
      <header className="max-w-md mx-auto w-full pt-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại đăng nhập
        </Link>
      </header>

      <main className="max-w-md w-full mx-auto bg-slate-800/80 border border-slate-700 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Quên mật khẩu?</h1>
          <p className="text-xs text-slate-400">
            Nhập địa chỉ email đăng ký để nhận liên kết khôi phục mật khẩu.
          </p>
        </div>

        {successMessage ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3 text-emerald-400">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">{successMessage}</p>
            </div>
            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="inline-block px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition"
              >
                Trở về trang Đăng nhập
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Địa chỉ Email đăng ký
              </label>
              <input
                type="email"
                placeholder="example@gmail.com"
                {...register('email')}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition placeholder:text-slate-500"
              />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi yêu cầu...</span>
                </>
              ) : (
                <span>Gửi liên kết khôi phục</span>
              )}
            </button>
          </form>
        )}
      </main>

      <footer className="max-w-md mx-auto w-full text-center text-xs text-slate-500 pb-4">
        DailyE • Khôi phục quyền truy cập tài khoản
      </footer>
    </div>
  );
}
