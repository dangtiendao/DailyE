'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidateTaxonomyCache, TopicItem, LevelItem } from '@/lib/taxonomy';

// ------------------------------------------------------------------------------
// HELPER: KIỂM TRA QUYỀN ADMIN SERVER-SIDE
// ------------------------------------------------------------------------------
async function checkAdminAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Chưa đăng nhập. Vui lòng đăng nhập tài khoản Admin.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('access_level')
    .eq('id', user.id)
    .single();

  if (!profile || profile.access_level !== 'admin') {
    throw new Error('Bạn không có quyền Admin để thực hiện thao tác này.');
  }

  return { supabase, user, profile };
}

// ------------------------------------------------------------------------------
// 1. TRUY VẤN DỮ LIỆU TAXONOMY TỔNG QUAN (KÈM SỐ LƯỢNG NỘI DUNG LIÊN KẾT)
// ------------------------------------------------------------------------------

export async function getAdminTaxonomyData(): Promise<{
  success: boolean;
  topics: TopicItem[];
  levels: LevelItem[];
  error?: string;
}> {
  try {
    const { supabase } = await checkAdminAuth();

    // Lấy danh sách Topics
    const { data: rawTopics, error: topicsErr } = await supabase
      .from('topics')
      .select('*')
      .order('order_index', { ascending: true });

    if (topicsErr) throw new Error(topicsErr.message);

    // Lấy danh sách Levels
    const { data: rawLevels, error: levelsErr } = await supabase
      .from('levels')
      .select('*')
      .order('order_index', { ascending: true });

    if (levelsErr) throw new Error(levelsErr.message);

    // Thống kê nội dung gắn với từng Topic
    const { data: vocabTopics } = await supabase.from('vocabulary_items').select('topic');
    const { data: lessonTopics } = await supabase.from('lessons').select('topic');
    const { data: questionTopics } = await supabase.from('questions').select('topic');

    const topicVocabMap = new Map<string, number>();
    const topicLessonMap = new Map<string, number>();
    const topicQuestionMap = new Map<string, number>();

    (vocabTopics || []).forEach((v) => {
      if (v.topic) topicVocabMap.set(v.topic, (topicVocabMap.get(v.topic) || 0) + 1);
    });
    (lessonTopics || []).forEach((l) => {
      if (l.topic) topicLessonMap.set(l.topic, (topicLessonMap.get(l.topic) || 0) + 1);
    });
    (questionTopics || []).forEach((q) => {
      if (q.topic) topicQuestionMap.set(q.topic, (topicQuestionMap.get(q.topic) || 0) + 1);
    });

    const topics: TopicItem[] = (rawTopics || []).map((t) => ({
      ...t,
      vocab_count: topicVocabMap.get(t.code) || 0,
      lesson_count: topicLessonMap.get(t.code) || 0,
      question_count: topicQuestionMap.get(t.code) || 0,
    }));

    // Thống kê nội dung gắn với từng Level
    const { data: vocabLevels } = await supabase.from('vocabulary_items').select('level_tag');
    const { data: lessonLevels } = await supabase.from('lessons').select('level_tag');
    const { data: questionLevels } = await supabase.from('questions').select('level_tag');

    const levelVocabMap = new Map<string, number>();
    const levelLessonMap = new Map<string, number>();
    const levelQuestionMap = new Map<string, number>();

    (vocabLevels || []).forEach((v) => {
      if (v.level_tag) levelVocabMap.set(v.level_tag, (levelVocabMap.get(v.level_tag) || 0) + 1);
    });
    (lessonLevels || []).forEach((l) => {
      if (l.level_tag) levelLessonMap.set(l.level_tag, (levelLessonMap.get(l.level_tag) || 0) + 1);
    });
    (questionLevels || []).forEach((q) => {
      if (q.level_tag) levelQuestionMap.set(q.level_tag, (levelQuestionMap.get(q.level_tag) || 0) + 1);
    });

    const levels: LevelItem[] = (rawLevels || []).map((l) => ({
      ...l,
      vocab_count: levelVocabMap.get(l.code) || 0,
      lesson_count: levelLessonMap.get(l.code) || 0,
      question_count: levelQuestionMap.get(l.code) || 0,
    }));

    return { success: true, topics, levels };
  } catch (err) {
    return { success: false, topics: [], levels: [], error: (err as Error).message };
  }
}

