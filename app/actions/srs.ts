'use server';

import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

export interface ErrorLogItem {
  id: string;
  question_id: string;
  knowledge_tag: string | null;
  wrong_count: number;
  consecutive_correct: number;
  last_wrong_at: string;
  resolved: boolean;
  question: {
    id: string;
    code: string;
    exam_part: string;
    question_text: string;
    options: { A: string; B: string; C: string; D: string };
    difficulty: string;
  } | null;
}

export interface ErrorTagGroup {
  tag: string;
  count: number;
  items: ErrorLogItem[];
}

export interface TodayDashboardData {
  streakCount: number;
  dueVocabCount: number;
  nextLesson: {
    id: string;
    title: string;
    slug: string;
    skill: string;
    level_tag: string | null;
  } | null;
  recommendedPractice: {
    type: 'remedial' | 'same_level' | 'challenge';
    title: string;
    description: string;
    tag: string;
    targetPart: string;
    difficulty: string;
  };
  unresolvedErrorCount: number;
  userProfile: {
    full_name: string | null;
    target_score: number | null;
    access_level: string;
  } | null;
}

const LEITNER_INTERVALS = [1, 2, 4, 7, 15];

// ------------------------------------------------------------------------------
// 1. TÍNH TOÁN STREAK NGÀY HỌC LIÊN TIẾP (🔥)
// ------------------------------------------------------------------------------
async function updateAndGetStreak(
  supabase: SupabaseClient<Database>,
  userId: string,
  currentStreak: number,
  lastActiveDate: string | null
) {
  const todayStr = new Date().toISOString().split('T')[0];

  if (!lastActiveDate) {
    // Lần đầu hoạt động -> Streak = 1
    await supabase.from('profiles').update({ streak_count: 1, last_active_date: todayStr }).eq('id', userId);
    return 1;
  }

  if (lastActiveDate === todayStr) {
    // Đã tính streak hôm nay -> Giữ nguyên
    return currentStreak || 1;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak = 1;
  if (lastActiveDate === yesterdayStr) {
    // Hoạt động liên tiếp ngày hôm qua -> Tăng streak
    newStreak = (currentStreak || 0) + 1;
  }

  await supabase.from('profiles').update({ streak_count: newStreak, last_active_date: todayStr }).eq('id', userId);
  return newStreak;
}

// ------------------------------------------------------------------------------
// 2. DỮ LIỆU BẢNG ĐIỀU KHIỂN PHIÊN HỌC HẰNG NGÀY (/TODAY)
// ------------------------------------------------------------------------------
export async function getTodayDashboardData(): Promise<TodayDashboardData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      streakCount: 0,
      dueVocabCount: 0,
      nextLesson: null,
      recommendedPractice: {
        type: 'same_level',
        title: 'Luyện tập Part 5',
        description: 'Luyện 15 câu hoàn thành câu cơ bản',
        tag: 'Grammar',
        targetPart: 'part5',
        difficulty: 'medium',
      },
      unresolvedErrorCount: 0,
      userProfile: null,
    };
  }

  // Lấy Profile người dùng
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, target_score, access_level, streak_count, last_active_date')
    .eq('id', user.id)
    .single();

  const streakCount = await updateAndGetStreak(
    supabase as any,
    user.id,
    profile?.streak_count || 0,
    profile?.last_active_date || null
  );

  const todayStr = new Date().toISOString().split('T')[0];

  // KHỐI 1: Số từ vựng đến hạn ôn tập SRS (due_date <= hôm nay)
  const { count: dueVocabCount } = await supabase
    .from('review_schedule')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('item_type', 'vocabulary')
    .lte('due_date', todayStr);

  // KHỐI 2: Bài học tiếp theo trong lộ trình (Bài xuất bản chưa hoàn thành)
  const { data: completedProgress } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', user.id);

  const completedLessonIds = new Set((completedProgress || []).map((p) => p.lesson_id));

  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id, title, slug, skill, level_tag')
    .eq('status', 'published')
    .order('order_index', { ascending: true });

  const nextLesson = (allLessons || []).find((l) => !completedLessonIds.has(l.id)) || (allLessons && allLessons[0]) || null;

  // KHỐI 4: Số câu sai đang chờ ôn trong Sổ lỗi sai (resolved = false)
  const { count: unresolvedErrorCount } = await supabase
    .from('error_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('resolved', false);

  // KHỐI 3: Bài luyện đề xuất theo Quy tắc (Rule-based):
  // Tag đúng <50% -> thêm câu dễ cùng tag; 50-75% -> bài luyện cùng level; >75% -> tăng độ khó
  const { data: recentAttempts } = await supabase
    .from('test_attempts')
    .select('score')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(5);

  let recommendedPractice: TodayDashboardData['recommendedPractice'] = {
    type: 'same_level',
    title: 'Luyện tập Part 5 Tổng hợp',
    description: 'Luyện 15 câu hoàn thành câu độ khó Trung bình',
    tag: 'Grammar',
    targetPart: 'part5',
    difficulty: 'medium',
  };

  if (recentAttempts && recentAttempts.length > 0) {
    const avgScore = Math.round(
      recentAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / recentAttempts.length
    );

    if (avgScore < 50) {
      recommendedPractice = {
        type: 'remedial',
        title: 'Củng cố nền tảng (Dễ)',
        description: 'Tỷ lệ làm bài gần đây < 50%. Hãy ôn lại 10 câu dễ!',
        tag: 'Grammar',
        targetPart: 'part5',
        difficulty: 'easy',
      };
    } else if (avgScore > 75) {
      recommendedPractice = {
        type: 'challenge',
        title: 'Thử thách Nâng cao (Khó)',
        description: 'Tỷ lệ làm bài đạt > 75%. Thử sức với 15 câu độ khó Cao!',
        tag: 'Vocabulary',
        targetPart: 'part5',
        difficulty: 'hard',
      };
    }
  }

  return {
    streakCount,
    dueVocabCount: dueVocabCount || 0,
    nextLesson,
    recommendedPractice,
    unresolvedErrorCount: unresolvedErrorCount || 0,
    userProfile: profile
      ? {
          full_name: profile.full_name,
          target_score: profile.target_score,
          access_level: profile.access_level,
        }
      : null,
  };
}

