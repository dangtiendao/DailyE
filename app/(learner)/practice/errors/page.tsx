import React from 'react';
import Link from 'next/link';
import { getErrorNotebookItems } from '@/app/actions/srs';
import { ArrowLeft, AlertOctagon, RotateCcw, CheckCircle2, Flame, PlayCircle, BookOpen, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

// Trang Sổ lỗi sai /practice/errors
export default async function ErrorNotebookPage() {
  const tagGroups = await getErrorNotebookItems();

  const totalUnresolvedCount = tagGroups.reduce((acc, g) => acc + g.count, 0);

  return (
    <div className="space-y-6 pb-8 max-w-md mx-auto">
      {/* Header Navigation */}
      <header className="flex items-center justify-between">
        <Link
          href="/practice"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang Luyện đề</span>
        </Link>
        <span className="px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1">
          <AlertOctagon className="w-3.5 h-3.5" /> Sổ lỗi sai
        </span>
      </header>

      {/* Hero Banner Sổ lỗi sai */}
      <section className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 rounded-3xl p-5 text-white shadow-lg space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-100">Học đúng lỗi sai</span>
          <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-extrabold">{totalUnresolvedCount} câu cần ôn</span>
        </div>
        <h1 className="text-xl font-black tracking-tight">🔁 Sổ lỗi sai thông minh</h1>
        <p className="text-xs text-rose-100 leading-relaxed">
          Trả lời đúng câu sai <strong>2 lần liên tiếp</strong> ở 2 phiên khác nhau để đánh dấu hoàn thành (Resolved)!
        </p>

        {totalUnresolvedCount > 0 && (
          <Link
            href="/practice/session?mode=error_review"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 text-rose-700 font-bold rounded-2xl text-xs transition shadow-md mt-1"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Ôn tất cả câu sai ngay</span>
          </Link>
        )}
      </section>

      {/* Danh sách câu sai nhóm theo Chủ điểm Knowledge Tag */}
      <div className="space-y-5">
        {tagGroups.map((group) => (
          <section key={group.tag} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>{group.tag}</span>
              </h2>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                {group.count} câu
              </span>
            </div>

            <div className="space-y-2.5">
              {group.items.map((item) => {
                const q = item.question;
                return (
                  <div
                    key={item.id}
                    className="p-4 bg-white border border-slate-200 hover:border-rose-300 rounded-2xl shadow-sm space-y-2 transition"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {q?.code || 'P5-0000'} • {q?.exam_part || 'part5'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full text-[11px]">
                          Sai {item.wrong_count} lần
                        </span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                          Đúng {item.consecutive_correct}/2
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      {q?.question_text || 'Nội dung câu hỏi'}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {totalUnresolvedCount === 0 && (
          <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Sổ lỗi sai sạch sẽ!</h3>
              <p className="text-xs text-slate-500">
                Chúc mừng! Bạn hiện không có câu sai nào chưa được giải quyết. Hãy tiếp tục luyện đề nhé.
              </p>
            </div>
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs"
            >
              Luyện bài mới
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
