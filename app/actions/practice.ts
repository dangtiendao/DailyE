'use server';

import { createClient } from '@/lib/supabase/server';

export interface SafeQuestion {
  id: string;
  code: string;
  exam_part: string;
  question_type: string | null;
  level_tag: string | null;
  question_text: string;
  options: { A: string; B: string; C: string; D: string };
  knowledge_tag: string[];
  topic: string | null;
  difficulty: string;
  image_url: string | null;
  audio_url: string | null;
}

export interface UserAnswerPayload {
  questionId: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  timeSpentSeconds: number;
}

export interface SubmitAttemptPayload {
  answers: UserAnswerPayload[];
  totalTimeSpentSeconds: number;
  testId?: string;
}

export interface RecommendedLesson {
  id: string;
  title: string;
  slug: string;
  skill: 'vocabulary' | 'grammar' | 'listening' | 'reading' | 'strategy';
  level_tag: string | null;
}

export interface AttemptAnswerDetail {
  id: string;
  questionId: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  timeSpentSeconds: number;
  question: {
    id: string;
    code: string;
    exam_part: string;
    question_text: string;
    options: { A: string; B: string; C: string; D: string };
    correct_answer: 'A' | 'B' | 'C' | 'D';
    explanation: string | null;
    knowledge_tag: string[];
  };
}

// ------------------------------------------------------------------------------
// 1. BẢO MẬT: LẤY CÂU HỎI LUYỆN THI (TUYỆT ĐỐI KHÔNG CHỨA CORRECT_ANSWER & EXPLANATION)
// ------------------------------------------------------------------------------
export async function getPracticeQuestions(filters: {
  part?: string;
  tag?: string;
  levelTag?: string;
  limit?: number;
}): Promise<SafeQuestion[]> {
  const supabase = await createClient();

  // Query từ VIEW an toàn published_questions_safe
  let query = supabase
    .from('published_questions_safe')
    .select('id, code, exam_part, question_type, level_tag, question_text, options, knowledge_tag, topic, difficulty, image_url, audio_url');

  if (filters.part && filters.part !== 'all') {
    query = query.eq('exam_part', filters.part);
  }

  if (filters.levelTag && filters.levelTag !== 'all') {
    query = query.eq('level_tag', filters.levelTag);
  }

  const limitCount = filters.limit || 20;

  const { data, error } = await query.limit(limitCount);

  if (error) {
    console.error('Lỗi lấy câu hỏi luyện thi:', error);
    return [];
  }

  let questions = (data || []) as SafeQuestion[];

  // Lọc theo knowledge_tag nếu có
  if (filters.tag && filters.tag !== 'all') {
    const targetTag = filters.tag.toLowerCase();
    questions = questions.filter((q) =>
      q.knowledge_tag && q.knowledge_tag.some((t) => t.toLowerCase().includes(targetTag))
    );
  }

  return questions;
}

// ------------------------------------------------------------------------------
// 2. CHẤM ĐIỂM SERVER-SIDE & GHI LOGS (TEST_ATTEMPTS, USER_ANSWERS, ERROR_LOGS)
// ------------------------------------------------------------------------------
export async function submitPracticeAttempt(payload: SubmitAttemptPayload) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Bạn chưa đăng nhập' };
  }

  if (!payload.answers || payload.answers.length === 0) {
    return { success: false, error: 'Không tìm thấy câu trả lời nào' };
  }

  const questionIds = payload.answers.map((a) => a.questionId);

  // Lấy thông tin đáp án THẬT từ bảng gốc questions trên Server
  const { data: realQuestions, error: fetchErr } = await supabase
    .from('questions')
    .select('id, correct_answer, explanation, knowledge_tag')
    .in('id', questionIds);

  if (fetchErr || !realQuestions) {
    return { success: false, error: `Lỗi chấm điểm: ${fetchErr?.message}` };
  }

  const realQuestionMap = new Map<string, { correct_answer: string; explanation: string | null; knowledge_tag: string[] }>();
  (realQuestions || []).forEach((q) => {
    realQuestionMap.set(q.id, {
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      knowledge_tag: q.knowledge_tag || [],
    });
  });

  let correctCount = 0;
  const processedAnswers: {
    question_id: string;
    selected_answer: 'A' | 'B' | 'C' | 'D';
    is_correct: boolean;
    time_spent_seconds: number;
    knowledge_tag: string | null;
  }[] = [];

  payload.answers.forEach((ans) => {
    const realQ = realQuestionMap.get(ans.questionId);
    const isCorrect = realQ ? realQ.correct_answer === ans.selectedAnswer : false;
    if (isCorrect) correctCount++;

    processedAnswers.push({
      question_id: ans.questionId,
      selected_answer: ans.selectedAnswer,
      is_correct: isCorrect,
      time_spent_seconds: ans.timeSpentSeconds || 0,
      knowledge_tag: realQ && realQ.knowledge_tag.length > 0 ? realQ.knowledge_tag[0] : null,
    });
  });

  // 1. Tạo lượt làm bài trong test_attempts
  const score = Math.round((correctCount / payload.answers.length) * 100);
  const now = new Date().toISOString();

  const { data: attempt, error: attemptErr } = await supabase
    .from('test_attempts')
    .insert({
      user_id: user.id,
      test_id: payload.testId || null,
      started_at: now,
      finished_at: now,
      score,
      total_questions: payload.answers.length,
    })
    .select('id')
    .single();

  if (attemptErr || !attempt) {
    return { success: false, error: `Lỗi tạo lượt làm bài: ${attemptErr?.message}` };
  }

  // 2. Chèn danh sách câu trả lời vào user_answers
  const userAnswersPayload = processedAnswers.map((a) => ({
    attempt_id: attempt.id,
    question_id: a.question_id,
    user_id: user.id,
    selected_answer: a.selected_answer,
    is_correct: a.is_correct,
    time_spent_seconds: a.time_spent_seconds,
  }));

  const { error: answersErr } = await supabase.from('user_answers').insert(userAnswersPayload);
  if (answersErr) {
    console.error('Lỗi chèn câu trả lời user_answers:', answersErr);
  }

  // 3. Ghi nhận Sổ lỗi sai (error_logs) cho các câu làm sai (Upsert: tăng wrong_count)
  const wrongAnswers = processedAnswers.filter((a) => !a.is_correct);

  for (const wrong of wrongAnswers) {
    // Kiểm tra xem đã có log lỗi sai của user_id + question_id chưa
    const { data: existingLog } = await supabase
      .from('error_logs')
      .select('id, wrong_count')
      .eq('user_id', user.id)
      .eq('question_id', wrong.question_id)
      .single();

    if (existingLog) {
      await supabase
        .from('error_logs')
        .update({
          wrong_count: existingLog.wrong_count + 1,
          last_wrong_at: now,
          resolved: false,
        })
        .eq('id', existingLog.id);
    } else {
      await supabase.from('error_logs').insert({
        user_id: user.id,
        question_id: wrong.question_id,
        knowledge_tag: wrong.knowledge_tag,
        wrong_count: 1,
        last_wrong_at: now,
        resolved: false,
      });
    }
  }

  return { success: true, attemptId: attempt.id };
}

