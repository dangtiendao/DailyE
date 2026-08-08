'use server';

import { createClient } from '@/lib/supabase/server';

export interface LessonWithProgress {
  id: string;
  title: string;
  slug: string;
  content: string;
  skill: 'vocabulary' | 'grammar' | 'listening' | 'reading' | 'strategy';
  level_tag: string | null;
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

// 1. Lấy danh sách bài học Published được phân nhóm theo Kỹ năng kèm trạng thái đã học của User
export async function getPublishedLessonsWithProgress(): Promise<SkillGroupedLessons[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Query tất cả bài học đã Published
  const { data: rawLessons, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('status', 'published')
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Lỗi lấy danh sách bài học:', error);
    return [];
  }

  // Lấy danh sách ID các bài học mà user hiện tại đã hoàn thành
  const completedLessonIds = new Set<string>();
  if (user) {
    const { data: progressData } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id);

    if (progressData) {
      progressData.forEach((p) => completedLessonIds.add(p.lesson_id));
    }
  }

  const allLessons: LessonWithProgress[] = (rawLessons || []).map((lesson) => ({
    ...lesson,
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

  // Kiểm tra user hiện tại đã học xong chưa
  let isCompleted = false;
  if (user) {
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('completed_at')
      .eq('user_id', user.id)
      .eq('lesson_id', lesson.id)
      .single();

    if (progress) {
      isCompleted = true;
    }
  }

  // Đếm số lượng câu hỏi liên kết trong lesson_questions
  const { count: linkedQuestionCount } = await supabase
    .from('lesson_questions')
    .select('*', { count: 'exact', head: true })
    .eq('lesson_id', lesson.id);

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

