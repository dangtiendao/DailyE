'use server';

import { createClient } from '@/lib/supabase/server';

export interface LessonWithProgress {
  id: string;
  title: string;
  slug: string;
  content: string;
  skill: 'vocabulary' | 'grammar' | 'listening' | 'reading' | 'strategy';
  level_tag: string | null;
  topic: string | null;
  topic_display_name?: string | null;
  status: 'draft' | 'published';
  order_index: number;
  created_at: string;
  isCompleted: boolean;
}

export interface SkillGroupedLessons {
  skill: 'vocabulary' | 'grammar' | 'strategy' | 'reading' | 'listening';
  label: string;
  icon: string;
  lessons: LessonWithProgress[];
}

export interface VocabularyFlashcardItem {
  id: string;
  word: string;
  meaning_vi: string;
  example: string | null;
  topic: string | null;
  level_tag: string | null;
  audio_url: string | null;
}

// 1. Lấy danh sách bài học Published được phân nhóm theo Kỹ năng kèm trạng thái đã học của User & bộ lọc Topic
export async function getPublishedLessonsWithProgress(topicFilter?: string): Promise<SkillGroupedLessons[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Query tất cả bài học đã Published kèm thông tin topic
  let query = supabase
    .from('lessons')
    .select('*, topics(display_name)')
    .eq('status', 'published')
    .order('order_index', { ascending: true });

  if (topicFilter && topicFilter !== 'all') {
    if (topicFilter === 'general') {
      query = query.is('topic', null);
    } else {
      query = query.eq('topic', topicFilter);
    }
  }

  // Truy vấn tất cả bài học đã Published kèm thông tin topic VÀ tiến độ học của user SONG SONG
  const [lessonsRes, progressRes] = await Promise.all([
    query,
    user
      ? supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
      : Promise.resolve({ data: null, error: null }),
  ]);

  const { data: rawLessons, error } = lessonsRes;

  if (error) {
    console.error('Lỗi lấy danh sách bài học:', error);
    return [];
  }

  const completedLessonIds = new Set<string>();
  if (progressRes.data) {
    progressRes.data.forEach((p) => completedLessonIds.add(p.lesson_id));
  }

  const allLessons: LessonWithProgress[] = (rawLessons || []).map((lesson: any) => ({
    ...lesson,
    topic_display_name: lesson.topics?.display_name || (lesson.topic === null ? '📂 Chung' : null),
    isCompleted: completedLessonIds.has(lesson.id),
  }));

  // Phân nhóm theo 5 kỹ năng chính
  const skillDefinitions: { skill: LessonWithProgress['skill']; label: string; icon: string }[] = [
    { skill: 'vocabulary', label: 'Từ vựng TOEIC', icon: '📘' },
    { skill: 'grammar', label: 'Ngữ pháp cơ bản & nâng cao', icon: '🎓' },
    { skill: 'strategy', label: 'Chiến thuật làm bài', icon: '⚡' },
    { skill: 'reading', label: 'Kỹ năng Đọc hiểu', icon: '📖' },
    { skill: 'listening', label: 'Kỹ năng Lắng nghe', icon: '🎧' },
  ];

  return skillDefinitions.map((def) => ({
    skill: def.skill,
    label: def.label,
    icon: def.icon,
    lessons: allLessons.filter((l) => l.skill === def.skill),
  }));
}

// 2. Lấy chi tiết một Bài học theo Slug
export async function getLessonBySlug(slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !lesson) {
    return null;
  }

  // Truy vấn song song kiểm tra tiến độ học & số lượng câu hỏi liên kết
  const [
    { data: progress },
    { count: linkedQuestionCount },
  ] = await Promise.all([
    user
      ? supabase
          .from('lesson_progress')
          .select('completed_at')
          .eq('user_id', user.id)
          .eq('lesson_id', lesson.id)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from('lesson_questions')
      .select('*', { count: 'exact', head: true })
      .eq('lesson_id', lesson.id),
  ]);

  const isCompleted = !!progress;

  return {
    ...lesson,
    isCompleted,
    hasLinkedQuestions: (linkedQuestionCount || 0) > 0,
    linkedQuestionCount: linkedQuestionCount || 0,
  };
}

// 3. Đánh dấu / Bỏ đánh dấu bài học đã học xong
export async function toggleLessonProgress(lessonId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Bạn chưa đăng nhập' };
  }

  // Kiểm tra xem đã có record chưa
  const { data: existing } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .single();

  if (existing) {
    // Đã có -> Xóa (bỏ đánh dấu)
    const { error } = await supabase
      .from('lesson_progress')
      .delete()
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId);

    if (error) return { success: false, error: error.message };
    return { success: true, isCompleted: false };
  } else {
    // Chưa có -> Tạo mới
    const { error } = await supabase
      .from('lesson_progress')
      .insert({ user_id: user.id, lesson_id: lessonId });

    if (error) return { success: false, error: error.message };
    return { success: true, isCompleted: true };
  }
}

