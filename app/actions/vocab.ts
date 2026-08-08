'use server';

import { createClient } from '@/lib/supabase/server';
import { VocabSessionMode } from '@/types/database';

export interface VocabQuizOption {
  id: string;
  text: string;
}

export interface VocabQuizQuestion {
  quizItemId: string; // Temp UUID generated on-the-fly
  vocabId: number;
  word: string;
  wordType: string | null;
  meaningVi: string;
  example: string | null;
  questionType: 'en_vi' | 'vi_en';
  prompt: string; // The word or meaning displayed to user
  options: VocabQuizOption[]; // 4 shuffled options without correct flag
}

export interface VocabMatchingPair {
  vocabId: number;
  word: string;
  meaningVi: string;
}

export interface GenerateVocabQuizParams {
  mode: 'mcq_en_vi' | 'mcq_vi_en' | 'matching' | 'mixed';
  topic?: string;
  level?: string;
  count?: number; // 10, 20, 30
  source?: 'new' | 'weak' | 'due' | 'mixed';
}

export interface GenerateVocabQuizResult {
  success: boolean;
  error?: string;
  questions?: VocabQuizQuestion[];
  matchingPairs?: VocabMatchingPair[];
  totalItems?: number;
}

export interface SubmitVocabAnswerResult {
  success: boolean;
  isCorrect: boolean;
  correctAnswer: string;
  word: string;
  meaningVi: string;
  example: string | null;
}

interface StoreVocabItem {
  id: number;
  word: string;
  word_type: string | null;
  meaning_vi: string;
  example: string | null;
  topic: string;
  level_tag: string | null;
}

const LEITNER_INTERVALS = [1, 2, 4, 7, 15];

