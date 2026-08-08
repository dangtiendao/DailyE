import React from 'react';
import Link from 'next/link';
import { getAttemptResult } from '@/app/actions/practice';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Sparkles,
  BookOpen,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultPageProps {
  params: Promise<{ attemptId: string }>;
}

// Trang Báo cáo kết quả bài làm /practice/result/[attemptId]
export default async function PracticeResultPage({ params }: ResultPageProps) {
  const { attemptId } = await params;
  const resultData = await getAttemptResult(attemptId);

  if (!resultData) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-4 max-w-md mx-auto my-8">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Không tìm thấy kết quả làm bài</h2>
        <p className="text-xs text-slate-500">Lượt thi này không tồn tại hoặc bạn không có quyền xem.</p>
        <Link
          href="/practice"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Về trang Luyện đề
        </Link>
      </div>
    );
  }

  const { attempt, answersList, tagAnalytics, weakTags, recommendedLessons } = resultData;

  const correctCount = answersList.filter((a) => a.isCorrect).length;
  const totalCount = attempt.total_questions;
  const accuracyPercent = attempt.score;

  // Tính tổng thời gian làm bài từ user_answers
  const totalTimeSpentSeconds = answersList.reduce((acc, a) => acc + (a.timeSpentSeconds || 0), 0);
  const minutes = Math.floor(totalTimeSpentSeconds / 60);
  const seconds = totalTimeSpentSeconds % 60;

  return (
    <div className="space-y-6 pb-12 max-w-md mx-auto">
      {/* Top Bar Navigation */}
      <header className="flex items-center justify-between">
        <Link
          href="/practice"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang Luyện đề</span>
        </Link>
        <span className="text-xs font-bold text-slate-400">ID: #{attempt.id.slice(0, 8)}</span>
      </header>

      {/* Hero Score Card */}
      <section className="bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 text-white shadow-xl text-center space-y-4 relative overflow-hidden">
        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Trophy className="w-8 h-8 text-amber-300" />
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">{accuracyPercent}% Chính xác</h1>
          <p className="text-xs text-emerald-100 font-medium">
            Đúng {correctCount} / {totalCount} câu hỏi
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/20 text-xs">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <p className="text-emerald-200 text-[11px]">Thời gian làm bài</p>
            <p className="font-bold text-sm mt-0.5">{minutes}m {seconds}s</p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl">
            <p className="text-emerald-200 text-[11px]">Độ chính xác</p>
            <p className="font-bold text-sm mt-0.5">{accuracyPercent}%</p>
          </div>
        </div>
      </section>

      {/* Phân tích lỗ hổng theo Knowledge Tag */}
      {tagAnalytics.length > 0 && (
        <section className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Phân tích kết quả theo Chủ điểm</span>
          </h3>

          <div className="space-y-3 pt-1">
            {tagAnalytics.map((stat) => (
              <div key={stat.tag} className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-800">{stat.tag}</span>
                  <span className={cn(stat.accuracy < 50 ? 'text-red-600 font-bold' : 'text-emerald-600')}>
                    {stat.correct}/{stat.total} ({stat.accuracy}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', stat.accuracy < 50 ? 'bg-red-500' : 'bg-emerald-500')}
                    style={{ width: `${stat.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* GỢI Ý BÀI HỌC CẦN ÔN LẠI (Rule: tỷ lệ đúng tag < 50%) */}
      {recommendedLessons.length > 0 && (
        <section className="p-5 bg-indigo-50 border border-indigo-200 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <h3 className="font-bold text-indigo-900 text-sm">Gợi ý bài học khắc phục lỗi sai</h3>
              <p className="text-[11px] text-indigo-700">Bạn làm sai nhiều ở các chủ điểm trên, hãy học lại bài học này:</p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {recommendedLessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/learn/${lesson.slug}`}
                className="p-3 bg-white border border-indigo-100 hover:border-indigo-300 rounded-2xl flex items-center justify-between shadow-sm transition group"
              >
                <div>
                  <p className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition">
                    {lesson.title}
                  </p>
                  <span className="text-[10px] text-indigo-600 font-semibold uppercase">{lesson.skill}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-0.5 transition" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* DANH SÁCH CHỮA BÀI CHI TIẾT VÀ LỜI GIẢI (Lúc này mới tiết lộ correct_answer & explanation) */}
      <section className="space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Chi tiết từng câu hỏi & Lời giải</h3>

        <div className="space-y-4">
          {answersList.map((item, idx) => {
            const q = item.question;
            const options = q?.options || { A: '', B: '', C: '', D: '' };

            return (
              <div
                key={item.id}
                className={cn(
                  'p-5 bg-white border-2 rounded-3xl shadow-sm space-y-3 transition',
                  item.isCorrect ? 'border-emerald-200' : 'border-red-200'
                )}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">
                    Câu {idx + 1} • <span className="text-slate-500">{q?.code}</span>
                  </span>
                  {item.isCorrect ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đúng
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full font-bold text-[11px]">
                      <XCircle className="w-3.5 h-3.5" /> Sai
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                  {q?.question_text}
                </p>

                {/* Danh sách 4 Lựa chọn A/B/C/D */}
                <div className="space-y-1.5 text-xs">
                  {(['A', 'B', 'C', 'D'] as const).map((key) => {
                    const isUserSelected = item.selectedAnswer === key;
                    const isCorrectAnswer = q?.correct_answer === key;

                    return (
                      <div
                        key={key}
                        className={cn(
                          'p-2.5 rounded-xl border flex items-center justify-between font-medium',
                          isCorrectAnswer
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold'
                            : isUserSelected && !isCorrectAnswer
                            ? 'bg-red-100 border-red-300 text-red-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{key}.</span>
                          <span>{options[key]}</span>
                        </div>
                        {isCorrectAnswer && <span className="text-[10px] uppercase font-black text-emerald-700">Đáp án đúng</span>}
                        {isUserSelected && !isCorrectAnswer && <span className="text-[10px] uppercase font-black text-red-600">Bạn chọn</span>}
                      </div>
                    );
                  })}
                </div>

                {/* LỜI GIẢI CHI TIẾT (LỘ LÚC NÀY) */}
                {q?.explanation && (
                  <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-xs space-y-1 text-blue-900">
                    <p className="font-bold flex items-center gap-1 text-blue-800">
                      💡 Lời giải chi tiết:
                    </p>
                    <p className="text-slate-700">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Action Footer */}
      <div className="flex gap-3 pt-4">
        <Link
          href="/practice"
          className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs text-center transition flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Luyện bài khác</span>
        </Link>
      </div>
    </div>
  );
}
