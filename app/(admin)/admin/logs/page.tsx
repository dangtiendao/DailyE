'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAdminActionLogs } from '@/lib/admin/bulk-actions';
import {
  History,
  ArrowLeft,
  Filter,
  Loader2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminActionLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    actionType: 'all',
    contentType: 'all',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal State
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminActionLogs({
        actionType: filters.actionType,
        contentType: filters.contentType,
        page,
        limit: 20,
      });

      if (res.success) {
        setLogs(res.logs);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.totalCount || 0);
      }
    } catch (err) {
      console.error('Lỗi tải nhật ký thao tác:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filters.actionType, filters.contentType, page]);

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'bulk_delete':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">🗑️ Xóa hàng loạt</span>;
      case 'single_delete':
        return <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold text-[10px]">❌ Xóa bản ghi</span>;
      case 'bulk_update_status':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">✅ Đổi trạng thái hàng loạt</span>;
      case 'single_update_status':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">⚡ Đổi trạng thái</span>;
      case 'bulk_update_field':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">✏️ Sửa trường hàng loạt</span>;
      case 'single_create':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px]">➕ Tạo mới</span>;
      case 'single_update':
        return <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full font-bold text-[10px]">📝 Cập nhật</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-[10px]">{actionType}</span>;
    }
  };

  const getContentBadge = (contentType: string) => {
    switch (contentType) {
      case 'questions':
        return <span className="font-semibold text-blue-600">Câu hỏi</span>;
      case 'lessons':
        return <span className="font-semibold text-indigo-600">Bài học</span>;
      case 'vocabulary':
        return <span className="font-semibold text-purple-600">Từ vựng</span>;
      default:
        return <span className="font-semibold text-slate-600">{contentType}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin/dashboard" className="text-xs text-slate-500 hover:underline inline-flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Về Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">Lịch sử thao tác Admin</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Nhật ký kiểm toán toàn bộ thao tác thêm, sửa, đổi trạng thái và xóa hàng loạt trên kho nội dung
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/content"
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            Tới Quản lý nội dung
          </Link>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Bộ lọc:</span>
          </div>

          <select
            value={filters.actionType}
            onChange={(e) => {
              setFilters({ ...filters, actionType: e.target.value });
              setPage(1);
            }}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
          >
            <option value="all">Tất cả Hành động</option>
            <option value="bulk_delete">🗑️ Bulk Delete (Xóa hàng loạt)</option>
            <option value="bulk_update_status">✅ Bulk Status (Đổi trạng thái hàng loạt)</option>
            <option value="bulk_update_field">✏️ Bulk Edit Field (Sửa trường hàng loạt)</option>
            <option value="single_delete">❌ Xóa bản ghi đơn lẻ</option>
            <option value="single_update_status">⚡ Đổi trạng thái đơn lẻ</option>
            <option value="single_create">➕ Tạo mới bản ghi</option>
            <option value="single_update">📝 Cập nhật bản ghi</option>
          </select>

          <select
            value={filters.contentType}
            onChange={(e) => {
              setFilters({ ...filters, contentType: e.target.value });
              setPage(1);
            }}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
          >
            <option value="all">Tất cả Loại nội dung</option>
            <option value="questions">Câu hỏi (Questions)</option>
            <option value="lessons">Bài học (Lessons)</option>
            <option value="vocabulary">Từ vựng (Vocabulary)</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Tổng cộng: <strong className="text-slate-900 font-bold">{totalCount}</strong> bản ghi nhật ký
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="p-12 bg-white border border-slate-200 rounded-3xl text-center space-y-3 shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Đang nạp nhật ký thao tác...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 bg-white border border-slate-200 rounded-3xl text-center text-slate-500 text-xs shadow-sm space-y-2">
          <History className="w-8 h-8 text-slate-300 mx-auto" />
          <p>Chưa có lịch sử thao tác nào khớp với bộ lọc.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="p-3.5">Thời gian</th>
                  <th className="p-3.5">Admin thực hiện</th>
                  <th className="p-3.5">Loại hành động</th>
                  <th className="p-3.5">Loại nội dung</th>
                  <th className="p-3.5 text-center">Số bản ghi ảnh hưởng</th>
                  <th className="p-3.5 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const affectedCount = Array.isArray(log.affected_ids) ? log.affected_ids.length : 0;
                  const adminName = log.profiles?.full_name || 'Admin DailyE';
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono text-[11px] text-slate-600">
                        {new Date(log.created_at).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">{adminName}</td>
                      <td className="p-3.5">{getActionBadge(log.action_type)}</td>
                      <td className="p-3.5">{getContentBadge(log.content_type)}</td>
                      <td className="p-3.5 text-center">
                        <span className="px-2.5 py-0.5 bg-slate-100 font-bold text-slate-800 rounded-full font-mono">
                          {affectedCount}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs inline-flex items-center gap-1 transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> Xem Payload
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>
                Trang <strong className="text-slate-900">{page}</strong> / {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL xem chi tiết Payload & Affected IDs */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Chi tiết thao tác nhật ký</h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 text-[11px] block">Thời gian thực hiện</span>
                <span className="font-bold font-mono">{new Date(selectedLog.created_at).toLocaleString('vi-VN')}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 text-[11px] block">Loại hành động & Nội dung</span>
                <div className="flex items-center gap-1.5">
                  {getActionBadge(selectedLog.action_type)}
                  {getContentBadge(selectedLog.content_type)}
                </div>
              </div>
            </div>

            {/* Affected IDs List */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Danh sách ID ảnh hưởng ({Array.isArray(selectedLog.affected_ids) ? selectedLog.affected_ids.length : 0}):
              </label>
              <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl text-xs font-mono max-h-32 overflow-y-auto space-y-1 border border-slate-800">
                {Array.isArray(selectedLog.affected_ids) && selectedLog.affected_ids.length > 0 ? (
                  selectedLog.affected_ids.map((id: any, i: number) => <div key={i}>• {String(id)}</div>)
                ) : (
                  <div className="text-slate-500 italic">Không có danh sách ID</div>
                )}
              </div>
            </div>

            {/* Payload JSON */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">Dữ liệu Payload JSONB:</label>
              <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl text-[11px] font-mono max-h-48 overflow-auto border border-slate-800">
                {JSON.stringify(selectedLog.payload || {}, null, 2)}
              </pre>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