// Helper trộn mảng Fisher-Yates
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ------------------------------------------------------------------------------
// 1. GENERATE VOCAB QUIZ (ON-THE-FLY QUIZ GENERATOR)
// ------------------------------------------------------------------------------
export async function generateVocabQuiz(
  params: GenerateVocabQuizParams
): Promise<GenerateVocabQuizResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const count = params.count || 10;
  const mode = params.mode || 'mixed';
  const source = params.source || 'mixed';

  // Lấy toàn bộ từ vựng published trong kho (hoặc theo topic/level nếu có)
  let query = supabase
    .from('vocabulary_items')
    .select('id, word, word_type, meaning_vi, example, topic, level_tag')
    .eq('status', 'published');

  if (params.topic && params.topic !== 'all') {
    query = query.eq('topic', params.topic);
  }
  if (params.level && params.level !== 'all') {
    query = query.eq('level_tag', params.level);
  }

  const { data: rawStoreWords, error: storeErr } = await query;

  if (storeErr || !rawStoreWords) {
    return { success: false, error: 'Lỗi đọc kho từ vựng từ hệ thống' };
  }

  const allStoreWords: StoreVocabItem[] = rawStoreWords as unknown as StoreVocabItem[];

  // EDGE CASE CHECK: Toàn hệ thống có dưới 4 từ -> Trả lỗi rõ ràng
  if (allStoreWords.length < 4) {
    return {
      success: false,
      error: 'Kho từ vựng chưa đủ 4 từ để tạo trắc nghiệm. Vui lòng thêm từ vựng mới.',
    };
  }

  // Nếu user đã đăng nhập, lấy danh sách tiến độ để chọn từ theo source
  let targetWords: StoreVocabItem[] = [...allStoreWords];

  if (user) {
    const { data: userProgress } = await supabase
      .from('user_vocab_progress')
      .select('vocab_id, familiarity, correct_streak, total_wrong')
      .eq('user_id', user.id);

    const progressMap = new Map<number, { familiarity: number; correct_streak: number; total_wrong: number }>();
    (userProgress || []).forEach((p) => {
      progressMap.set(p.vocab_id, {
        familiarity: p.familiarity,
        correct_streak: p.correct_streak,
        total_wrong: p.total_wrong,
      });
    });

    if (source === 'new') {
      const newWords = allStoreWords.filter((w) => !progressMap.has(w.id));
      if (newWords.length >= 4) targetWords = newWords;
    } else if (source === 'weak') {
      const weakWords = allStoreWords.filter((w) => {
        const p = progressMap.get(w.id);
        return p && (p.familiarity < 2 || p.total_wrong > 0 || p.correct_streak === 0);
      });
      if (weakWords.length >= 4) targetWords = weakWords;
    } else if (source === 'due') {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: dueSchedules } = await supabase
        .from('review_schedule')
        .select('item_id')
        .eq('user_id', user.id)
        .in('item_type', ['vocab', 'vocabulary'])
        .lte('due_date', todayStr);

      const dueItemIds = new Set((dueSchedules || []).map((s) => s.item_id));
      const dueWords = allStoreWords.filter((w) => dueItemIds.has(String(w.id)));
      if (dueWords.length >= 4) targetWords = dueWords;
    }
  }

  // Trộn từ đích và chọn `count` từ
  const selectedTargets = shuffleArray(targetWords).slice(0, count);

  // Nếu mode là 'matching', trả về các cặp từ - nghĩa
  if (mode === 'matching') {
    const matchingPairs: VocabMatchingPair[] = selectedTargets.map((w) => ({
      vocabId: w.id,
      word: w.word,
      meaningVi: w.meaning_vi,
    }));

    return {
      success: true,
      matchingPairs,
      totalItems: matchingPairs.length,
    };
  }

  // Tạo các câu hỏi MCQ
  const questions: VocabQuizQuestion[] = [];

  for (let i = 0; i < selectedTargets.length; i++) {
    const target = selectedTargets[i];
    
    // Quyết định type câu hỏi (en_vi hay vi_en)
    let qType: 'en_vi' | 'vi_en' = 'en_vi';
    if (mode === 'mcq_vi_en') {
      qType = 'vi_en';
    } else if (mode === 'mixed') {
      qType = i % 2 === 0 ? 'en_vi' : 'vi_en';
    }

    // LỰA CHỌN 3 TỪ NHIỄU (DISTRACTORS):
    const candidatePool: StoreVocabItem[] = allStoreWords.filter((w) => w.id !== target.id);

    const p1 = candidatePool.filter((w) => w.topic === target.topic && w.level_tag === target.level_tag);
    const p2 = candidatePool.filter((w) => w.level_tag === target.level_tag && w.topic !== target.topic);
    const p3 = candidatePool.filter((w) => w.topic !== target.topic && w.level_tag !== target.level_tag);

    // Ghép candidates theo ưu tiên
    const potentialDistractors = [...shuffleArray(p1), ...shuffleArray(p2), ...shuffleArray(p3)];

    // Lọc loại bỏ trùng nghĩa với đáp án đúng
    const filteredDistractors: StoreVocabItem[] = [];
    const usedTexts = new Set<string>();

    const targetCorrectText = qType === 'en_vi' ? target.meaning_vi.trim().toLowerCase() : target.word.trim().toLowerCase();
    usedTexts.add(targetCorrectText);

    for (const cand of potentialDistractors) {
      const text = qType === 'en_vi' ? cand.meaning_vi.trim().toLowerCase() : cand.word.trim().toLowerCase();
      if (!usedTexts.has(text)) {
        usedTexts.add(text);
        filteredDistractors.push(cand);
      }
      if (filteredDistractors.length >= 3) break;
    }

    // Nếu vẫn thiếu do trùng nghĩa, lấy ngẫu nhiên từ candidatePool bất kỳ
    if (filteredDistractors.length < 3) {
      for (const cand of shuffleArray(candidatePool)) {
        const text = qType === 'en_vi' ? cand.meaning_vi.trim().toLowerCase() : cand.word.trim().toLowerCase();
        if (!usedTexts.has(text)) {
          usedTexts.add(text);
          filteredDistractors.push(cand);
        }
        if (filteredDistractors.length >= 3) break;
      }
    }

    // 4 Option (1 đúng + 3 nhiễu)
    const rawOptions: VocabQuizOption[] = [
      {
        id: `opt-correct-${target.id}`,
        text: qType === 'en_vi' ? target.meaning_vi : target.word,
      },
      ...filteredDistractors.slice(0, 3).map((d: StoreVocabItem, dIdx: number) => ({
        id: `opt-distractor-${d.id}-${dIdx}`,
        text: qType === 'en_vi' ? d.meaning_vi : d.word,
      })),
    ];

    const shuffledOptions = shuffleArray(rawOptions);

    questions.push({
      quizItemId: `quiz-${target.id}-${i}-${Math.random().toString(36).substring(2, 7)}`,
      vocabId: target.id,
      word: target.word,
      wordType: target.word_type,
      meaningVi: target.meaning_vi,
      example: target.example,
      questionType: qType,
      prompt: qType === 'en_vi' ? target.word : target.meaning_vi,
      options: shuffledOptions,
    });
  }

  return {
    success: true,
    questions,
    totalItems: questions.length,
  };
}

