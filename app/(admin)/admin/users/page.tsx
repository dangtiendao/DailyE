'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getUsersList } from '@/lib/admin/user-actions';
import { UserDetailDrawer } from '@/components/admin/user-detail-drawer';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  Mail,
  History,
  Layers,
  BookOpen,
  Upload,
  UserCheck,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Sinh gradient avatar ngẫu nhiên dựa trên ID
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

export default function AdminUsersPage() {
  // State Bộ lọc & Tìm kiếm
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [accessLevel, setAccessLevel] = useState<'all' | 'free' | 'premium' | 'admin'>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'banned'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'full_name'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // State Dữ liệu
  const [users, setUsers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentAdminId, setCurrentAdminId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected User cho Drawer
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Xử lý Debounce 300ms cho ô tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Lấy danh sách thành viên từ Server Action
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const res = await getUsersList({
      search: debouncedSearch,
      accessLevel,
      status,
      sortBy,
      sortOrder,
      page,
      pageSize: 20,
    });

    setIsLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Lỗi tải danh sách người dùng');
    } else {
      setUsers(res.users || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 1);
      if (res.currentAdminId) {
        setCurrentAdminId(res.currentAdminId);
      }
    }
  }, [debouncedSearch, accessLevel, status, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 space-y-6">
      {/* Header & Navigation Admin */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Quản lý thành viên</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Danh sách người dùng, phân quyền Admin/Premium & quản lý trạng thái tài khoản
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Dashboard
          </Link>
          <Link
            href="/admin/taxonomy"
            className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            <Layers className="w-4 h-4 text-purple-600" />
            Taxonomy
          </Link>
          <Link
            href="/admin/logs"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition"
          >
            <History className="w-4 h-4 text-indigo-400" />
            Nhật ký
          </Link>
          <Link
            href="/admin/content"
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            Nội dung
          </Link>
        </div>
      </header>

      {/* Toolbar: Tìm kiếm, Filter, Sort */}
      <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4 sm:space-y-0 sm:flex sm:items-center justify-between gap-4">
        {/* ô tìm kiếm */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email người dùng..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 transition placeholder:text-slate-400"
          />
        </div>

        {/* Filters & Sort Selects */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Role */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={accessLevel}
              onChange={(e) => {
                setAccessLevel(e.target.value as any);
                setPage(1);
              }}
              className="bg-transparent text-slate-700 font-semibold focus:outline-none"
            >
              <option value="all">Tất cả Quyền</option>
              <option value="free">Free Member</option>
              <option value="premium">Premium Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as any);
                setPage(1);
              }}
              className="bg-transparent text-slate-700 font-semibold focus:outline-none"
            >
              <option value="all">Tất cả Trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="banned">Đã bị khóa</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb as any);
                setSortOrder(so as any);
              }}
              className="bg-transparent text-slate-700 font-semibold focus:outline-none"
            >
              <option value="created_at-desc">Mới nhất trước</option>
              <option value="created_at-asc">Cũ nhất trước</option>
              <option value="full_name-asc">Tên A &rarr; Z</option>
              <option value="full_name-desc">Tên Z &rarr; A</option>
            </select>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-2xl">
          {errorMsg}
        </div>
      )}

      {/* Bảng danh sách thành viên */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Học viên</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Quyền hạn</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Ngày đăng ký</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Đang tải danh sách thành viên...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    Không tìm thấy thành viên nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === currentAdminId;
                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={cn(
                        "hover:bg-slate-50/80 transition cursor-pointer",
                        isSelf && "bg-blue-50/30"
                      )}
                    >
                      {/* Avatar + Tên */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-9 h-9 bg-gradient-to-tr text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm shrink-0",
                              getAvatarGradient(u.id)
                            )}
                          >
                            {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{u.full_name || 'Học viên DailyE'}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 bg-blue-600 text-white text-[10px] font-bold rounded">
                                  Bạn
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 sm:hidden">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {u.email}
                      </td>

                      {/* Access Level Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                            u.access_level === 'admin'
                              ? "bg-purple-100 text-purple-700"
                              : u.access_level === 'premium'
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                          )}
                        >
                          {u.access_level}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold",
                            u.status === 'banned'
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              u.status === 'banned' ? "bg-red-500" : "bg-emerald-500"
                            )}
                          />
                          {u.status === 'banned' ? 'Bị khóa' : 'Hoạt động'}
                        </span>
                      </td>

                      {/* Ngày đăng ký */}
                      <td className="py-3 px-4 text-slate-500 font-medium text-[11px]">
                        {new Date(u.created_at).toLocaleDateString('vi-VN')}
                      </td>

                      {/* Nút thao tác */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserId(u.id);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition text-[11px] inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang (Pagination) */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Hiển thị <strong>{users.length}</strong> / <strong>{totalCount}</strong> thành viên (Trang {page}/{totalPages})
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-slate-700">
              Trang {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Drawer Chi tiết & Quản trị User */}
      <UserDetailDrawer
        userId={selectedUserId}
        currentAdminId={currentAdminId}
        onClose={() => setSelectedUserId(null)}
        onRefreshList={fetchUsers}
      />
    </div>
  );
}