// ------------------------------------------------------------------------------
// 3. LẤY BÁO CÁO KẾT QUẢ VÀ BÀI HỌC GỢI Ý (BẢO VỆ CHỐNG GIAN LẬN SINGLE SUBMISSION)
// ------------------------------------------------------------------------------
export async function getAttemptResult(attemptId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Lấy thông tin lượt làm bài (Validate chính chủ user_id = user.id)
  const { data: attempt, error: attemptErr } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .single();

  if (attemptErr || !attempt) {
    return null;
  }

  // Lấy danh sách câu trả lời của lượt thi này
  const { data: userAnswers } = await supabase
    .from('user_answers')
    .select('*, questions(id, code, exam_part, question_text, options, correct_answer, explanation, knowledge_tag)')
    .eq('attempt_id', attemptId);

  const answersList: AttemptAnswerDetail[] = (userAnswers || []).map((ua) => ({
    id: ua.id,
    questionId: ua.question_id,
    selectedAnswer: ua.selected_answer as 'A' | 'B' | 'C' | 'D',
    isCorrect: ua.is_correct,
    timeSpentSeconds: ua.time_spent_seconds,
    question: (ua as any).questions,
  }));

  // Phân tích tỷ lệ đúng theo từng knowledge_tag
  const tagStatsMap = new Map<string, { total: number; correct: number }>();

  answersList.forEach((ans) => {
    const tags = ans.question?.knowledge_tag || ['Chung'];
    tags.forEach((tag: string) => {
      const current = tagStatsMap.get(tag) || { total: 0, correct: 0 };
      current.total += 1;
      if (ans.isCorrect) current.correct += 1;
      tagStatsMap.set(tag, current);
    });
  });

  const tagAnalytics: { tag: string; total: number; correct: number; accuracy: number }[] = [];
  const weakTags: string[] = [];

  tagStatsMap.forEach((stat, tag) => {
    const accuracy = Math.round((stat.correct / stat.total) * 100);
    tagAnalytics.push({
      tag,
      total: stat.total,
      correct: stat.correct,
      accuracy,
    });

    if (accuracy < 50) {
      weakTags.push(tag);
    }
  });

  // Tìm bài học gợi ý cho các tag yếu (accuracy < 50%)
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, slug, skill, level_tag')
    .eq('status', 'published');

  const recommendedLessons: RecommendedLesson[] = [];
  if (lessons && weakTags.length > 0) {
    (lessons as RecommendedLesson[]).forEach((lesson) => {
      const match = weakTags.some(
        (tag) =>
          lesson.title.toLowerCase().includes(tag.toLowerCase()) ||
          lesson.skill.toLowerCase().includes(tag.toLowerCase())
      );
      if (match) {
        recommendedLessons.push(lesson);
      }
    });
  }

  return {
    attempt,
    answersList,
    tagAnalytics,
    weakTags,
    recommendedLessons,
  };
}
