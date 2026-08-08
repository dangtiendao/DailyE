'use client';

import React from 'react';
import { VocabTopicWithProgress } from '@/app/actions/vocab_learn';
import { BookOpen, CheckCircle2, Flame, Clock, Play, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopicCardProps {
  topic: VocabTopicWithProgress;
  onSelectTopic: (topicCode: string) => void;
}

export function TopicCard({ topic, onSelectTopic }: TopicCardProps) {
  const percentLearned = topic.totalPublishedWords > 0
    ? Math.round((topic.learnedCount / topic.totalPublishedWords) * 100)
    : 0;

  return (
    <div
      className={cn(
        'p-5 bg-white border border-slate-200 rounded-3xl transition-all duration-200 space-y-4 shadow-sm flex flex-col justify-between',
        topic.isComingSoon
          ? 'opacity-60 bg-slate-50/80 cursor-not-allowed border-dashed'
          : 'hover:border-blue-500 hover:shadow-md cursor-pointer group'
      )}
      onClick={() => {
        if (!topic.isComingSoon) {
          onSelectTopic(topic.code);
        }
      }}
    >
      <div className="space-y-3">
        {/* Header Topic */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition leading-snug">
            {topic.displayName}
          </h3>

          {topic.isComingSoon ? (
            <span className="px-2.5 py-0.5 bg-slate-200 text-slate-600 font-bold rounded-full text-[10px] shrink-0 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Sắp ra mắt
            </span>
          ) : (
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full text-[10px] shrink-0">
              {topic.totalPublishedWords} từ
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {!topic.isComingSoon && (
          <div className="space-y-1.5 pt-1">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${percentLearned}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-0.5">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Thuộc {topic.learnedCount} từ
              </span>
              <span>Đang học {topic.learningCount} từ</span>
              <span>Mới {topic.unlearnedCount} từ</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Action Button */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        {topic.isComingSoon ? (
          <span className="text-xs text-slate-400 font-medium italic">Cần tối thiểu 8 từ vựng</span>
        ) : (
          <>
            <span className="text-xs font-bold text-slate-700">
              {topic.unlearnedCount > 0 ? `Còn ${topic.unlearnedCount} từ chưa học` : 'Đã học hết từ mới 🎉'}
            </span>
            <button
              disabled={topic.isComingSoon}
              className="p-2 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white rounded-xl transition shadow-xs"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