// ------------------------------------------------------------------------------
// 2. ACTIONS QUẢN LÝ TOPICS (CREATE / UPDATE / TOGGLE / DELETE / MOVE)
// ------------------------------------------------------------------------------

export async function createTopic(input: {
  code: string;
  display_name: string;
  description?: string;
  order_index?: number;
}) {
  try {
    const { supabase, user } = await checkAdminAuth();

    const cleanCode = input.code.trim().toLowerCase();

    // Validate format code (a-z, 0-9, _)
    if (!/^[a-z0-9_]+$/.test(cleanCode)) {
      return {
        success: false,
        error: 'Mã Topic (code) chỉ được chứa chữ cái thường (a-z), chữ số (0-9) và dấu gạch dưới (_).',
      };
    }

    if (!input.display_name.trim()) {
      return { success: false, error: 'Tên hiển thị Topic không được để trống.' };
    }

    // Check duplicate code
    const { data: existing } = await supabase.from('topics').select('code').eq('code', cleanCode).single();
    if (existing) {
      return { success: false, error: `Mã Topic "${cleanCode}" đã tồn tại trong hệ thống.` };
    }

    const { error: insertErr } = await supabase.from('topics').insert({
      code: cleanCode,
      display_name: input.display_name.trim(),
      description: input.description?.trim() || null,
      order_index: input.order_index ?? 0,
      is_active: true,
    });

    if (insertErr) throw new Error(insertErr.message);

    // Ghi audit log
    await supabase.from('admin_action_logs').insert({
      admin_id: user.id,
      action_type: 'taxonomy_create_topic',
      content_type: 'topics',
      affected_ids: [cleanCode],
      payload: { code: cleanCode, display_name: input.display_name },
    });

    revalidateTaxonomyCache();

    return {
      success: true,
      message: `Đã tạo thành công Topic "${input.display_name}" (${cleanCode}).`,
      warning: 'Lưu ý: Topic mới cần tối thiểu 8 từ vựng ở trạng thái published mới mở được chế độ học ghép cặp (Matching).',
    };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function updateTopic(
  code: string,
  input: {
    display_name: string;
    description?: string;
    order_index?: number;
  }
) {
  try {
    const { supabase, user } = await checkAdminAuth();

    if (!input.display_name.trim()) {
      return { success: false, error: 'Tên hiển thị Topic không được để trống.' };
    }

    const { error: updateErr } = await supabase
      .from('topics')
      .update({
        display_name: input.display_name.trim(),
        description: input.description?.trim() || null,
        order_index: input.order_index ?? 0,
      })
      .eq('code', code);

    if (updateErr) throw new Error(updateErr.message);

    // Ghi audit log
    await supabase.from('admin_action_logs').insert({
      admin_id: user.id,
      action_type: 'taxonomy_update_topic',
      content_type: 'topics',
      affected_ids: [code],
      payload: { code, ...input },
    });

    revalidateTaxonomyCache();

    return { success: true, message: `Đã cập nhật Topic "${input.display_name}".` };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function toggleTopicActive(code: string, is_active: boolean) {
  try {
    const { supabase, user } = await checkAdminAuth();

    const { error } = await supabase.from('topics').update({ is_active }).eq('code', code);

    if (error) throw new Error(error.message);

    // Ghi audit log
    await supabase.from('admin_action_logs').insert({
      admin_id: user.id,
      action_type: 'taxonomy_toggle_topic',
      content_type: 'topics',
      affected_ids: [code],
      payload: { code, is_active },
    });

    revalidateTaxonomyCache();

    return {
      success: true,
      message: `Đã ${is_active ? 'bật hoạt động' : 'ẩn'} Topic "${code}".`,
    };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function deleteTopic(code: string) {
  try {
    const { supabase, user } = await checkAdminAuth();

    // 1. Đếm nội dung liên kết
    const { count: vocabCount } = await supabase
      .from('vocabulary_items')
      .select('*', { count: 'exact', head: true })
      .eq('topic', code);

    const { count: lessonCount } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('topic', code);

    const { count: questionCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('topic', code);

    const totalCount = (vocabCount || 0) + (lessonCount || 0) + (questionCount || 0);

    if (totalCount > 0) {
      return {
        success: false,
        error: `Không thể xóa Topic "${code}" vì đang có ${totalCount} bản ghi liên kết (${vocabCount || 0} từ vựng, ${lessonCount || 0} bài học, ${questionCount || 0} câu hỏi).`,
        canHide: true,
        counts: { vocabulary: vocabCount || 0, lessons: lessonCount || 0, questions: questionCount || 0 },
      };
    }

    // 2. Nếu rỗng -> Tiến hành xóa cứng
    const { error: deleteErr } = await supabase.from('topics').delete().eq('code', code);
    if (deleteErr) throw new Error(deleteErr.message);

    // Ghi audit log
    await supabase.from('admin_action_logs').insert({
      admin_id: user.id,
      action_type: 'taxonomy_delete_topic',
      content_type: 'topics',
      affected_ids: [code],
      payload: { code },
    });

    revalidateTaxonomyCache();

    return { success: true, message: `Đã xóa cứng Topic "${code}".` };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function moveTopicContent(
  fromCode: string,
  toCode: string,
  contentTypes: Array<'vocabulary' | 'lessons' | 'questions'>
) {
  try {
    const { supabase, user } = await checkAdminAuth();

    if (fromCode === toCode) {
      return { success: false, error: 'Topic nguồn và Topic đích không được trùng nhau.' };
    }

    if (!contentTypes || contentTypes.length === 0) {
      return { success: false, error: 'Vui lòng chọn ít nhất một loại nội dung để di chuyển.' };
    }

    // Verify topic đích phải tồn tại và is_active = true
    const { data: targetTopic } = await supabase
      .from('topics')
      .select('code, display_name, is_active')
      .eq('code', toCode)
      .single();

    if (!targetTopic) {
      return { success: false, error: `Topic đích "${toCode}" không tồn tại.` };
    }

    if (!targetTopic.is_active) {
      return { success: false, error: `Topic đích "${targetTopic.display_name}" đang bị ẩn, không thể nhận nội dung mới.` };
    }

    const moveVocab = contentTypes.includes('vocabulary');
    const moveLessons = contentTypes.includes('lessons');
    const moveQuestions = contentTypes.includes('questions');

    // Call PostgreSQL RPC function `move_topic_content` (chạy trong 1 Transaction block duy nhất)
    const { data: rpcData, error: rpcError } = await supabase.rpc('move_topic_content', {
      from_code: fromCode,
      to_code: toCode,
      move_vocab: moveVocab,
      move_lessons: moveLessons,
      move_questions: moveQuestions,
    });

    let moved = { vocabulary: 0, lessons: 0, questions: 0 };

    if (rpcError) {
      // Fallback nếu chưa chạy migration RPC trên DB
      console.warn('RPC move_topic_content gặp lỗi, fallback sang JS updates:', rpcError.message);

      if (moveVocab) {
        const { data: updatedVocab } = await supabase
          .from('vocabulary_items')
          .update({ topic: toCode })
          .eq('topic', fromCode)
          .select('id');
        moved.vocabulary = updatedVocab?.length || 0;
      }

      if (moveLessons) {
        const { data: updatedLessons } = await supabase
          .from('lessons')
          .update({ topic: toCode })
          .eq('topic', fromCode)
          .select('id');
        moved.lessons = updatedLessons?.length || 0;
      }

      if (moveQuestions) {
        const { data: updatedQuestions } = await supabase
          .from('questions')
          .update({ topic: toCode })
          .eq('topic', fromCode)
          .select('id');
        moved.questions = updatedQuestions?.length || 0;
      }
    } else if (rpcData) {
      const resObj = rpcData as { moved_vocab?: number; moved_lessons?: number; moved_questions?: number };
      moved = {
        vocabulary: resObj.moved_vocab || 0,
        lessons: resObj.moved_lessons || 0,
        questions: resObj.moved_questions || 0,
      };
    }

    // Ghi audit log
    await supabase.from('admin_action_logs').insert({
      admin_id: user.id,
      action_type: 'taxonomy_move_topic',
      content_type: 'topics',
      affected_ids: [fromCode, toCode],
      payload: { fromCode, toCode, contentTypes, moved },
    });

    revalidateTaxonomyCache();

    return {
      success: true,
      moved,
      message: `Đã di chuyển thành công ${moved.vocabulary} từ vựng, ${moved.lessons} bài học, ${moved.questions} câu hỏi từ "${fromCode}" sang "${targetTopic.display_name}".`,
    };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ------------------------------------------------------------------------------
// 3. ACTIONS QUẢN LÝ LEVELS (CREATE / UPDATE / TOGGLE / DELETE)
// ------------------------------------------------------------------------------

export async function createLevel(input: {
  code: string;
  display_name: string;
  order_index?: number;
}) {
  try {
    const { supabase, user } = await checkAdminAuth();

    const cleanCode = input.code.trim();

    if (!cleanCode) {
      return { success: false, error: 'Mã Level (code) không được để trống.' };
    }

    if (!input.display_name.trim()) {
      return { success: false, error: 'Tên hiển thị Level không được để trống.' };
    }

    // Check duplicate
    const { data: existing } = await supabase.from('levels').select('code').eq('code', cleanCode).single();
    if (existing) {
      return { success: false, error: `Mã Level "${cleanCode}" đã tồn tại trong hệ thống.` };
    }

    const { error: insertErr } = await supabase.from('levels').insert({
      code: cleanCode,
      display_name: input.display_name.trim(),
      order_index: input.order_index ?? 0,
      is_active: true,
    });

    if (insertErr) throw new Error(insertErr.message);

    // Ghi audit log
    await supabase.from('admin_action_logs').insert({
      admin_id: user.id,
      action_type: 'taxonomy_create_level',
      content_type: 'levels',
      affected_ids: [cleanCode],
      payload: { code: cleanCode, display_name: input.display_name },
    });

    revalidateTaxonomyCache();

    return { success: true, message: `Đã tạo thành công Level "${input.display_name}" (${cleanCode}).` };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function updateLevel(
  code: string,
  input: {
    display_name: string;
    order_index?: number;
  }
) {
  try {
    const { supabase, user } = await checkAdminAuth();

    if (!input.display_name.trim()) {
      return { success: false, error: 'Tên hiển thị Level không được để trống.' };
    }

    const { error: updateErr } = await supabase
      .from('levels')
      .update({
        display_name: input.display_name.trim(),
        order_index: input.order_index ?? 0,
      })
      .eq('code', code);

    if (updateErr) throw new Error(updateErr.message);

    // Ghi audit log
    await supabase.from('admin_action_logs').insert({
      admin_id: user.id,
      action_type: 'taxonomy_update_level',
      content_type: 'levels',
      affected_ids: [code],
      payload: { code, ...input },
    });

    revalidateTaxonomyCache();

    return { success: true, message: `Đã cập nhật Level "${input.display_name}".` };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function toggleLevelActive(code: string, is_active: boolean) {
  try {
    const { supabase, user } = await checkAdminAuth();

    const { error } = await supabase.from('levels').update({ is_active }).eq('code', code);

    if (error) throw new Error(error.message);

    // Ghi audit log
    await supabase.from('admin_action_logs').insert({
      admin_id: user.id,
      action_type: 'taxonomy_toggle_level',
      content_type: 'levels',
      affected_ids: [code],
      payload: { code, is_active },
    });

    revalidateTaxonomyCache();

    return {
      success: true,
      message: `Đã ${is_active ? 'bật hoạt động' : 'ẩn'} Level "${code}".`,
    };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function deleteLevel(code: string) {
  try {
    const { supabase, user } = await checkAdminAuth();

    // Đếm nội dung liên kết
    const { count: vocabCount } = await supabase
      .from('vocabulary_items')
      .select('*', { count: 'exact', head: true })
      .eq('level_tag', code);

    const { count: lessonCount } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('level_tag', code);

    const { count: questionCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('level_tag', code);

    const totalCount = (vocabCount || 0) + (lessonCount || 0) + (questionCount || 0);

    if (totalCount > 0) {
      return {
        success: false,
        error: `Không thể xóa Level "${code}" vì đang có ${totalCount} bản ghi liên kết (${vocabCount || 0} từ vựng, ${lessonCount || 0} bài học, ${questionCount || 0} câu hỏi). Hãy chuyển sang ẩn trạng thái.`,
        counts: { vocabulary: vocabCount || 0, lessons: lessonCount || 0, questions: questionCount || 0 },
      };
    }

    const { error: deleteErr } = await supabase.from('levels').delete().eq('code', code);
    if (deleteErr) throw new Error(deleteErr.message);

    // Ghi audit log
    await supabase.from('admin_action_logs').insert({
      admin_id: user.id,
      action_type: 'taxonomy_delete_level',
      content_type: 'levels',
      affected_ids: [code],
      payload: { code },
    });

    revalidateTaxonomyCache();

    return { success: true, message: `Đã xóa cứng Level "${code}".` };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
