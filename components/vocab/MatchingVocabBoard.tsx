'use client';

import React, { useState, useEffect } from 'react';
import { VocabMatchingPair, submitVocabAnswer } from '@/app/actions/vocab';
import { CheckCircle2, Layers, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchingVocabBoardProps {
  matchingPairs: VocabMatchingPair[];
  batchSize?: number; // Mặc định 4-6 cặp mỗi lượt
  onComplete: (firstTryCorrectCount: number, wrongPairsCount: number, wrongVocabIds: Set<number>) => void;
}

interface ColumnItem {
  id: string;
  vocabId: number;
  text: string;
  type: 'word' | 'meaning';
}

export function MatchingVocabBoard({
  matchingPairs,
  batchSize = 5,
  onComplete,
}: MatchingVocabBoardProps) {
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [leftItems, setLeftItems] = useState<ColumnItem[]>([]);
  const [rightItems, setRightItems] = useState<ColumnItem[]>([]);

  const [selectedLeft, setSelectedLeft] = useState<ColumnItem | null>(null);
  const [selectedRight, setSelectedRight] = useState<ColumnItem | null>(null);

  const [matchedVocabIds, setMatchedVocabIds] = useState<Set<number>>(new Set());
  const [wrongFlashPair, setWrongFlashPair] = useState<{ leftId: string; rightId: string } | null>(null);

  // Thống kê phiên
  const [firstTryCorrectCount, setFirstTryCorrectCount] = useState(0);
  const [wrongPairsCount, setWrongPairsCount] = useState(0);
  const [wrongVocabIds, setWrongVocabIds] = useState<Set<number>>(new Set());
  const [attemptedVocabIds, setAttemptedVocabIds] = useState<Set<number>>(new Set());

  // Chia batches
  const totalBatches = Math.ceil(matchingPairs.length / batchSize);
  const currentBatchPairs = matchingPairs.slice(
    currentBatchIndex * batchSize,
    (currentBatchIndex + 1) * batchSize
  );

  // Load batch mới
  useEffect(() => {
    if (currentBatchPairs.length === 0) return;

    const lefts: ColumnItem[] = currentBatchPairs.map((p) => ({
      id: `left-${p.vocabId}`,
      vocabId: p.vocabId,
      text: p.word,
      type: 'word',
    }));

    const rights: ColumnItem[] = currentBatchPairs.map((p) => ({
      id: `right-${p.vocabId}`,
      vocabId: p.vocabId,
      text: p.meaningVi,
      type: 'meaning',
    }));

    // Trộn ngẫu nhiên độc lập 2 cột
    setLeftItems([...lefts].sort(() => Math.random() - 0.5));
    setRightItems([...rights].sort(() => Math.random() - 0.5));
    setMatchedVocabIds(new Set());
    setSelectedLeft(null);
    setSelectedRight(null);
  }, [currentBatchIndex]);

  // Xử lý khi user chọn 1 cặp left & right
  const checkPairMatch = async (left: ColumnItem, right: ColumnItem) => {
    const isMatch = left.vocabId === right.vocabId;

    // Gửi server action cập nhật tiến độ
    await submitVocabAnswer(left.vocabId, 'en_vi', right.text);

    if (isMatch) {
      setMatchedVocabIds((prev) => new Set([...prev, left.vocabId]));

      if (!attemptedVocabIds.has(left.vocabId)) {
        setFirstTryCorrectCount((c) => c + 1);
      }

      // Reset selection
      setSelectedLeft(null);
      setSelectedRight(null);

      // Kiểm tra nếu ghép xong toàn bộ lượt này
      if (matchedVocabIds.size + 1 === currentBatchPairs.length) {
        setTimeout(() => {
          if (currentBatchIndex + 1 < totalBatches) {
            setCurrentBatchIndex((b) => b + 1);
          } else {
            onComplete(firstTryCorrectCount + 1, wrongPairsCount, wrongVocabIds);
          }
        }, 500);
      }
    } else {
      // Ghép sai -> Nháy đỏ
      setWrongFlashPair({ leftId: left.id, rightId: right.id });
      setWrongPairsCount((c) => c + 1);

      setWrongVocabIds((prev) => new Set([...prev, left.vocabId, right.vocabId]));
      setAttemptedVocabIds((prev) => new Set([...prev, left.vocabId, right.vocabId]));

      setTimeout(() => {
        setWrongFlashPair(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 700);
    }
  };

  const handleLeftClick = (item: ColumnItem) => {
    if (matchedVocabIds.has(item.vocabId) || wrongFlashPair) return;

    if (selectedLeft?.id === item.id) {
      setSelectedLeft(null);
      return;
    }

    setSelectedLeft(item);
    if (selectedRight) {
      checkPairMatch(item, selectedRight);
    }
  };

  const handleRightClick = (item: ColumnItem) => {
    if (matchedVocabIds.has(item.vocabId) || wrongFlashPair) return;

    if (selectedRight?.id === item.id) {
      setSelectedRight(null);
      return;
    }

    setSelectedRight(item);
    if (selectedLeft) {
      checkPairMatch(selectedLeft, item);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-slate-900 text-base">Nối Từ vựng & Nghĩa</h2>
        </div>
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
          Lượt {currentBatchIndex + 1} / {totalBatches}
        </span>
      </div>

      <p className="text-xs text-slate-500">
        Chọn 1 từ tiếng Anh bên trái, sau đó chọn 1 nghĩa tương ứng bên phải để nối cặp.
      </p>

      {/* 2 Columns Matching Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left Column (Word EN) */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-center mb-1">
            Từ tiếng Anh
          </span>
          {leftItems.map((item) => {
            const isMatched = matchedVocabIds.has(item.vocabId);
            const isSelected = selectedLeft?.id === item.id;
            const isWrong = wrongFlashPair?.leftId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleLeftClick(item)}
                disabled={isMatched}
                className={cn(
                  'w-full p-3.5 border-2 rounded-2xl text-xs sm:text-sm font-bold text-center transition-all duration-200 min-h-[56px] flex items-center justify-center',
                  isMatched
                    ? 'border-emerald-200 bg-emerald-50/50 text-emerald-600 opacity-40 cursor-default'
                    : isWrong
                    ? 'border-rose-500 bg-rose-100 text-rose-900 animate-shake'
                    : isSelected
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-md ring-2 ring-indigo-200'
                    : 'border-slate-200 hover:border-indigo-400 bg-white text-slate-800'
                )}
              >
                {item.text}
              </button>
            );
          })}
        </div>

        {/* Right Column (Meaning VI) */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-center mb-1">
            Nghĩa tiếng Việt
          </span>
          {rightItems.map((item) => {
            const isMatched = matchedVocabIds.has(item.vocabId);
            const isSelected = selectedRight?.id === item.id;
            const isWrong = wrongFlashPair?.rightId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleRightClick(item)}
                disabled={isMatched}
                className={cn(
                  'w-full p-3.5 border-2 rounded-2xl text-xs sm:text-sm font-bold text-center transition-all duration-200 min-h-[56px] flex items-center justify-center',
                  isMatched
                    ? 'border-emerald-200 bg-emerald-50/50 text-emerald-600 opacity-40 cursor-default'
                    : isWrong
                    ? 'border-rose-500 bg-rose-100 text-rose-900 animate-shake'
                    : isSelected
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-md ring-2 ring-indigo-200'
                    : 'border-slate-200 hover:border-indigo-400 bg-white text-slate-800'
                )}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
