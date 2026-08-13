'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TARGET_SCORES = [
  { score: 350, label: '350+ TOEIC', desc: 'Mới bắt đầu - Lấy lại gốc tiếng Anh' },
  { score: 500, label: '500+ TOEIC', desc: 'Cơ bản - Ra trường & Xin việc phổ thông' },
  { score: 650, label: '650+ TOEIC', desc: 'Khá - Yêu cầu doanh nghiệp & Tập đoàn' },
  { score: 800, label: '800+ TOEIC', desc: 'Giỏi - Môi trường làm việc quốc tế' },
  { score: 900, label: '900+ TOEIC', desc: 'Xuất sắc - Chuyên gia & Giảng dạy' },
];

interface TargetScoreSelectorProps {
  selectedScore: number;
  onSelectScore: (score: number) => void;
  disabled?: boolean;
}

export function TargetScoreSelector({
  selectedScore,
  onSelectScore,
  disabled = false,
}: TargetScoreSelectorProps) {
  return (
    <div className="space-y-3">
      {TARGET_SCORES.map((item) => {
        const isSelected = selectedScore === item.score;
        return (
          <div
            key={item.score}
            onClick={() => !disabled && onSelectScore(item.score)}
            className={cn(
              "p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-center justify-between",
              isSelected
                ? "border-blue-600 bg-blue-50/50 shadow-sm"
                : "border-slate-200 hover:border-slate-300 bg-white",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="space-y-0.5">
              <p className={cn("font-bold text-sm", isSelected ? "text-blue-900" : "text-slate-800")}>
                {item.label}
              </p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
            {isSelected ? (
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
