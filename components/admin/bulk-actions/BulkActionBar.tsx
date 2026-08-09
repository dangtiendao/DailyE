'use client';

import React from 'react';
import {
  CheckCircle2,
  FileEdit,
  Sliders,
  Trash2,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContentType } from '@/lib/admin/bulk-actions';

interface BulkActionBarProps {
  selectedCount: number;
  contentType: ContentType;
  isLoading?: boolean;
  onClearSelection: () => void;
  onUpdateStatus: (newStatus: 'published' | 'draft') => void;
  onOpenEditModal: () => void;
  onOpenDeleteModal: () => void;
}

export function BulkActionBar({
  selectedCount,
  contentType,
  isLoading = false,
  onClearSelection,
  onUpdateStatus,
  onOpenEditModal,
  onOpenDeleteModal,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3.5 sm:px-6 shadow-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Counter & Clear Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs shadow-inner">
            {selectedCount}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-200">
              Đã chọn <strong className="text-white font-bold">{selectedCount}</strong> bản ghi
            </span>
            <span className="text-[10px] text-slate-400 capitalize">
              {contentType === 'questions' ? 'Câu hỏi' : contentType === 'lessons' ? 'Bài học' : 'Từ vựng'}
            </span>
          </div>
          <button
            onClick={onClearSelection}
            disabled={isLoading}
            className="ml-2 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"
            title="Bỏ chọn toàn bộ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Published Button */}
          <button
            onClick={() => onUpdateStatus('published')}
            disabled={isLoading}
            className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl inline-flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Chuyển</span> Published
          </button>

          {/* Draft Button */}
          <button
            onClick={() => onUpdateStatus('draft')}
            disabled={isLoading}
            className="px-3 py-1.5 bg-amber-600/90 hover:bg-amber-500 text-white font-medium text-xs rounded-xl inline-flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileEdit className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Chuyển</span> Draft
          </button>

          {/* Edit Field Button */}
          <button
            onClick={onOpenEditModal}
            disabled={isLoading}
            className="px-3 py-1.5 bg-indigo-600/90 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl inline-flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
          >
            <Sliders className="w-3.5 h-3.5" />
            Sửa trường...
          </button>

          {/* Delete Button */}
          <button
            onClick={onOpenDeleteModal}
            disabled={isLoading}
            className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white font-medium text-xs rounded-xl inline-flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
