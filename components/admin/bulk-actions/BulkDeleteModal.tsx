'use client';

import React, { useState, useEffect } from 'react';
import { ContentType, checkBulkDeleteSafety } from '@/lib/admin/bulk-actions';
import { Trash2, AlertTriangle, ShieldAlert, X, Loader2, Info } from 'lucide-react';

interface BulkDeleteModalProps {
  isOpen: boolean;
  selectedIds: Array<string | number>;
  selectedItemsPreview?: Array<{ id: string | number; label: string }>;
  contentType: ContentType;
  isLoading?: boolean;
  onClose: () => void;
  onConfirmDelete: (deletableIds: Array<string | number>) => Promise<void>;
}

export function BulkDeleteModal({
  isOpen,
  selectedIds,
  selectedItemsPreview = [],
  contentType,
  isLoading = false,
  onClose,
  onConfirmDelete,
}: BulkDeleteModalProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [deletableIds, setDeletableIds] = useState<Array<string | number>>([]);
  const [blockedItems, setBlockedItems] = useState<Array<{ id: string | number; reason: string }>>([]);
  const [confirmInput, setConfirmInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Tự động kiểm tra an toàn xóa (Policy A) ngay khi mở dialog
  useEffect(() => {
    if (isOpen && selectedIds.length > 0) {
      setIsChecking(true);
      setErrorMsg('');
      setConfirmInput('');
      checkBulkDeleteSafety(contentType, selectedIds)
        .then((res) => {
          if (res.success) {
            setDeletableIds(res.deletableIds);
            setBlockedItems(res.blockedItems);
          } else {
            setErrorMsg(res.error || 'Lỗi kiểm tra an toàn xóa.');
          }
        })
        .catch((err) => {
          setErrorMsg(err.message || 'Lỗi kiểm tra dữ liệu xóa.');
        })
        .finally(() => {
          setIsChecking(false);
        });
    }
  }, [isOpen, selectedIds, contentType]);

  if (!isOpen) return null;

  const totalCount = selectedIds.length;
  const deletableCount = deletableIds.length;
  const isConfirmValid = confirmInput.trim() === String(deletableCount);

  const handleExecuteDelete = async () => {
    if (!isConfirmValid) return;
    setErrorMsg('');
    try {
      await onConfirmDelete(deletableIds);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi thực hiện xóa.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Xác nhận xóa hàng loạt (2 lớp an toàn)</h3>
              <p className="text-xs text-slate-500">
                Đã chọn {totalCount} bản ghi {contentType === 'questions' ? 'câu hỏi' : contentType === 'lessons' ? 'bài học' : 'từ vựng'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Loading Safety Check */}
        {isChecking ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-7 h-7 animate-spin text-rose-600" />
            <p className="text-xs font-medium">Đang rà soát ràng buộc dữ liệu người dùng đối với các bản ghi được chọn...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Safety Summary Badge */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                <span className="font-bold block text-sm">{deletableCount}</span>
                Bản ghi rác đủ điều kiện <strong>XÓA CỨNG</strong>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <span className="font-bold block text-sm">{blockedItems.length}</span>
                Bản ghi bị <strong>CHẶN XÓA</strong> (đã có học viên)
              </div>
            </div>

            {/* List Blocked Items Warning (If any) */}
            {blockedItems.length > 0 && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-400/30 rounded-xl text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  Cảnh báo {blockedItems.length} bản ghi bị bảo vệ (Chính sách Policy A):
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Các bản ghi này đã có dữ liệu làm bài / tiến độ học tập của người dùng. Hệ thống tự động ngăn chặn xóa để không làm hỏng dữ liệu điểm số của học viên.
                </p>
                <div className="bg-amber-100/70 p-2 rounded-lg text-[11px] text-amber-900 flex items-start gap-1">
                  <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    💡 <strong>Gợi ý:</strong> Bạn nên quay lại dùng tính năng <strong>&quot;Chuyển Draft&quot;</strong> để ẩn các bản ghi này khỏi ứng dụng học viên.
                  </span>
                </div>
              </div>
            )}

            {/* Preview Selected Items (Max 10) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Danh sách tóm tắt các bản ghi được chọn ({totalCount}):
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs max-h-36 overflow-y-auto space-y-1.5">
                {selectedItemsPreview.slice(0, 10).map((item) => {
                  const isBlocked = blockedItems.some((b) => String(b.id) === String(item.id));
                  return (
                    <div key={String(item.id)} className="flex items-center justify-between gap-2">
                      <span className="truncate text-slate-800 font-mono text-[11px]">{item.label}</span>
                      {isBlocked ? (
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-[10px] font-bold rounded-full shrink-0">
                          Bị chặn xóa
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-medium rounded-full shrink-0">
                          Sẽ xóa
                        </span>
                      )}
                    </div>
                  );
                })}
                {totalCount > 10 && (
                  <div className="text-[11px] text-slate-400 italic pt-1 text-center">
                    ...và {totalCount - 10} bản ghi khác
                  </div>
                )}
              </div>
            </div>

            {/* Require Exact Count Confirmation */}
            {deletableCount > 0 ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-rose-900">
                  ⚠️ Xác nhận lớp 2: Nhập chính xác số lượng bản ghi được phép xóa (&quot;{deletableCount}&quot;) để mở khóa:
                </label>
                <input
                  type="text"
                  placeholder={`Gõ đúng chữ số "${deletableCount}" vào đây...`}
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-rose-900"
                />
              </div>
            ) : (
              <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl font-medium text-center">
                Không có bản ghi rác nào đủ điều kiện xóa cứng (tất cả {totalCount} bản ghi đều đã có học viên làm bài).
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-100 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              {deletableCount > 0 && (
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  disabled={isLoading || !isConfirmValid}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl flex items-center gap-1.5 shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" /> Xóa vĩnh viễn {deletableCount} bản ghi
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
