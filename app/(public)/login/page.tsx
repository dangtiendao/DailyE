'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/lib/validators';
import { loginWithEmail, loginWithGoogle } from '@/app/actions/auth';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get('error');

  const [serverError, setServerError] = useState<string | null>(
    oauthError === 'oauth_failed' ? 'Đăng nhập Google thất bại. Vui lòng thử lại.' : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsSubmitting(true);
    setServerError(null);

    const result = await loginWithEmail(data);

    if (!result.success) {
      setServerError(result.error || 'Đăng nhập không thành công');
      setIsSubmitting(false);
    } else {
      router.push('/today');
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setServerError(null);
    const result = await loginWithGoogle();
    if (result && !result.success) {
      setServerError(result.error || 'Đăng nhập Google thất bại');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Báo lỗi Server */}
      {serverError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Google OAuth Login */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading || isSubmitting}
        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-2xl text-sm transition border border-slate-600 flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {isGoogleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>Đăng nhập bằng Google</span>
      </button>

      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-slate-700 w-full"></div>
        <span className="bg-slate-800 px-3 text-xs text-slate-500 font-medium uppercase">Hoặc</span>
        <div className="border-t border-slate-700 w-full"></div>
      </div>

      {/* Email & Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
          <input
            type="email"
            placeholder="example@gmail.com"
            {...register('email')}
            className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition placeholder:text-slate-500"
          />
          {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Mật khẩu</label>
          <input
            type="password"
            placeholder="••••••••"
            {...register('password')}
            className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition placeholder:text-slate-500"
          />
          {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isGoogleLoading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : (
            <span>Đăng nhập</span>
          )}
        </button>
      </form>
    </div>
  );
}

// Trang Đăng nhập bọc Suspense Boundary
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-4 relative overflow-hidden">
      {/* Header quay lại trang chủ */}
      <header className="max-w-md mx-auto w-full pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại trang chủ
        </Link>
      </header>

      {/* Main Card */}
      <main className="max-w-md w-full mx-auto bg-slate-800/80 border border-slate-700 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl text-white mx-auto shadow-lg shadow-blue-500/30">
            E
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Chào mừng trở lại!</h1>
          <p className="text-xs text-slate-400">Đăng nhập tài khoản DailyE để tiếp tục lộ trình TOEIC</p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        }>
          <LoginFormContent />
        </Suspense>

        <div className="text-center text-xs text-slate-400">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-blue-400 font-semibold hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </main>

      <footer className="max-w-md mx-auto w-full text-center text-xs text-slate-500 pb-4">
        DailyE • Học đúng lỗi sai, tiến bộ mỗi ngày
      </footer>
    </div>
  );
}