// ------------------------------------------------------------------------------
// 3. SỔ LỖI SAI: LẤY DANH SÁCH CÂU SAI CHƯA RESOLVED NHÓM THEO KNOWLEDGE_TAG
// ------------------------------------------------------------------------------
export async function getErrorNotebookItems(): Promise<ErrorTagGroup[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: rawLogs, error } = await supabase
    .from('error_logs')
    .select('id, question_id, knowledge_tag, wrong_count, consecutive_correct, last_wrong_at, resolved, questions(id, code, exam_part, question_text, options, difficulty)')
    .eq('user_id', user.id)
    .eq('resolved', false)
    .order('wrong_count', { ascending: false });

  if (error || !rawLogs) {
    console.error('Lỗi đọc sổ lỗi sai:', error);
    return [];
  }

  const tagGroupMap = new Map<string, ErrorLogItem[]>();

  (rawLogs as any[]).forEach((log) => {
    const tag = log.knowledge_tag || 'Ngữ pháp chung';
    const currentList = tagGroupMap.get(tag) || [];
    currentList.push({
      id: log.id,
      question_id: log.question_id,
      knowledge_tag: log.knowledge_tag,
      wrong_count: log.wrong_count,
      consecutive_correct: log.consecutive_correct || 0,
      last_wrong_at: log.last_wrong_at,
      resolved: log.resolved,
      question: log.questions,
    });
    tagGroupMap.set(tag, currentList);
  });

  const result: ErrorTagGroup[] = [];
  tagGroupMap.forEach((items, tag) => {
    result.push({
      tag,
      count: items.length,
      items,
    });
  });

  return result;
}

