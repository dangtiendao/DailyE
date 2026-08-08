'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getLessonBySlug, toggleLessonProgress } from '@/app/actions/learn';
import { ArrowLeft, CheckCircle2, BookOpen, Loader2, Sparkles, AlertCircle, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Component render Markdown đơn giản, sạch sẽ cho nội dung bài học
function SimpleMarkdownRenderer({ content }: { content: string }) {
  // Biến đổi đơn giản các thẻ Markdown cơ bản (Header, Bold, List, Code block, Table)
  const lines = content.split('\n');

  return (
    <div className="space-y-3 text-slate-800 text-sm leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('# ')) {
          return <h1 key={idx} className="text-xl font-bold text-slate-900 pt-3 pb-1 border-b border-slate-200">{trimmed.replace('# ', '')}</h1>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={idx} className="text-lg font-bold text-slate-900 pt-2">{trimmed.replace('## ', '')}</h2>;
        }
        if (trimmed.startsWith('### ')) {
          return <h3 key={idx} className="text-base font-bold text-slate-900 pt-1">{trimmed.replace('### ', '')}</h3>;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <li key={idx} className="ml-4 list-disc text-slate-700">
              {trimmed.substring(2)}
            </li>
          );
        }
        if (trimmed.startsWith('```')) {
          return null; // Bỏ qua dòng thẻ code block
        }
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        return <p key={idx}>{trimmed}</p>;
      })}
    </div>
  );
}

type LessonDetail = Awaited<ReturnType<typeof getLessonBySlug>>;

// Trang chi tiết bài học /learn/[slug]
export default function LessonDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [lesson, setLesson] = useState<LessonDetail>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchLesson = async () => {
      setIsLoading(true);
      const data = await getLessonBySlug(slug);
      setLesson(data);
      if (data) {
        setIsCompleted(data.isCompleted);
      }
      setIsLoading(false);
    };
    fetchLesson();
  }, [slug]);

  const handleToggleComplete = async () => {
    if (!lesson) return;
    setIsToggling(true);
    const res = await toggleLessonProgress(lesson.id);
    if (res.success && res.isCompleted !== undefined) {
      setIsCompleted(res.isCompleted);
    }
    setIsToggling(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs text-slate-500">Đang tải nội dung bài học...</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-6 bg-white border border-slate-200 rounded-3xl text-center space-y-4 max-w-md mx-auto my-8">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Không tìm thấy bài học</h2>
        <p className="text-xs text-slate-500">Bài học này có thể chưa xuất bản hoặc đường dẫn không tồn tại.</p>
        <Link
          href="/learn"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Về danh sách bài học
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header Navigation */}
      <header className="flex items-center justify-between border-b border-slate-200 pb-3">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Danh sách bài học</span>
        </Link>

        <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">
          {lesson.skill}
        </span>
      </header>

      {/* Lesson Info Card */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {lesson.level_tag && (
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">
              {lesson.level_tag}
            </span>
          )}
          {isCompleted && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">{lesson.title}</h1>
      </div>

      {/* Markdown Content Container */}
      <article className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
        <SimpleMarkdownRenderer content={lesson.content} />
      </article>

      {/* Action Footer Bar */}
      <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Nút đánh dấu đã học xong */}
          <button
            onClick={handleToggleComplete}
            disabled={isToggling}
            className={cn(
              'w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-md',
              isCompleted
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            )}
          >
            {isToggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã học xong (Nhấn để bỏ đánh dấu)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Đánh dấu đã học xong</span>
              </>
            )}
          </button>

          {/* Nút Luyện tập ngay hoặc Sắp có bài luyện */}
          {lesson.hasLinkedQuestions ? (
            <Link
              href={`/practice?lessonId=${lesson.id}`}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-md"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Luyện tập ngay ({lesson.linkedQuestionCount} câu)</span>
            </Link>
          ) : (
            <div className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-medium text-center">
              🔒 Sắp có bài luyện tập cho bài này
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
