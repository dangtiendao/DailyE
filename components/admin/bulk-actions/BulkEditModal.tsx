'use client';

import React, { useState } from 'react';
import { ContentType } from '@/lib/admin/bulk-actions';
import { Sliders, X, Loader2, AlertCircle } from 'lucide-react';

interface BulkEditModalProps {
  isOpen: boolean;
  selectedCount: number;
  contentType: ContentType;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (field: string, value: any) => Promise<void>;
}

const FIELD_CONFIGS: Record<
  ContentType,
  Array<{ field: string; label: string; type: 'select' | 'text'; options?: Array<{ label: string; value: string }> }>
> = {
  questions: [
    {
      field: 'level_tag',
      label: 'Level Tag (Trình độ)',
      type: 'select',
      options: [
        { label: '350+', value: '350+' },
        { label: '500+', value: '500+' },
        { label: '650+', value: '650+' },
        { label: '800+', value: '800+' },
      ],
    },
    {
      field: 'topic',
      label: 'Chủ đề (Topic)',
      type: 'text',
    },
    {
      field: 'difficulty',
      label: 'Độ khó (Difficulty)',
      type: 'select',
      options: [
        { label: 'Dễ (Easy)', value: 'easy' },
        { label: 'Trung bình (Medium)', value: 'medium' },
        { label: 'Khó (Hard)', value: 'hard' },
      ],
    },
  ],
  lessons: [
    {
      field: 'level_tag',
      label: 'Level Tag (Trình độ)',
      type: 'select',
      options: [
        { label: '350+', value: '350+' },
        { label: '500+', value: '500+' },
        { label: '650+', value: '650+' },
        { label: '800+', value: '800+' },
      ],
    },
    {
      field: 'skill',
      label: 'Kỹ năng (Skill)',
      type: 'select',
      options: [
        { label: 'Từ vựng (vocabulary)', value: 'vocabulary' },
        { label: 'Ngữ pháp (grammar)', value: 'grammar' },
        { label: 'Kỹ năng nghe (listening)', value: 'listening' },
        { label: 'Kỹ năng đọc (reading)', value: 'reading' },
        { label: 'Chiến thuật (strategy)', value: 'strategy' },
      ],
    },
  ],
  vocabulary: [
    {
      field: 'topic',
      label: 'Chủ đề (Topic)',
      type: 'select',
      options: [
        { label: '🏢 Văn phòng (office)', value: 'office' },
        { label: '👥 Tuyển dụng & Nhân sự (hr)', value: 'hr' },
        { label: '📋 Họp & Sự kiện (meeting)', value: 'meeting' },
        { label: '💰 Tài chính & Ngân hàng (finance)', value: 'finance' },
        { label: '📣 Marketing & Bán hàng (marketing)', value: 'marketing' },
        { label: '✈️ Du lịch & Di chuyển (travel)', value: 'travel' },
        { label: '🛒 Mua sắm & Dịch vụ (shopping)', value: 'shopping' },
        { label: '🏭 Sản xuất & Vận chuyển (production)', value: 'production' },
        { label: '💻 Công nghệ (technology)', value: 'technology' },
        { label: '🏥 Sức khỏe (health)', value: 'health' },
        { label: '🍽️ Nhà hàng & Ẩm thực (restaurant)', value: 'restaurant' },
        { label: '🏠 Bất động sản (real_estate)', value: 'real_estate' },
      ],
    },
    {
      field: 'level_tag',
      label: 'Level Tag (Trình độ)',
      type: 'select',
      options: [
        { label: '350+', value: '350+' },
        { label: '500+', value: '500+' },
        { label: '650+', value: '650+' },
        { label: '800+', value: '800+' },
        { label: 'A2', value: 'A2' },
        { label: 'B1', value: 'B1' },
        { label: 'B2', value: 'B2' },
        { label: 'C1', value: 'C1' },
      ],
    },
  ],
};

export function BulkEditModal({
  isOpen,
  selectedCount,
  contentType,
  isLoading = false,
  onClose,
  onSubmit,
}: BulkEditModalProps) {
  const fields = FIELD_CONFIGS[contentType] || [];
  const [selectedField, setSelectedField] = useState<string>(fields[0]?.field || '');
  const [fieldValue, setFieldValue] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const currentFieldConfig = fields.find((f) => f.field === selectedField);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedField) {
      setErrorMsg('Vui lòng chọn trường dữ liệu cần sửa.');
      return;
    }

    if (!fieldValue || fieldValue.trim() === '') {
      setErrorMsg('Vui lòng nhập/chọn giá trị mới.');
      return;
    }

    try {
      await onSubmit(selectedField, fieldValue.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi xảy ra khi cập nhật.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Sửa trường hàng loạt</h3>
              <p className="text-xs text-slate-500">Cập nhật giá trị đồng thời cho {selectedCount} bản ghi</p>
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

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Chọn trường */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              1. Chọn trường cần sửa hàng loạt
            </label>
            <select
              value={selectedField}
              onChange={(e) => {
                const newF = e.target.value;
                setSelectedField(newF);
                const cfg = fields.find((f) => f.field === newF);
                if (cfg && cfg.type === 'select' && cfg.options && cfg.options.length > 0) {
                  setFieldValue(cfg.options[0].value);
                } else {
                  setFieldValue('');
                }
              }}
              disabled={isLoading}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              {fields.map((f) => (
                <option key={f.field} value={f.field}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Nhập/Chọn giá trị mới */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              2. Giá trị mới áp dụng cho tất cả {selectedCount} bản ghi
            </label>
            {currentFieldConfig?.type === 'select' ? (
              <select
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="">-- Chọn giá trị --</option>
                {currentFieldConfig.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Nhập giá trị mới..."
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            )}
          </div>

          {/* Preview Box */}
          {selectedField && fieldValue && (
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900">
              🔍 <strong>Xem trước:</strong> Sẽ cập nhật trường{' '}
              <span className="font-semibold text-indigo-700">{currentFieldConfig?.label}</span> thành{' '}
              <strong className="text-indigo-700">&quot;{fieldValue}&quot;</strong> cho{' '}
              <strong className="text-indigo-700">{selectedCount}</strong> bản ghi được chọn.
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading || !fieldValue}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang cập nhật...
                </>
              ) : (
                'Cập nhật ngay'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
