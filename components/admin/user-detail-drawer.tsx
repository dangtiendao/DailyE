'use client';

import React, { useState, useEffect } from 'react';
import {
  getUserDetail,
  updateUserRole,
  banUser,
  unbanUser,
  deleteUserByAdmin,
  sendResetPasswordEmailByAdmin,
} from '@/lib/admin/user-actions';
import {
  X,
  User,
  Mail,
  Shield,
  Clock,
  Award,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Trash2,
  KeyRound,
  Loader2,
  Sparkles,
  Flame,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserDetailDrawerProps {
  userId: string | null;
  currentAdminId: string;
  onClose: () => void;
  onRefreshList: () => void;
}

// Gradient ngẫu nhiên ổn định theo userId
function getAvatarGradient(id: string = '') {
  const gradients = [
    'from-blue-600 to-indigo-600',
    'from-emerald-600 to-teal-600',
    'from-purple-600 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-rose-600 to-red-600',
    'from-cyan-600 to-blue-600',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

export function UserDetailDrawer({
  userId,
  currentAdminId,
  onClose,
  onRefreshList,
}: UserDetailDrawerProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form State cho các hành động
  const [selectedRole, setSelectedRole] = useState<'free' | 'premium' | 'admin'>('free');
  const [roleConfirmEmail, setRoleConfirmEmail] = useState('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Ban / Unban State
  const [banReason, setBanReason] = useState('');
  const [showBanModal, setShowBanModal] = useState(false);
  const [isBanning, setIsBanning] = useState(false);
  const [isUnbanning, setIsUnbanning] = useState(false);

  // Delete User State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset Password State
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Alert / Toast
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadUserDetail = async (id: string) => {
    setIsLoading(true);
    setFetchError(null);
    const res = await getUserDetail(id);
    setIsLoading(false);

    if (!res.success) {
      setFetchError(res.error || 'Lỗi lấy thông tin chi tiết người dùng');
    } else {
      setData(res);
      setSelectedRole(res.profile.access_level || 'free');
    }
  };

  useEffect(() => {
    if (userId) {
      loadUserDetail(userId);
    } else {
      setData(null);
    }
  }, [userId]);

  if (!userId) return null;

  const profile = data?.profile;
  const stats = data?.stats;
  const isSelf = userId === currentAdminId;

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setActionNotice({ type, message });
    setTimeout(() => setActionNotice(null), 5000);
  };

  // 1. Xử lý Đổi Role
  const handleRoleChange = async () => {
    if (!profile) return;
    setIsUpdatingRole(true);
    const res = await updateUserRole({
      userId,
      newRole: selectedRole,
      confirmEmail: roleConfirmEmail,
    });
    setIsUpdatingRole(false);

    if (!res.success) {
      showFeedback('error', res.error || 'Cập nhật quyền thất bại');
    } else {
      showFeedback('success', `Đã cập nhật quyền thành ${selectedRole.toUpperCase()}`);
      setRoleConfirmEmail('');
      loadUserDetail(userId);
      onRefreshList();
    }
  };

  // 2. Xử lý Khóa Tài Khoản (Ban)
  const handleExecuteBan = async () => {
    if (!profile || banReason.trim().length < 10) return;
    setIsBanning(true);
    const res = await banUser({ userId, reason: banReason.trim() });
    setIsBanning(false);

    if (!res.success) {
      showFeedback('error', res.error || 'Khóa tài khoản thất bại');
    } else {
      showFeedback('success', 'Đã khóa tài khoản thành công!');
      setShowBanModal(false);
      setBanReason('');
      loadUserDetail(userId);
      onRefreshList();
    }
  };

  // 3. Xử lý Mở Khóa Tài Khoản (Unban)
  const handleExecuteUnban = async () => {
    if (!profile) return;
    setIsUnbanning(true);
    const res = await unbanUser({ userId });
    setIsUnbanning(false);

    if (!res.success) {
      showFeedback('error', res.error || 'Mở khóa tài khoản thất bại');
    } else {
      showFeedback('success', 'Đã mở khóa tài khoản thành công!');
      loadUserDetail(userId);
      onRefreshList();
    }
  };

  // 4. Xử lý Gửi Email Reset Mật Khẩu Hộ
  const handleSendResetEmail = async () => {
    if (!profile) return;
    setIsSendingReset(true);
    const res = await sendResetPasswordEmailByAdmin(userId);
    setIsSendingReset(false);

    if (!res.success) {
      showFeedback('error', res.error || 'Gửi email reset mật khẩu thất bại');
    } else {
      showFeedback('success', res.message || 'Đã gửi email reset mật khẩu thành công!');
    }
  };

  // 5. Xử lý Xóa Tài Khoản
  const handleExecuteDelete = async () => {
    if (!profile) return;
    setIsDeleting(true);
    const res = await deleteUserByAdmin({ userId, confirmEmail: deleteConfirmEmail });
    setIsDeleting(false);

    if (!res.success) {
      showFeedback('error', res.error || 'Xóa tài khoản thất bại');
    } else {
      showFeedback('success', 'Đã xóa tài khoản thành công!');
      setShowDeleteModal(false);
      onRefreshList();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Chi tiết tài khoản</h2>
              <p className="text-xs text-slate-500">Xem thống kê học tập & quản trị quyền hạn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-6 space-y-6 flex-1">

          {actionNotice && (
            <div
              className={cn(
                "p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in",
                actionNotice.type === 'success'
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-800 border-red-200"
              )}
            >
              {actionNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="leading-relaxed">{actionNotice.message}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-xs">Đang tải dữ liệu hồ sơ...</span>
            </div>
          ) : fetchError ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-2xl">
              {fetchError}
            </div>
          ) : profile ? (
            <>
              {/* KHỐI 1: TỔNG QUAN USER */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div
                    className={cn(
                      "w-16 h-16 bg-gradient-to-tr text-white rounded-full flex items-center justify-center font-black text-2xl shadow-md shrink-0",
                      getAvatarGradient(profile.id)
                    )}
                  >
                    {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h3 className="font-bold text-slate-900 text-base">{profile.full_name}</h3>
                      {isSelf && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                          Bạn (Admin)
                        </span>
                      )}
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                          profile.access_level === 'admin'
                            ? "bg-purple-100 text-purple-700"
                            : profile.access_level === 'premium'
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-200 text-slate-700"
                        )}
                      >
                        {profile.access_level}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1",
                          profile.status === 'banned'
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            profile.status === 'banned' ? "bg-red-500" : "bg-emerald-500"
                          )}
                        />
                        {profile.status === 'banned' ? 'Đã bị khóa' : 'Hoạt động'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{profile.email}</span>
                    </p>
                  </div>
                </div>

                {profile.status === 'banned' && profile.banned_reason && (
                  <div className="p-3 bg-red-100/60 border border-red-200 rounded-2xl text-xs text-red-800 space-y-0.5">
                    <p className="font-bold">Lý do bị khóa:</p>
                    <p className="italic">{profile.banned_reason}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-center">
                  <div className="p-2 bg-white rounded-xl border border-slate-200/80">
                    <p className="text-[10px] text-slate-400">Đăng ký</p>
                    <p className="text-xs font-bold text-slate-800">
                      {new Date(profile.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200/80">
                    <p className="text-[10px] text-slate-400">Đăng nhập qua</p>
                    <p className="text-xs font-bold text-slate-800 capitalize">{profile.provider}</p>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200/80">
                    <p className="text-[10px] text-slate-400">Mục tiêu điểm</p>
                    <p className="text-xs font-bold text-blue-600">{profile.target_score || 500}+ TOEIC</p>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200/80">
                    <p className="text-[10px] text-slate-400">Streak</p>
                    <p className="text-xs font-bold text-amber-600 flex items-center justify-center gap-0.5">
                      <Flame className="w-3.5 h-3.5 fill-amber-500" />
                      {profile.streak_count || 0} ngày
                    </p>
                  </div>
                </div>
              </div>

              {/* KHỐI 2: THỐNG KÊ HỌC TẬP */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Thống kê hoạt động học tập</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl">
                    <p className="text-[11px] text-blue-700 font-medium">Lượt làm đề thi</p>
                    <p className="text-xl font-black text-blue-900">{stats?.totalAttempts || 0}</p>
                    <p className="text-[10px] text-blue-600">{stats?.totalQuestionsAnswered || 0} câu đã trả lời</p>
                  </div>

                  <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-2xl">
                    <p className="text-[11px] text-purple-700 font-medium">Điểm trung bình</p>
                    <p className="text-xl font-black text-purple-900">{stats?.averageScore || 0}</p>
                    <p className="text-[10px] text-purple-600">Trần điểm làm bài</p>
                  </div>

                  <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl col-span-2 sm:col-span-1">
                    <p className="text-[11px] text-emerald-700 font-medium">Từ vựng đã học</p>
                    <p className="text-xl font-black text-emerald-900">{stats?.totalVocabCount || 0}</p>
                    <p className="text-[10px] text-emerald-600">
                      {stats?.vocabMastered || 0} đã thuộc • {stats?.vocabLearning || 0} đang ôn
                    </p>
                  </div>
                </div>
              </div>

              {/* KHỐI 3: QUẢN TRỊ QUYỀN HẠN & HÀNH ĐỘNG */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span>Hành động quản trị (Admin Only)</span>
                </h4>

                {isSelf ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl leading-relaxed">
                    <strong>Lưu ý:</strong> Đây là tài khoản Admin của chính bạn. Các nút thay đổi quyền, khóa hoặc xóa tài khoản bị ẩn để ngăn vô tình tự tước quyền truy cập.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* A. ĐỔI ROLE */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <label className="block text-xs font-bold text-slate-800">
                        Cấp quyền truy cập (Access Level)
                      </label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value as any)}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                        >
                          <option value="free">Free Member</option>
                          <option value="premium">Premium Member</option>
                          <option value="admin">Administrator (Admin)</option>
                        </select>

                        {selectedRole === 'admin' && profile.access_level !== 'admin' && (
                          <input
                            type="email"
                            placeholder="Gõ email user để nâng Admin"
                            value={roleConfirmEmail}
                            onChange={(e) => setRoleConfirmEmail(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-600"
                          />
                        )}

                        <button
                          type="button"
                          disabled={
                            isUpdatingRole ||
                            selectedRole === profile.access_level ||
                            (selectedRole === 'admin' && !roleConfirmEmail)
                          }
                          onClick={handleRoleChange}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                        >
                          {isUpdatingRole ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Lưu role'}
                        </button>
                      </div>
                    </div>

                    {/* B. KHÓA / MỞ KHÓA TÀI KHOẢN */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      {profile.status === 'banned' ? (
                        <button
                          type="button"
                          disabled={isUnbanning}
                          onClick={handleExecuteUnban}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                        >
                          {isUnbanning ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Unlock className="w-4 h-4" />
                              <span>Mở khóa tài khoản</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowBanModal(true)}
                          className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-md shadow-amber-600/20"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Khóa tài khoản (Ban)</span>
                        </button>
                      )}

                      {/* C. GỬI EMAIL RESET MẬT KHẨU */}
                      <button
                        type="button"
                        disabled={isSendingReset || profile.provider === 'google'}
                        onClick={handleSendResetEmail}
                        title={profile.provider === 'google' ? 'Tài khoản Google không hỗ trợ reset mật khẩu' : ''}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 disabled:opacity-40"
                      >
                        {isSendingReset ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4 text-amber-400" />
                            <span>Gửi mail reset mật khẩu</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* D. XÓA TÀI KHOẢN VĨNH VIỄN */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                        <span>Xóa vĩnh viễn tài khoản người dùng này</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DIALOG CONFIRM: KHÓA TÀI KHOẢN (BAN USER) */}
      {/* ========================================================================= */}
      {showBanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-amber-800 flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-600" />
                Xác nhận Khóa Tài Khoản
              </h3>
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tài khoản của <strong className="text-slate-900">{profile?.email}</strong> sẽ bị vô hiệu hóa 2 lớp (DB Status + Supabase Auth Ban) và tự động bị đá khỏi ứng dụng.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Lý do khóa tài khoản (Bắt buộc, tối thiểu 10 ký tự):
              </label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Vi phạm quy định sử dụng, gian lận làm bài thi..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-amber-600 transition"
              />
              {banReason.length > 0 && banReason.length < 10 && (
                <p className="text-[11px] text-amber-600">Còn thiếu {10 - banReason.length} ký tự nữa</p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason('');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={banReason.trim().length < 10 || isBanning}
                onClick={handleExecuteBan}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-md shadow-amber-600/20"
              >
                {isBanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Đồng ý Khóa</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG CONFIRM 2 LỚP: ADMIN XÓA USER */}
      {/* ========================================================================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 border border-red-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-red-100 pb-3">
              <h3 className="font-bold text-base text-red-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                Xác nhận Xóa Người Dùng
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmEmail('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-1">
              <p className="font-bold">CẢNH BÁO XÓA CỨNG!</p>
              <p className="leading-relaxed">
                Tài khoản <strong className="underline">{profile?.email}</strong> và toàn bộ dữ liệu làm bài thi, từ vựng sẽ bị xóa vĩnh viễn khỏi hệ thống.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Gõ chính xác email <span className="font-bold text-slate-900">{profile?.email}</span> để xác nhận:
              </label>
              <input
                type="email"
                placeholder={profile?.email}
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 transition"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmEmail('');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={
                  !profile?.email ||
                  deleteConfirmEmail.trim().toLowerCase() !== profile.email.toLowerCase() ||
                  isDeleting
                }
                onClick={handleExecuteDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-lg shadow-red-600/30"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Xóa vĩnh viễn</span>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
