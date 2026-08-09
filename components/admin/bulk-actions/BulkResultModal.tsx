'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface BulkResultModalProps {
  isOpen: boolean;
  successCount: number;
  failedItems: Array<{ id: string | number; reason: string }>;
  onClose: () => void;
}

export function BulkResultModal({
  isOpen,
  successCount,
  failedItems = [],
  onClose,
}: BulkResultModalProps) {
  if (!isOpen) return null;

  const hasFailed = failedItems.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${hasFailed ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {hasFailed ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Kết quả thao tác hàng loạt</h3>
              <p className="text-xs text-slate-500">Báo cáo chi tiết phản hồi từ Server</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Banner */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Thực hiện thành công đối với <strong>{successCount}</strong> bản ghi.</span>
        </div>

        {/* Failed / Blocked Items Detail */}
        {hasFailed && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Chi tiết {failedItems.length} bản ghi không thể xử lý / bị chặn:
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs max-h-48 overflow-y-auto space-y-2">
              {failedItems.map((item, idx) => (
                <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="font-mono text-[11px] font-bold text-slate-700">ID: {String(item.id)}</div>
                  <div className="text-[11px] text-amber-700 leading-snug">{item.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow"
          >
            Đóng thông báo
          </button>
        </div>
      </div>
    </div>
  );
}