// ------------------------------------------------------------------------------
// 4. ÔN TẬP CÂU SAI: CHẤM ĐIỂM VÀ CẬP NHẬT CONSECUTIVE_CORRECT / RESOLVED = TRUE
// ------------------------------------------------------------------------------
export async function submitErrorReviewAttempt(answers: { questionId: string; selectedAnswer: 'A' | 'B' | 'C' | 'D' }[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Bạn chưa đăng nhập' };
  if (!answers || answers.length === 0) return { success: false, error: 'Không tìm thấy câu trả lời' };

  const questionIds = answers.map((a) => a.questionId);

  const { data: realQuestions } = await supabase
    .from('questions')
    .select('id, correct_answer')
    .in('id', questionIds);

  const realMap = new Map<string, string>();
  (realQuestions || []).forEach((q) => realMap.set(q.id, q.correct_answer));

  let correctCount = 0;
  const now = new Date().toISOString();

  for (const ans of answers) {
    const correctAnswer = realMap.get(ans.questionId);
    const isCorrect = correctAnswer === ans.selectedAnswer;
    if (isCorrect) correctCount++;

    // Lấy log lỗi sai hiện tại
    const { data: log } = await supabase
      .from('error_logs')
      .select('id, wrong_count, consecutive_correct')
      .eq('user_id', user.id)
      .eq('question_id', ans.questionId)
      .single();

    if (log) {
      if (isCorrect) {
        const newConsecutive = (log.consecutive_correct || 0) + 1;
        const isResolved = newConsecutive >= 2; // Đúng 2 lần liên tiếp -> Đã khắc phục lỗi sai

        await supabase
          .from('error_logs')
          .update({
            consecutive_correct: newConsecutive,
            resolved: isResolved,
            resolved_at: isResolved ? now : null,
          })
          .eq('id', log.id);
      } else {
        // Sai lại -> Reset số lần đúng liên tiếp về 0, tăng số lần sai
        await supabase
          .from('error_logs')
          .update({
            consecutive_correct: 0,
            wrong_count: log.wrong_count + 1,
            last_wrong_at: now,
            resolved: false,
          })
          .eq('id', log.id);
      }
    }

    // Cập nhật mốc lặp lại SRS Leitner
    await updateSrsItem(supabase as any, user.id, 'question', ans.questionId, isCorrect);
  }

  return {
    success: true,
    correctCount,
    totalCount: answers.length,
    score: Math.round((correctCount / answers.length) * 100),
  };
}

// ------------------------------------------------------------------------------
// 5. THUẬT TOÁN SRS LEITNER (BẬC GIÃN KHOẢNG CÁCH: 1 -> 2 -> 4 -> 7 -> 15 NGÀY)
// ------------------------------------------------------------------------------
async function updateSrsItem(
  supabase: SupabaseClient<Database>,
  userId: string,
  itemType: 'vocabulary' | 'question',
  itemId: string,
  isCorrect: boolean
) {
  const now = new Date();

  // Tìm record review_schedule hiện tại
  const { data: schedule } = await supabase
    .from('review_schedule')
    .select('id, interval_days, review_count')
    .eq('user_id', userId)
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .single();

  let currentInterval = schedule?.interval_days || 1;
  let nextInterval = 1;

  if (isCorrect) {
    // Đúng -> Tăng lên bậc lặp lại tiếp theo
    const currentIndex = LEITNER_INTERVALS.indexOf(currentInterval);
    if (currentIndex >= 0 && currentIndex < LEITNER_INTERVALS.length - 1) {
      nextInterval = LEITNER_INTERVALS[currentIndex + 1];
    } else {
      nextInterval = LEITNER_INTERVALS[LEITNER_INTERVALS.length - 1]; // Giữ nguyên bậc tối đa 15 ngày
    }
  } else {
    // Sai -> Về bậc 1 ngày
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
        review_count: (schedule.review_count || 0) + 1,
        last_reviewed_at: now.toISOString(),
      })
      .eq('id', schedule.id);
  } else {
    await supabase.from('review_schedule').insert({
      user_id: userId,
      item_type: itemType,
      item_id: itemId,
      interval_days: nextInterval,
      due_date: dueDateStr,
      review_count: 1,
      last_reviewed_at: now.toISOString(),
    });
  }
}
