import React from 'react';
import Link from 'next/link';
import { getPublishedLessonsWithProgress } from '@/app/actions/learn';
import { BookOpen, CheckCircle2, ChevronRight, Sparkles, Layers, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Trang /learn: Danh sách bài học xuất bản nhóm theo kỹ năng & Lật thẻ Flashcards
export default async function LearnPage() {
  const skillGroups = await getPublishedLessonsWithProgress();

  // Tính tổng số bài học và số bài đã hoàn thành
  let totalLessons = 0;
  let completedCount = 0;

  skillGroups.forEach((group) => {
    group.lessons.forEach((l) => {
      totalLessons++;
      if (l.isCompleted) completedCount++;
    });
  });

  const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Học kiến thức</h1>
          <p className="text-xs text-slate-500">Từ vựng, Ngữ pháp & Chiến thuật làm bài TOEIC</p>
        </div>
        <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-2xl">
          <BookOpen className="w-6 h-6" />
        </div>
      </header>

      {/* Banner Nổi bật: Flashcards Từ vựng */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-5 text-white shadow-lg space-y-3 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-blue-100">Tính năng nổi bật</span>
        </div>
        <h2 className="text-xl font-extrabold tracking-tight">🃏 Flashcards Từ vựng TOEIC</h2>
        <p className="text-xs text-blue-100 leading-relaxed max-w-sm">
          Ôn tập từ vựng bằng phương pháp lật thẻ tương tác cực nhanh. Nhớ sâu từ vựng trọng tâm xuất hiện trong đề thi.
        </p>
        <Link
          href="/learn/vocabulary"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 text-blue-700 font-bold rounded-2xl text-xs transition shadow-md"
        >
          <span>Lật thẻ ngay</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Tiến độ học tổng quan */}
      {totalLessons > 0 && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              Tiến độ học kiến thức
            </span>
            <span className="font-bold text-blue-600">{completedCount} / {totalLessons} bài ({progressPercentage}%)</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Danh sách Bài học nhóm theo Kỹ năng */}
      <div className="space-y-6">
        {skillGroups.map((group) => {
          if (group.lessons.length === 0) return null;

          return (
            <section key={group.skill} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{group.icon}</span>
                <h3 className="font-bold text-slate-900 text-base">{group.label}</h3>
                <span className="text-xs text-slate-400 font-normal">({group.lessons.length} bài)</span>
              </div>

              <div className="space-y-2.5">
                {group.lessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/learn/${lesson.slug}`}
                    className="p-4 bg-white border border-slate-200 hover:border-blue-300 rounded-2xl shadow-sm flex items-center justify-between transition group cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition">
                          {lesson.title}
                        </span>
                        {lesson.level_tag && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                            {lesson.level_tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {lesson.isCompleted ? 'Đã hoàn thành' : 'Chưa học'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {lesson.isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          Đã học
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium group-hover:bg-blue-50 group-hover:text-blue-600">
                          Chưa học
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {totalLessons === 0 && (
          <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-slate-500 text-xs space-y-2">
            <p className="font-bold text-slate-700 text-sm">Chưa có bài học xuất bản</p>
            <p>Admin đang cập nhật thêm các bài học mới. Bạn hãy quay lại sau nhé!</p>
          </div>
        )}
      </div>
    </div>
  );
}
