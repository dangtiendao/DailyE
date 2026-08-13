'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUserProfile } from '@/hooks/use-user-profile';
import {
  updateUserProfile,
  updateDailyGoalMinutes,
  updateTargetScore,
  changePassword,
  resetMyProgressAction,
  deleteAccountAction,
} from '@/app/actions/auth';
import {
  updateProfileSchema,
  changePasswordSchema,
  UpdateProfileInput,
  ChangePasswordInput,
} from '@/lib/validators';
import { TargetScoreSelector } from '@/components/shared/target-score-selector';
import {
  ArrowLeft,
  User,
  Target,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Lock,
  Mail,
  Clock,
  RotateCcw,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Danh sách tùy chọn thời gian học hàng ngày (phút)
const DAILY_GOAL_OPTIONS = [
  { minutes: 5, label: '5 phút', desc: 'Nhẹ nhàng - 1 bài từ vựng' },
  { minutes: 10, label: '10 phút', desc: 'Vừa sức - Tốt cho thói quen' },
  { minutes: 15, label: '15 phút', desc: 'Tiêu chuẩn (Khuyên dùng)' },
  { minutes: 30, label: '30 phút', desc: 'Nâng cao - Bài thi mini' },
  { minutes: 60, label: '60 phút', desc: 'Cấp tốc - Học chuyên sâu' },
];

// Hàm sinh gradient màu nền ổn định dựa trên user_id (media-light strategy)
function getAvatarGradient(userId: string = '') {
  const gradients = [
    'from-blue-600 to-indigo-600',
    'from-emerald-600 to-teal-600',
    'from-purple-600 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-rose-600 to-red-600',
    'from-cyan-600 to-blue-600',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useUserProfile();

  // Toast / Notification State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ---------------------------------------------------------------------------
  // SECTION 1: CẬP NHẬT HỒ SƠ CÁ NHÂN (FULL NAME)
  // ---------------------------------------------------------------------------
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: '',
    },
  });

  useEffect(() => {
    if (profile?.fullName) {
      profileForm.reset({ fullName: profile.fullName });
    }
  }, [profile?.fullName, profileForm]);

  const onUpdateProfileSubmit = async (data: UpdateProfileInput) => {
    setIsUpdatingProfile(true);
    const result = await updateUserProfile(data);
    setIsUpdatingProfile(false);

    if (!result.success) {
      showToast('error', result.error || 'Cập nhật tên thất bại');
    } else {
      showToast('success', 'Cập nhật họ và tên thành công!');
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }
  };

  // ---------------------------------------------------------------------------
  // SECTION 2: CẬP NHẬT MỤC TIÊU HỌC TẬP (TARGET SCORE & DAILY GOAL)
  // ---------------------------------------------------------------------------
  const [isUpdatingScore, setIsUpdatingScore] = useState(false);
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false);

  const handleSelectScore = async (score: number) => {
    if (score === profile?.targetScore) return;
    setIsUpdatingScore(true);
    const result = await updateTargetScore(score);
    setIsUpdatingScore(false);

    if (!result.success) {
      showToast('error', result.error || 'Cập nhật mục tiêu điểm thất bại');
    } else {
      showToast('success', `Đã đổi mục tiêu điểm thành ${score}+ TOEIC!`);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['todayLearnings'] });
    }
  };

  const handleSelectDailyGoal = async (minutes: number) => {
    if (minutes === profile?.dailyGoalMinutes) return;
    setIsUpdatingGoal(true);
    const result = await updateDailyGoalMinutes(minutes);
    setIsUpdatingGoal(false);

    if (!result.success) {
      showToast('error', result.error || 'Cập nhật thời gian học thất bại');
    } else {
      showToast('success', `Đã cập nhật mục tiêu học ${minutes} phút/ngày!`);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }
  };

  // ---------------------------------------------------------------------------
  // SECTION 3: BẢO MẬT & ĐỔI MẬT KHẨU
  // ---------------------------------------------------------------------------
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onChangePasswordSubmit = async (data: ChangePasswordInput) => {
    setIsChangingPassword(true);
    const result = await changePassword(data);
    setIsChangingPassword(false);

    if (!result.success) {
      showToast('error', result.error || 'Đổi mật khẩu thất bại');
    } else {
      showToast('success', 'Đổi mật khẩu thành công!');
      passwordForm.reset({ newPassword: '', confirmPassword: '' });
    }
  };

  // ---------------------------------------------------------------------------
  // SECTION 4: VÙNG NGUY HIỂM (RESET PROGRESS & DELETE ACCOUNT)
  // ---------------------------------------------------------------------------
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

  // Xử lý Reset Tiến Độ Học
  const handleExecuteResetProgress = async () => {
    if (resetConfirmInput !== 'RESET') return;
    setIsResetting(true);
    const result = await resetMyProgressAction();
    setIsResetting(false);

    if (!result.success) {
      showToast('error', result.error || 'Reset tiến độ thất bại');
    } else {
      showToast('success', 'Đã dọn dẹp toàn bộ dữ liệu học tập thành công!');
      setShowResetModal(false);
      setResetConfirmInput('');
      // Invalidate toàn bộ cache React Query học tập
      queryClient.invalidateQueries();
    }
  };

  // Xử lý Xóa Tài Khoản Vĩnh Viễn
  const handleExecuteDeleteAccount = async () => {
    if (!profile?.email || deleteConfirmInput.trim().toLowerCase() !== profile.email.toLowerCase()) {
      return;
    }
    setIsDeleting(true);
    setDeleteErrorMsg(null);

    const result = await deleteAccountAction({ confirmEmail: deleteConfirmInput.trim() });
    setIsDeleting(false);

    if (!result.success) {
      setDeleteErrorMsg(result.error || 'Xóa tài khoản thất bại');
    } else {
      // Đã xóa thành công -> Redirect về login
      router.push('/login?notice=account_deleted');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-sm font-medium">Đang tải thiết lập tài khoản...</span>
        </div>
      </div>
    );
  }

  const avatarGradient = getAvatarGradient(profile?.id);

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      {/* Toast thông báo floating */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div
            className={cn(
              "px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-semibold max-w-md",
              toastMessage.type === 'success'
                ? "bg-emerald-600 text-white border-emerald-500"
                : "bg-red-600 text-white border-red-500"
            )}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header điều hướng */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Thiết lập tài khoản</h1>
            <p className="text-xs text-slate-500">Quản lý thông tin cá nhân, mục tiêu & bảo mật</p>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* SECTION 1: HỒ SƠ CÁ NHÂN */}
      {/* ========================================================================= */}
      <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
          <User className="w-5 h-5 text-blue-600" />
          <span>Hồ sơ cá nhân</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Avatar dạng chữ cái đầu + gradient ổn định */}
          <div
            className={cn(
              "w-20 h-20 bg-gradient-to-tr text-white rounded-full flex items-center justify-center font-black text-3xl shadow-lg shrink-0",
              avatarGradient
            )}
          >
            {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="font-bold text-slate-900 text-lg">{profile?.fullName}</h2>
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider",
                  profile?.accessLevel === 'admin'
                    ? "bg-purple-100 text-purple-700"
                    : profile?.accessLevel === 'premium'
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                )}
              >
                {profile?.accessLevel || 'free'}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1">
              <Mail className="w-3.5 h-3.5" />
              <span>{profile?.email || 'N/A'}</span>
            </p>
          </div>
        </div>

        {/* Form sửa tên */}
        <form onSubmit={profileForm.handleSubmit(onUpdateProfileSubmit)} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Họ và tên học viên
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                {...profileForm.register('fullName')}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-600 transition"
              />
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl transition disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow-md shadow-blue-600/20"
              >
                {isUpdatingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Lưu đổi tên</span>
                )}
              </button>
            </div>
            {profileForm.formState.errors.fullName && (
              <p className="text-xs text-red-500 mt-1">
                {profileForm.formState.errors.fullName.message}
              </p>
            )}
          </div>

          {/* Hiển thị Email (Readonly) & Provider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Địa chỉ Email (Cố định)
              </label>
              <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium flex items-center justify-between">
                <span>{profile?.email}</span>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Phương thức đăng nhập
              </label>
              <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold flex items-center gap-2">
                {profile?.provider === 'google' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>Tài khoản Google</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Email & Mật khẩu</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: MỤC TIÊU HỌC TẬP */}
      {/* ========================================================================= */}
      <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Target className="w-5 h-5 text-amber-500" />
            <span>Mục tiêu học tập</span>
          </div>
          {(isUpdatingScore || isUpdatingGoal) && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang lưu...</span>
            </div>
          )}
        </div>

        {/* Component Đổi Target Score (Tái sử dụng từ Onboarding) */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Mục tiêu điểm số TOEIC hướng tới
          </label>
          <TargetScoreSelector
            selectedScore={profile?.targetScore || 500}
            onSelectScore={handleSelectScore}
            disabled={isUpdatingScore}
          />
        </div>

        {/* Chọn Daily Goal Minutes */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Thời gian học mỗi ngày</span>
            </label>
            <span className="text-xs font-bold text-blue-600">
              {profile?.dailyGoalMinutes || 15} phút / ngày
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DAILY_GOAL_OPTIONS.map((option) => {
              const isSelected = profile?.dailyGoalMinutes === option.minutes;
              return (
                <button
                  key={option.minutes}
                  type="button"
                  disabled={isUpdatingGoal}
                  onClick={() => handleSelectDailyGoal(option.minutes)}
                  className={cn(
                    "p-3 rounded-2xl border text-left transition flex items-center justify-between",
                    isSelected
                      ? "border-blue-600 bg-blue-50/60 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  )}
                >
                  <div>
                    <p className={cn("text-xs font-bold", isSelected ? "text-blue-900" : "text-slate-800")}>
                      {option.label}
                    </p>
                    <p className="text-[11px] text-slate-500">{option.desc}</p>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: BẢO MẬT & ĐỔI MẬT KHẨU */}
      {/* ========================================================================= */}
      <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Bảo mật tài khoản</span>
        </div>

        {profile?.provider === 'google' ? (
          /* Người dùng đăng nhập qua Google */
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800">
                Tài khoản đăng nhập qua Google
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mật khẩu và thông tin xác thực của bạn được bảo mật trực tiếp bởi Google.
                Vui lòng quản lý mật khẩu tại trang cài đặt tài khoản Google của bạn.
              </p>
            </div>
          </div>
        ) : (
          /* Người dùng đăng nhập bằng Email & Password */
          <form onSubmit={passwordForm.handleSubmit(onChangePasswordSubmit)} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu mới (Tối thiểu 8 ký tự)
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...passwordForm.register('newPassword')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-600 transition"
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...passwordForm.register('confirmPassword')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-600 transition"
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang đổi mật khẩu...</span>
                </>
              ) : (
                <span>Lưu mật khẩu mới</span>
              )}
            </button>
          </form>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: VÙNG NGUY HIỂM (DANGER ZONE) */}
      {/* ========================================================================= */}
      <div className="p-6 bg-red-50/40 border border-red-200 rounded-3xl space-y-6">
        <div className="flex items-center gap-2 text-red-700 font-bold text-base border-b border-red-200/60 pb-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span>Vùng nguy hiểm</span>
        </div>

        <div className="space-y-4">
          {/* Action 1: Reset tiến độ học */}
          <div className="p-4 bg-white border border-red-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>Reset tiến độ học tập</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Xóa toàn bộ lịch sử làm bài thi, từ vựng đã thuộc, danh sách lỗi sai và tiến độ bài học. Chuỗi ngày học (streak) vẫn giữ nguyên.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-xs rounded-xl transition shrink-0 self-start sm:self-center"
            >
              Reset tiến độ
            </button>
          </div>

          {/* Action 2: Xóa tài khoản vĩnh viễn */}
          <div className="p-4 bg-white border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h3 className="font-bold text-sm text-red-600 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Xóa tài khoản vĩnh viễn</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu khỏi hệ thống. Thao tác này KHÔNG thể khôi phục.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDeleteErrorMsg(null);
                setShowDeleteModal(true);
              }}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-red-600/20 shrink-0 self-start sm:self-center"
            >
              Xóa tài khoản
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DIALOG CONFIRM 2 LỚP: RESET TIẾN ĐỘ HỌC */}
      {/* ========================================================================= */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-base text-amber-700 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                Xác nhận Reset Tiến Độ Học
              </h2>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmInput('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">
                Thao tác này sẽ xóa sạch các dữ liệu học tập sau:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-500">
                <li>Toàn bộ lịch sử các lần làm bài thi & luyện tập</li>
                <li>Chi tiết các câu trả lời & sổ lỗi sai (error logs)</li>
                <li>Tiến độ ghi nhớ từ vựng (user vocab progress) & phiên học</li>
                <li>Lịch ôn tập ngắt quãng SRS (review schedule)</li>
                <li>Tiến độ các bài học đã hoàn thành</li>
              </ul>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                <strong>Lưu ý:</strong> Thông tin hồ sơ cá nhân và Chuỗi ngày học (Streak) của bạn sẽ <u>KHÔNG</u> bị ảnh hưởng.
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Nhập chữ <span className="font-bold text-red-600">RESET</span> vào ô dưới đây để xác nhận:
              </label>
              <input
                type="text"
                placeholder="Gõ RESET"
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-600 transition"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmInput('');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={resetConfirmInput !== 'RESET' || isResetting}
                onClick={handleExecuteResetProgress}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                {isResetting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Đồng ý Reset</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG CONFIRM 2 LỚP: XÓA TÀI KHOẢN VĨNH VIỄN */}
      {/* ========================================================================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 border border-red-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-red-100 pb-3">
              <h2 className="font-bold text-base text-red-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                Xác nhận Xóa Tài Khoản Vĩnh Viễn
              </h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmInput('');
                  setDeleteErrorMsg(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {deleteErrorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200 leading-relaxed font-medium">
                {deleteErrorMsg}
              </div>
            )}

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-800 space-y-1">
                <p className="font-bold text-sm">CẢNH BÁO NGUY HIỂM!</p>
                <p className="leading-relaxed">
                  Tài khoản của bạn ({profile?.email}) sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu Supabase Auth cùng tất cả dữ liệu cá nhân. Bạn sẽ bị đăng xuất ngay lập tức.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Để xác nhận, vui lòng gõ chính xác email của bạn (<span className="font-bold text-slate-900">{profile?.email}</span>):
              </label>
              <input
                type="email"
                placeholder={profile?.email || 'Nhập email tài khoản'}
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:border-red-600 transition"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmInput('');
                  setDeleteErrorMsg(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={
                  !profile?.email ||
                  deleteConfirmInput.trim().toLowerCase() !== profile.email.toLowerCase() ||
                  isDeleting
                }
                onClick={handleExecuteDeleteAccount}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-lg shadow-red-600/30"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Xóa vĩnh viễn</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
