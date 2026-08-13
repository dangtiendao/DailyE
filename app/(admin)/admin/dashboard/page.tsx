import React from 'react';
import Link from 'next/link';
import { getAdminDashboardStats, DashboardStatsResult } from '@/app/actions/admin';
import { getAdminActionLogs } from '@/lib/admin/bulk-actions';
import { LayoutDashboard, FileSpreadsheet, Upload, Users, BookOpen, Clock, ArrowRight, ShieldCheck, Sparkles, History, Layers } from 'lucide-react';

// Trang Admin Dashboard kết nối Server Action lấy thống kê thực tế & 5 nhật ký gần nhất
export default async function AdminDashboardPage() {
  let stats: DashboardStatsResult = {
    totalQuestions: 0,
    totalLessons: 0,
    totalUsers: 0,
    newUsers7Days: 0,
    bannedUsers: 0,
    latestImport: null,
  };
  let fetchError = null;
  let recentLogs: any[] = [];

  try {
    stats = await getAdminDashboardStats();
    const logsRes = await getAdminActionLogs({ limit: 5 });
    if (logsRes.success) {
      recentLogs = logsRes.logs;
    }
  } catch (err) {
    fetchError = (err as Error).message || 'Lỗi tải thống kê';
  }

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'bulk_delete':
        return <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">Bulk Delete</span>;
      case 'single_delete':
        return <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold text-[10px]">Delete</span>;
      case 'bulk_update_status':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">Bulk Status</span>;
      case 'single_update_status':
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">Status</span>;
      case 'bulk_update_field':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">Bulk Edit</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold text-[10px]">{actionType}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Tổng quan thống kê hệ thống & quản trị nội dung DailyE</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            <Users className="w-4 h-4 text-blue-600" />
            👥 Thành viên
          </Link>
          <Link
            href="/admin/taxonomy"
            className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            <Layers className="w-4 h-4 text-purple-600" />
            🏷️ Taxonomy
          </Link>
          <Link
            href="/admin/logs"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition"
          >
            <History className="w-4 h-4 text-indigo-400" />
            Lịch sử thao tác
          </Link>
          <Link
            href="/admin/vocab-test"
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Test Vocab Engine
          </Link>
          <Link
            href="/admin/content"
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            Quản lý nội dung
          </Link>
          <Link
            href="/admin/import"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition"
          >
            <Upload className="w-4 h-4" />
            Import Excel mới
          </Link>
        </div>
      </header>

      {fetchError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl">
          {fetchError}
        </div>
      )}

      {/* Grid Card Thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tổng câu hỏi</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.totalQuestions} câu</p>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tổng bài học</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.totalLessons} bài</p>
          </div>
        </div>

        <Link
          href="/admin/users"
          className="p-5 bg-white border border-slate-200 hover:border-blue-400 rounded-2xl shadow-sm flex items-center gap-4 transition cursor-pointer group"
        >
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-100 transition">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <span>Tổng thành viên</span>
              <span className="text-blue-600 font-bold group-hover:underline">&rarr;</span>
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.totalUsers} người</p>
            <p className="text-[10px] text-slate-400">
              +{stats.newUsers7Days || 0} mới (7 ngày) • {stats.bannedUsers || 0} bị khóa
            </p>
          </div>
        </Link>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Hệ thống</p>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">Hoạt động tốt</p>
          </div>
        </div>
      </div>

      {/* Grid 2 cột: Import gần nhất & Thao tác gần đây */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lượt Import gần nhất */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              <h2 className="font-bold text-slate-900 text-base">Lượt Import gần nhất</h2>
            </div>
            <Link href="/admin/import" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              <span>Tới trang Import</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats.latestImport ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-bold text-slate-800 text-sm">{stats.latestImport.filename}</p>
                <p className="text-xs text-slate-500">
                  Thời gian: {new Date(stats.latestImport.created_at).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">
                  Thành công: {stats.latestImport.success_rows} / {stats.latestImport.total_rows} dòng
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              Chưa có lượt import file Excel nào gần đây.
            </div>
          )}
        </section>

        {/* Thao tác gần đây (5 Logs mới nhất) */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-base">Thao tác Admin gần đây</h2>
            </div>
            <Link href="/admin/logs" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
              <span>Xem tất cả lịch sử</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentLogs && recentLogs.length > 0 ? (
            <div className="space-y-2.5">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      {getActionBadge(log.action_type)}
                      <span className="font-semibold capitalize text-slate-700">{log.content_type}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div className="text-right font-mono font-bold text-slate-800">
                    {Array.isArray(log.affected_ids) ? log.affected_ids.length : 0} mục
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              Chưa có nhật ký thao tác nào được ghi nhận.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
