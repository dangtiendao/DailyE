'use server';

import { createClient } from '@/lib/supabase/server';
import { VocabWordType } from '@/types/database';

export interface VocabTopicWithProgress {
  code: string;
  displayName: string;
  orderIndex: number;
  totalPublishedWords: number;
  learnedCount: number; // familiarity = 3
  learningCount: number; // familiarity = 1 hoặc 2
  unlearnedCount: number; // chưa có trong progress
  isComingSoon: boolean; // totalPublishedWords < 8
}

export interface LearnableVocabItem {
  id: number;
  word: string;
  wordType: VocabWordType | null;
  meaningVi: string;
  example: string | null;
  topic: string;
  levelTag: string | null;
}

// ------------------------------------------------------------------------------
// 1. LẤY DANH SÁCH CHỦ ĐỀ KÈM THỐNG KÊ TIẾN ĐỘ CHO HỌC VIÊN
// ------------------------------------------------------------------------------
import { getActiveTopics } from '@/lib/taxonomy';

export async function getVocabTopicsWithProgress(): Promise<VocabTopicWithProgress[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Lấy tất cả active topics từ lib/taxonomy (loại bỏ topic is_active = false)
  const activeTopics = await getActiveTopics();
  if (!activeTopics || activeTopics.length === 0) {
    return [];
  }
  const topics = activeTopics.map((t) => ({
    code: t.code,
    display_name: t.display_name,
    order_index: t.order_index,
  }));

  // 2. Lấy số lượng từ published theo từng topic
  const { data: vocabCounts } = await supabase
    .from('vocabulary_items')
    .select('topic')
    .eq('status', 'published');

  const topicTotalMap = new Map<string, number>();
  (vocabCounts || []).forEach((v) => {
    topicTotalMap.set(v.topic, (topicTotalMap.get(v.topic) || 0) + 1);
  });

  // 3. Nếu user đã đăng nhập, lấy tiến độ học từ vựng cá nhân
  const userProgressMap = new Map<number, number>(); // vocab_id -> familiarity
  if (user) {
    const { data: userProgress } = await supabase
      .from('user_vocab_progress')
      .select('vocab_id, familiarity')
      .eq('user_id', user.id);

    (userProgress || []).forEach((p) => {
      userProgressMap.set(p.vocab_id, p.familiarity);
    });
  }

  // 4. Lấy chi tiết từng từ vựng published để ghép tiến độ
  const { data: allPublishedVocab } = await supabase
    .from('vocabulary_items')
    .select('id, topic')
    .eq('status', 'published');

  const topicLearnedMap = new Map<string, number>();
  const topicLearningMap = new Map<string, number>();

  (allPublishedVocab || []).forEach((v) => {
    const fam = userProgressMap.get(v.id);
    if (fam === 3) {
      topicLearnedMap.set(v.topic, (topicLearnedMap.get(v.topic) || 0) + 1);
    } else if (fam === 1 || fam === 2) {
      topicLearningMap.set(v.topic, (topicLearningMap.get(v.topic) || 0) + 1);
    }
  });

  return topics.map((t) => {
    const total = topicTotalMap.get(t.code) || 0;
    const learned = topicLearnedMap.get(t.code) || 0;
    const learning = topicLearningMap.get(t.code) || 0;
    const unlearned = Math.max(0, total - (learned + learning));

    return {
      code: t.code,
      displayName: t.display_name,
      orderIndex: t.order_index,
      totalPublishedWords: total,
      learnedCount: learned,
      learningCount: learning,
      unlearnedCount: unlearned,
      isComingSoon: total < 8,
    };
  });
}

// ------------------------------------------------------------------------------
// 2. LẤY DANH SÁCH TỪ MỚI CẦN HỌC THEO CHỦ ĐỀ
// ------------------------------------------------------------------------------
export async function getNewWordsForTopic(
  topicCode: string,
  limitCount: number = 10
): Promise<{ success: boolean; words?: LearnableVocabItem[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Vui lòng đăng nhập để bắt đầu học' };
  }

  // Lấy các vocab_id đã có trong tiến độ của user
  const { data: userProgress } = await supabase
    .from('user_vocab_progress')
    .select('vocab_id')
    .eq('user_id', user.id);

  const existingVocabIds = new Set((userProgress || []).map((p) => p.vocab_id));

  // Lấy các từ vựng published của topic chưa có trong user_vocab_progress
  const { data: allTopicWords, error } = await supabase
    .from('vocabulary_items')
    .select('id, word, word_type, meaning_vi, example, topic, level_tag')
    .eq('topic', topicCode)
    .eq('status', 'published')
    .order('id', { ascending: true });

  if (error || !allTopicWords) {
    return { success: false, error: 'Lỗi đọc từ vựng từ hệ thống' };
  }

  const unlearnedWords = allTopicWords.filter((w) => !existingVocabIds.has(w.id));

  const selectedWords = unlearnedWords.slice(0, limitCount).map((w) => ({
    id: w.id,
    word: w.word,
    wordType: w.word_type as VocabWordType | null,
    meaningVi: w.meaning_vi,
    example: w.example,
    topic: w.topic,
    levelTag: w.level_tag,
  }));

  return {
    success: true,
    words: selectedWords,
  };
}

// ------------------------------------------------------------------------------
// 3. GHI NHẬN TỪ VỰNG ĐÃ GIỚI THIỆU LẦN ĐẦU (FAMILIARITY = 1)
// ------------------------------------------------------------------------------
export async function recordWordsIntroduced(vocabIds: number[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !vocabIds || vocabIds.length === 0) return;

  const now = new Date().toISOString();

  for (const vId of vocabIds) {
    const { data: existing } = await supabase
      .from('user_vocab_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('vocab_id', vId)
      .single();

    if (!existing) {
      await supabase.from('user_vocab_progress').insert({
        user_id: user.id,
        vocab_id: vId,
        familiarity: 1, // Đã gặp lần đầu
        correct_streak: 0,
        total_correct: 0,
        total_wrong: 0,
        last_seen_at: now,
      });
    }
  }
}

// ------------------------------------------------------------------------------
// 4. HOÀN THÀNH PHIÊN HỌC TỪ MỚI -> ĐẨY VÀO REVIEW_SCHEDULE (DUE NGÀY MAI)
// ------------------------------------------------------------------------------
export async function completeNewWordsSession(learnedVocabIds: number[], durationSeconds?: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !learnedVocabIds || learnedVocabIds.length === 0) return { success: true };

  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // 1. Đẩy các từ vào review_schedule với interval = 1 ngày, due = ngày mai
  for (const vId of learnedVocabIds) {
    const itemIdStr = String(vId);

    const { data: existingSchedule } = await supabase
      .from('review_schedule')
      .select('id')
      .eq('user_id', user.id)
      .in('item_type', ['vocab', 'vocabulary'])
      .eq('item_id', itemIdStr)
      .single();

    if (!existingSchedule) {
      await supabase.from('review_schedule').insert({
        user_id: user.id,
        item_type: 'vocab',
        item_id: itemIdStr,
        due_date: tomorrowStr,
        interval_days: 1,
        review_count: 1,
      });
    }
  }

  // 2. Ghi nhật ký vào vocab_sessions
  await supabase.from('vocab_sessions').insert({
    user_id: user.id,
    mode: 'learn_new',
    total_items: learnedVocabIds.length,
    correct_items: learnedVocabIds.length,
    duration_seconds: durationSeconds || null,
  });

  return { success: true };
}