// ------------------------------------------------------------------------------
// 2. SUBMIT VOCAB ANSWER (KỂ CẢ VÀI CÂU MCQ HOẶC MATCHING)
// ------------------------------------------------------------------------------
export async function submitVocabAnswer(
  vocabId: number,
  questionType: 'en_vi' | 'vi_en' | 'matching',
  selectedAnswerText: string
): Promise<SubmitVocabAnswerResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Đọc từ vựng từ DB để đối chiếu
  const { data: vocab } = await supabase
    .from('vocabulary_items')
    .select('id, word, meaning_vi, example')
    .eq('id', vocabId)
    .single();

  if (!vocab) {
    return {
      success: false,
      isCorrect: false,
      correctAnswer: '',
      word: '',
      meaningVi: '',
      example: null,
    };
  }

  let correctAnswer = '';
  if (questionType === 'en_vi') {
    correctAnswer = vocab.meaning_vi;
  } else {
    correctAnswer = vocab.word;
  }

  const isCorrect = selectedAnswerText.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

  // Nếu user đã đăng nhập, cập nhật user_vocab_progress & review_schedule
  if (user) {
    const now = new Date().toISOString();

    // 1. Cập nhật user_vocab_progress
    const { data: progress } = await supabase
      .from('user_vocab_progress')
      .select('id, familiarity, correct_streak, total_correct, total_wrong')
      .eq('user_id', user.id)
      .eq('vocab_id', vocabId)
      .single();

    if (progress) {
      const newStreak = isCorrect ? progress.correct_streak + 1 : 0;
      const newFamiliarity = isCorrect ? Math.min(3, progress.familiarity + 1) : progress.familiarity;

      await supabase
        .from('user_vocab_progress')
        .update({
          correct_streak: newStreak,
          familiarity: newFamiliarity,
          total_correct: progress.total_correct + (isCorrect ? 1 : 0),
          total_wrong: progress.total_wrong + (isCorrect ? 0 : 1),
          last_seen_at: now,
        })
        .eq('id', progress.id);
    } else {
      await supabase.from('user_vocab_progress').insert({
        user_id: user.id,
        vocab_id: vocabId,
        familiarity: isCorrect ? 1 : 0,
        correct_streak: isCorrect ? 1 : 0,
        total_correct: isCorrect ? 1 : 0,
        total_wrong: isCorrect ? 0 : 1,
        last_seen_at: now,
      });
    }

    // 2. Cập nhật review_schedule (SRS Leitner 1 -> 2 -> 4 -> 7 -> 15 ngày)
    await updateVocabSrsItem(supabase, user.id, String(vocabId), isCorrect);
  }

  return {
    success: true,
    isCorrect,
    correctAnswer,
    word: vocab.word,
    meaningVi: vocab.meaning_vi,
    example: vocab.example,
  };
}

// ------------------------------------------------------------------------------
// 3. FINISH VOCAB SESSION (GHI NHẬN LỊCH SỬ PHIÊN HỌC)
// ------------------------------------------------------------------------------
export async function finishVocabSession(sessionData: {
  mode: VocabSessionMode;
  totalItems: number;
  correctItems: number;
  durationSeconds?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: true, isGuest: true };
  }

  const { error } = await supabase.from('vocab_sessions').insert({
    user_id: user.id,
    mode: sessionData.mode,
    total_items: sessionData.totalItems,
    correct_items: sessionData.correctItems,
    duration_seconds: sessionData.durationSeconds || null,
  });

  if (error) {
    console.error('Lỗi ghi nhận vocab_session:', error);
    return { success: false, error: error.message };
  }

  // Cập nhật last_active_date để tính streak cho học viên
  const todayStr = new Date().toISOString().split('T')[0];
  await supabase
    .from('profiles')
    .update({ last_active_date: todayStr })
    .eq('id', user.id);

  return { success: true };
}

// Helper cập nhật Lịch lặp lại ngắt quãng SRS cho từ vựng
async function updateVocabSrsItem(
  supabase: any,
  userId: string,
  itemId: string,
  isCorrect: boolean
) {
  const now = new Date();

  const { data: schedule } = await supabase
    .from('review_schedule')
    .select('id, interval_days, review_count')
    .eq('user_id', userId)
    .in('item_type', ['vocab', 'vocabulary'])
    .eq('item_id', itemId)
    .single();

  let currentInterval = (schedule as any)?.interval_days || 1;
  let nextInterval = 1;

  if (isCorrect) {
    const currentIndex = LEITNER_INTERVALS.indexOf(currentInterval);
    if (currentIndex >= 0 && currentIndex < LEITNER_INTERVALS.length - 1) {
      nextInterval = LEITNER_INTERVALS[currentIndex + 1];
    } else {
      nextInterval = LEITNER_INTERVALS[LEITNER_INTERVALS.length - 1];
    }
  } else {
    nextInterval = LEITNER_INTERVALS[0];
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + nextInterval);
  const dueDateStr = dueDate.toISOString().split('T')[0];

  if (schedule) {
    await supabase
      .from('review_schedule')
      .update({
        interval_days: nextInterval,
        due_date: dueDateStr,
        review_count: ((schedule as any).review_count || 0) + 1,
        last_reviewed_at: now.toISOString(),
      })
      .eq('id', (schedule as any).id);
  } else {
    await supabase.from('review_schedule').insert({
      user_id: userId,
      item_type: 'vocab',
      item_id: itemId,
      interval_days: nextInterval,
      due_date: dueDateStr,
      review_count: 1,
      last_reviewed_at: now.toISOString(),
    });
  }
}
