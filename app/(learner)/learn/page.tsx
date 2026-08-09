import React from 'react';
import Link from 'next/link';
import { getPublishedLessonsWithProgress } from '@/app/actions/learn';
import { getActiveTopics } from '@/lib/taxonomy';
import { BookOpen, CheckCircle2, ChevronRight, Sparkles, Layers, ArrowRight, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LearnPageProps {
  searchParams: Promise<{ topic?: string }>;
}

export default async function LearnPage({ searchParams }: LearnPageProps) {
  const { topic: selectedTopic } = (await searchParams) || {};
  const topicFilter = selectedTopic || 'all';

  const [skillGroups, activeTopics] = await Promise.all([
    getPublishedLessonsWithProgress(topicFilter),
    getActiveTopics(),
  ]);

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

      {/* Banner Nổi bật: Học Từ vựng Active Recall */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-5 text-white shadow-lg space-y-3 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-blue-100">Phương pháp học mới</span>
        </div>
        <h2 className="text-xl font-extrabold tracking-tight">🧠 Học Từ vựng Active Recall theo Chủ đề</h2>
        <p className="text-xs text-blue-100 leading-relaxed max-w-sm">
          Ghi nhớ từ vựng chủ động với 3 dạng bài tập (Trắc nghiệm Anh-Việt, Việt-Anh & Ghép cặp). Tự động theo dõi tiến độ ghi nhớ theo từng chủ đề.
        </p>
        <Link
          href="/learn/vocabulary"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 text-blue-700 font-bold rounded-2xl text-xs transition shadow-md"
        >
          <span>Bắt đầu Học từ vựng ngay</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Tiến độ học tổng quan & Bộ lọc Topic */}
      <div className="space-y-3">
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

        {/* Thanh lọc theo Topic động */}
        <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
          <span className="font-bold text-slate-500 shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            Lọc Topic:
          </span>

          <Link
            href="/learn"
            className={cn(
              'px-3 py-1.5 rounded-xl font-bold transition shrink-0',
              topicFilter === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            Tất cả chủ đề
          </Link>

          <Link
            href="/learn?topic=general"
            className={cn(
              'px-3 py-1.5 rounded-xl font-bold transition shrink-0',
              topicFilter === 'general' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            📂 Chung
          </Link>

          {activeTopics.map((t) => (
            <Link
              key={t.code}
              href={`/learn?topic=${t.code}`}
              className={cn(
                'px-3 py-1.5 rounded-xl font-bold transition shrink-0',
                topicFilter === t.code ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {t.display_name}
            </Link>
          ))}
        </div>
      </div>

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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition">
                          {lesson.title}
                        </span>
                        {lesson.topic_display_name && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-bold">
                            {lesson.topic_display_name}
                          </span>
                        )}
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
            <p className="font-bold text-slate-700 text-sm">Không tìm thấy bài học phù hợp</p>
            <p>Thử thay đổi bộ lọc chủ đề hoặc chọn "Tất cả chủ đề".</p>
          </div>
        )}
      </div>
    </div>
  );
}
