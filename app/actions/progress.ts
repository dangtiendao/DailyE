'use server';

import { createClient } from '@/lib/supabase/server';

export interface DailyStatItem {
  date: string;
  displayDate: string;
  correct: number;
  wrong: number;
  total: number;
}

export interface PartStatItem {
  part: string;
  label: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface WeakTagItem {
  tag: string;
  total: number;
  correct: number;
  accuracy: number;
  recommendedLessonSlug?: string;
  recommendedLessonTitle?: string;
}

export interface UserProgressData {
  totalAnsweredCount: number;
  resolvedErrorCount: number;
  streakCount: number;
  overallAccuracy: number;
  dailyStats: DailyStatItem[];
  partStats: PartStatItem[];
  weakTags: WeakTagItem[];
}

export async function getUserProgressStats(): Promise<UserProgressData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      totalAnsweredCount: 0,
      resolvedErrorCount: 0,
      streakCount: 0,
      overallAccuracy: 0,
      dailyStats: [],
      partStats: [],
      weakTags: [],
    };
  }

  // 1. Lấy thông tin Profile (Streak)
  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_count')
    .eq('id', user.id)
    .single();

  // 2. Đếm số lỗi sai đã được giải quyết (resolved = true)
  const { count: resolvedErrorCount } = await supabase
    .from('error_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('resolved', true);

  // 3. Lấy toàn bộ câu trả lời của user trong user_answers kèm chi tiết câu hỏi
  const { data: rawAnswers } = await supabase
    .from('user_answers')
    .select('created_at, is_correct, questions(exam_part, knowledge_tag)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  const answersList = rawAnswers || [];
  const totalAnsweredCount = answersList.length;

  let totalCorrect = 0;
  answersList.forEach((a) => {
    if (a.is_correct) totalCorrect++;
  });

  const overallAccuracy = totalAnsweredCount > 0 ? Math.round((totalCorrect / totalAnsweredCount) * 100) : 0;

  // 4. BẢNG THỐNG KÊ 14 NGÀY GẦN NHẤT
  const last14DaysMap = new Map<string, { correct: number; wrong: number }>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    last14DaysMap.set(dateStr, { correct: 0, wrong: 0 });
  }

  answersList.forEach((ans) => {
    const dateStr = ans.created_at.split('T')[0];
    if (last14DaysMap.has(dateStr)) {
      const current = last14DaysMap.get(dateStr)!;
      if (ans.is_correct) {
        current.correct++;
      } else {
        current.wrong++;
      }
    }
  });

  const dailyStats: DailyStatItem[] = [];
  last14DaysMap.forEach((val, dateStr) => {
    const parts = dateStr.split('-');
    const displayDate = `${parts[2]}/${parts[1]}`;
    dailyStats.push({
      date: dateStr,
      displayDate,
      correct: val.correct,
      wrong: val.wrong,
      total: val.correct + val.wrong,
    });
  });

  // 5. THỐNG KÊ TỶ LỆ ĐÚNG THEO PART (PART 5, 6, 7)
  const partMap = new Map<string, { total: number; correct: number }>();
  ['part5', 'part6', 'part7'].forEach((p) => partMap.set(p, { total: 0, correct: 0 }));

  answersList.forEach((ans: any) => {
    const part = ans.questions?.exam_part || 'part5';
    if (partMap.has(part)) {
      const current = partMap.get(part)!;
      current.total++;
      if (ans.is_correct) current.correct++;
    }
  });

  const partNames: Record<string, string> = {
    part5: 'Part 5: Hoàn thành câu',
    part6: 'Part 6: Điền đoạn văn',
    part7: 'Part 7: Đọc hiểu đoạn văn',
  };

  const partStats: PartStatItem[] = [];
  partMap.forEach((val, partKey) => {
    const accuracy = val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0;
    partStats.push({
      part: partKey,
      label: partNames[partKey] || partKey,
      total: val.total,
      correct: val.correct,
      accuracy,
    });
  });

  // 6. THỐNG KÊ THEO KNOWLEDGE_TAG & TRÍCH XUẤT TOP 3 TAG YẾU NHẤT (< 60% accuracy)
  const tagMap = new Map<string, { total: number; correct: number }>();

  answersList.forEach((ans: any) => {
    const tags = ans.questions?.knowledge_tag || ['Ngữ pháp chung'];
    tags.forEach((t: string) => {
      const current = tagMap.get(t) || { total: 0, correct: 0 };
      current.total++;
      if (ans.is_correct) current.correct++;
      tagMap.set(t, current);
    });
  });

  const tagList: WeakTagItem[] = [];
  tagMap.forEach((val, tagKey) => {
    if (val.total >= 1) {
      const accuracy = Math.round((val.correct / val.total) * 100);
      tagList.push({
        tag: tagKey,
        total: val.total,
        correct: val.correct,
        accuracy,
      });
    }
  });

  // Sắp xếp các tag theo độ chính xác tăng dần (Yếu nhất lên đầu)
  tagList.sort((a, b) => a.accuracy - b.accuracy);
  const weakTags = tagList.slice(0, 3);

  // Tìm bài học gợi ý cho 3 tag yếu này
  if (weakTags.length > 0) {
    const { data: lessons } = await supabase
      .from('lessons')
      .select('title, slug, skill')
      .eq('status', 'published');

    if (lessons) {
      weakTags.forEach((item) => {
        const matchingLesson = lessons.find(
          (l) =>
            l.title.toLowerCase().includes(item.tag.toLowerCase()) ||
            l.skill.toLowerCase().includes(item.tag.toLowerCase())
        );
        if (matchingLesson) {
          item.recommendedLessonSlug = matchingLesson.slug;
          item.recommendedLessonTitle = matchingLesson.title;
        }
      });
    }
  }

  return {
    totalAnsweredCount,
    resolvedErrorCount: resolvedErrorCount || 0,
    streakCount: profile?.streak_count || 0,
    overallAccuracy,
    dailyStats,
    partStats,
    weakTags,
  };
}
