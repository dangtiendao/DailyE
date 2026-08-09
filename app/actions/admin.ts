"use server";

import { createClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

// Định nghĩa các Interface TypeScript chuẩn cho dữ liệu Admin Actions
export interface UpsertQuestionInput {
  id?: string;
  code: string;
  exam_part:
    | "part1"
    | "part2"
    | "part3"
    | "part4"
    | "part5"
    | "part6"
    | "part7";
  question_text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: "A" | "B" | "C" | "D";
  explanation?: string | null;
  knowledge_tag?: string[];
  topic?: string | null;
  difficulty?: "easy" | "medium" | "hard";
  image_url?: string | null;
  audio_url?: string | null;
  status?: "draft" | "published";
}

export interface UpsertLessonInput {
  id?: string;
  title: string;
  slug: string;
  content: string;
  skill: "vocabulary" | "grammar" | "listening" | "reading" | "strategy";
  level_tag?: string | null;
  status?: "draft" | "published";
  order_index?: number;
}

export interface ValidQuestionRow {
  code: string;
  exam_part: string;
  question_text: string;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: string;
  explanation: string | null;
  knowledge_tag: string[];
  topic: string | null;
  difficulty: string;
  image_url: string | null;
  audio_url: string | null;
  status: "draft" | "published";
}

export interface ParsedImportRow {
  rowIndex: number;
  data?: ValidQuestionRow;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DashboardStatsResult {
  totalQuestions: number;
  totalLessons: number;
  totalUsers: number;
  latestImport: {
    id: string;
    filename: string;
    total_rows: number;
    success_rows: number;
    error_rows: number;
    created_at: string;
  } | null;
}

// Helper kiểm tra quyền Admin phía Server
async function checkAdminAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Chưa đăng nhập. Vui lòng đăng nhập tài khoản Admin.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("access_level")
    .eq("id", user.id)
    .single();

  if (!profile || profile.access_level !== "admin") {
    throw new Error("Bạn không có quyền Admin để thực hiện thao tác này.");
  }

  return { supabase, user, profile };
}

// ------------------------------------------------------------------------------
// 1. ADMIN DASHBOARD STATS
// ------------------------------------------------------------------------------
export async function getAdminDashboardStats(): Promise<DashboardStatsResult> {
  const { supabase } = await checkAdminAuth();

  const [
    { count: totalQuestions },
    { count: totalLessons },
    { count: totalUsers },
    { data: latestImports },
  ] = await Promise.all([
    supabase.from("questions").select("*", { count: "exact", head: true }),
    supabase.from("lessons").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("content_imports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  return {
    totalQuestions: totalQuestions || 0,
    totalLessons: totalLessons || 0,
    totalUsers: totalUsers || 0,
    latestImport:
      latestImports && latestImports.length > 0
        ? (latestImports[0] as DashboardStatsResult["latestImport"])
        : null,
  };
}

// ------------------------------------------------------------------------------
// 2. QUẢN LÝ CÂU HỎI (QUESTIONS CRUD & FILTERS)
// ------------------------------------------------------------------------------
export async function getQuestions(filters?: {
  examPart?: string;
  status?: string;
  levelTag?: string;
  search?: string;
}) {
  const { supabase } = await checkAdminAuth();

  let query = supabase
    .from("questions")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.examPart && filters.examPart !== "all") {
    query = query.eq("exam_part", filters.examPart);
  }
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.levelTag && filters.levelTag !== "all") {
    query = query.eq("level_tag", filters.levelTag);
  }
  if (filters?.search && filters.search.trim() !== "") {
    const searchTerm = `%${filters.search.trim()}%`;
    query = query.or(
      `code.ilike.${searchTerm},question_text.ilike.${searchTerm}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Lỗi đọc danh sách câu hỏi: ${error.message}`);
  }

  return data || [];
}

export async function toggleQuestionStatus(id: string, currentStatus: string) {
  const { supabase, user } = await checkAdminAuth();

  const newStatus = currentStatus === "published" ? "draft" : "published";

  const { error } = await supabase
    .from("questions")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("admin_action_logs").insert({
    admin_id: user.id,
    action_type: "single_update_status",
    content_type: "questions",
    affected_ids: [id],
    payload: { newStatus },
  });

  return { success: true, newStatus };
}

export async function deleteQuestion(id: string) {
  const { supabase, user } = await checkAdminAuth();

  const { error } = await supabase.from("questions").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("admin_action_logs").insert({
    admin_id: user.id,
    action_type: "single_delete",
    content_type: "questions",
    affected_ids: [id],
    payload: {},
  });

  return { success: true };
}

export async function upsertQuestion(inputData: UpsertQuestionInput) {
  const { supabase, user } = await checkAdminAuth();

  const payload = {
    code: inputData.code,
    exam_part: inputData.exam_part,
    question_text: inputData.question_text,
    options: inputData.options,
    correct_answer: inputData.correct_answer,
    explanation: inputData.explanation || null,
    knowledge_tag: inputData.knowledge_tag || [],
    topic: inputData.topic || null,
    difficulty: inputData.difficulty || "medium",
    image_url: inputData.image_url || null,
    audio_url: inputData.audio_url || null,
    status: inputData.status || "draft",
    updated_at: new Date().toISOString(),
  };

  if (inputData.id) {
    const { error } = await supabase
      .from("questions")
      .update(payload)
      .eq("id", inputData.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("questions").insert(payload);
    if (error) return { success: false, error: error.message };
  }

  await supabase.from("admin_action_logs").insert({
    admin_id: user.id,
    action_type: inputData.id ? "single_update" : "single_create",
    content_type: "questions",
    affected_ids: [inputData.id || inputData.code],
    payload: { code: inputData.code, exam_part: inputData.exam_part },
  });

  return { success: true };
}

// ------------------------------------------------------------------------------
// 3. QUẢN LÝ BÀI HỌC (LESSONS CRUD)
// ------------------------------------------------------------------------------
export async function getLessons() {
  const { supabase } = await checkAdminAuth();

  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .order("order_index", { ascending: true });

  if (error) {
    throw new Error(`Lỗi lấy danh sách bài học: ${error.message}`);
  }

  return data || [];
}

export async function upsertLesson(inputData: UpsertLessonInput) {
  const { supabase, user } = await checkAdminAuth();

  const payload = {
    title: inputData.title,
    slug: inputData.slug,
    content: inputData.content,
    skill: inputData.skill,
    level_tag: inputData.level_tag || null,
    status: inputData.status || "draft",
    order_index: inputData.order_index || 0,
    updated_at: new Date().toISOString(),
  };

  if (inputData.id) {
    const { error } = await supabase
      .from("lessons")
      .update(payload)
      .eq("id", inputData.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("lessons").insert(payload);
    if (error) return { success: false, error: error.message };
  }

  await supabase.from("admin_action_logs").insert({
    admin_id: user.id,
    action_type: inputData.id ? "single_update" : "single_create",
    content_type: "lessons",
    affected_ids: [inputData.id || inputData.slug],
    payload: { title: inputData.title, skill: inputData.skill },
  });

  return { success: true };
}

export async function deleteLesson(id: string) {
  const { supabase, user } = await checkAdminAuth();

  const { error } = await supabase.from("lessons").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("admin_action_logs").insert({
    admin_id: user.id,
    action_type: "single_delete",
    content_type: "lessons",
    affected_ids: [id],
    payload: {},
  });

  return { success: true };
}

// ------------------------------------------------------------------------------
// 4. PARSE & COMMIT EXCEL IMPORT (SERVER ACTION + SHEETJS + ZOD VALIDATION)
// ------------------------------------------------------------------------------
export async function parseExcelImport(formData: FormData) {
  const { supabase } = await checkAdminAuth();

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "Vui lòng chọn file Excel / CSV" };
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Đọc file Excel bằng SheetJS ngay trên Server
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] =
    XLSX.utils.sheet_to_json(worksheet);

  if (!rawRows || rawRows.length === 0) {
    return {
      success: false,
      error: "File Excel rỗng, không tìm thấy dòng dữ liệu nào",
    };
  }

  // Lấy tất cả các mã question code đã tồn tại trong DB để check trùng
  const { data: dbQuestions } = await supabase.from("questions").select("code");
  const existingDbCodes = new Set(
    (dbQuestions || []).map((q) => q.code.toUpperCase()),
  );
  const seenFileCodes = new Set<string>();

  const validParts = [
    "part1",
    "part2",
    "part3",
    "part4",
    "part5",
    "part6",
    "part7",
  ];
  const validAnswers = ["A", "B", "C", "D"];

  const results: ParsedImportRow[] = [];
  const validRowsToInsert: ValidQuestionRow[] = [];

  rawRows.forEach((row, idx) => {
    const rowIndex = idx + 2; // Hàng 1 là header
    const errors: string[] = [];
    const warnings: string[] = [];

    const code = String(row.code || "").trim();
    const examPart = String(row.exam_part || "")
      .trim()
      .toLowerCase();
    const questionText = String(row.question_text || "").trim();
    const optionA = String(row.optionA || "").trim();
    const optionB = String(row.optionB || "").trim();
    const optionC = String(row.optionC || "").trim();
    const optionD = String(row.optionD || "").trim();
    const correctAnswer = String(row.correct_answer || "")
      .trim()
      .toUpperCase();
    const explanation = row.explanation ? String(row.explanation).trim() : "";
    const knowledgeTagStr = row.knowledge_tag
      ? String(row.knowledge_tag).trim()
      : "";
    const topic = row.topic ? String(row.topic).trim() : "";
    const difficulty = row.difficulty
      ? String(row.difficulty).trim().toLowerCase()
      : "medium";
    const imageUrl = row.image_url ? String(row.image_url).trim() : null;
    const audioUrl = row.audio_url ? String(row.audio_url).trim() : null;

    // Validate Code
    if (!code) {
      errors.push("Mã câu hỏi (code) không được để trống");
    } else if (existingDbCodes.has(code.toUpperCase())) {
      errors.push(`Mã câu hỏi '${code}' đã tồn tại trong hệ thống (DB)`);
    } else if (seenFileCodes.has(code.toUpperCase())) {
      errors.push(
        `Mã câu hỏi '${code}' bị lặp lại nhiều lần trong file Excel này`,
      );
    } else {
      seenFileCodes.add(code.toUpperCase());
    }

    // Validate Exam Part
    if (!examPart || !validParts.includes(examPart)) {
      errors.push(
        `Part bài thi '${examPart}' không hợp lệ (Phải từ part1 đến part7)`,
      );
    }

    // Validate Question Text
    if (!questionText) {
      errors.push("Nội dung câu hỏi (question_text) không được để trống");
    }

    // Validate Options
    if (!optionA || !optionB || !optionC || !optionD) {
      errors.push(
        "Cần điền đầy đủ 4 lựa chọn (optionA, optionB, optionC, optionD)",
      );
    }

    // Validate Correct Answer
    if (!correctAnswer || !validAnswers.includes(correctAnswer)) {
      errors.push(
        `Đáp án đúng '${correctAnswer}' không hợp lệ (Phải là A, B, C hoặc D)`,
      );
    }

    // Warning cho Part 3 & Part 4 nếu thiếu audio_url (Giai đoạn text-only warning)
    if ((examPart === "part3" || examPart === "part4") && !audioUrl) {
      warnings.push("Cảnh báo: Câu nghe Part 3/4 chưa có URL file Audio");
    }

    const isValid = errors.length === 0;

    const rowData: ValidQuestionRow = {
      code,
      exam_part: examPart,
      question_text: questionText,
      options: { A: optionA, B: optionB, C: optionC, D: optionD },
      correct_answer: correctAnswer,
      explanation: explanation || null,
      knowledge_tag: knowledgeTagStr
        ? knowledgeTagStr.split(",").map((s) => s.trim())
        : [],
      topic: topic || null,
      difficulty: ["easy", "medium", "hard"].includes(difficulty)
        ? difficulty
        : "medium",
      image_url: imageUrl,
      audio_url: audioUrl,
      status: "draft",
    };

    if (isValid) {
      validRowsToInsert.push(rowData);
    }

    results.push({
      rowIndex,
      data: rowData,
      isValid,
      errors,
      warnings,
    });
  });

  return {
    success: true,
    filename: file.name,
    totalRows: rawRows.length,
    validCount: validRowsToInsert.length,
    invalidCount: rawRows.length - validRowsToInsert.length,
    results,
    validRowsToInsert,
  };
}

export async function commitExcelImport(
  validRows: ValidQuestionRow[],
  filename: string,
) {
  const { supabase, user } = await checkAdminAuth();

  if (!validRows || validRows.length === 0) {
    return { success: false, error: "Không có dòng hợp lệ nào để nhập" };
  }

  // 1. Chèn danh sách câu hỏi vào bảng questions với status='draft'
  const { error: insertError } = await supabase
    .from("questions")
    .insert(validRows);

  if (insertError) {
    return { success: false, error: `Lỗi ghi vào DB: ${insertError.message}` };
  }

  // 2. Ghi nhật ký vào bảng content_imports
  const { error: logError } = await supabase.from("content_imports").insert({
    admin_id: user.id,
    filename,
    total_rows: validRows.length,
    success_rows: validRows.length,
    error_rows: 0,
    error_detail: [],
  });

  if (logError) {
    console.error("Lỗi lưu nhật ký import:", logError);
  }

  return { success: true, count: validRows.length };
}

// ------------------------------------------------------------------------------
// 5. PARSE & COMMIT EXCEL IMPORT TỪ VỰNG TOEIC
// ------------------------------------------------------------------------------

export interface ParsedVocabImportRow {
  rowIndex: number;
  word: string;
  wordType: string;
  meaningVi: string;
  example: string;
  exampleBlank: string | null;
  topic: string;
  levelTag: string;
  audioUrl: string | null;
  isValid: boolean;
  isDbDuplicate?: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidVocabRow {
  word: string;
  word_type: string;
  meaning_vi: string;
  example: string;
  example_blank: string | null;
  topic: string;
  level_tag: string;
  audio_url: string | null;
  status: 'draft';
}

export async function parseVocabExcelImport(formData: FormData) {
  const { supabase } = await checkAdminAuth();

  const file = formData.get('file') as File;
  if (!file) {
    return { success: false, error: 'Vui lòng chọn file Excel / CSV' };
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { raw: false });

  if (!rawRows || rawRows.length === 0) {
    return {
      success: false,
      error: 'File Excel/CSV rỗng, không tìm thấy dòng dữ liệu nào',
    };
  }

  // 1. Lấy danh sách vocab_topics hợp lệ từ DB
  const { data: dbTopics } = await supabase.from('vocab_topics').select('code');
  const validTopicCodes = (dbTopics || []).map((t) => t.code.toLowerCase());

  // 2. Lấy danh sách các cặp (word, word_type, topic) đã tồn tại trong DB
  const { data: dbVocab } = await supabase.from('vocabulary_items').select('word, word_type, topic');
  const dbVocabKeys = new Set(
    (dbVocab || []).map((v) => `${v.word.trim().toLowerCase()}_${(v.word_type || '').toLowerCase()}_${v.topic.toLowerCase()}`)
  );

  const seenFileKeys = new Set<string>();
  const validWordTypes = ['n', 'v', 'adj', 'adv', 'phrase'];
  const validLevelTags = ['350+', '500+', '650+', '800+', 'A2', 'B1', 'B2', 'C1'];

  const results: ParsedVocabImportRow[] = [];
  const validRowsToInsert: ValidVocabRow[] = [];

  rawRows.forEach((row, idx) => {
    const rowIndex = idx + 2;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Ép kiểu tất cả sang TEXT String
    const word = String(row.word || '').trim();
    const wordType = String(row.word_type || '').trim().toLowerCase();
    const meaningVi = String(row.meaning_vi || '').trim();
    const example = String(row.example || '').trim();
    const exampleBlank = row.example_blank ? String(row.example_blank).trim() : null;
    const topic = String(row.topic || '').trim().toLowerCase();
    const levelTag = row.level_tag ? String(row.level_tag).trim() : '500+';
    const audioUrl = row.audio_url ? String(row.audio_url).trim() : null;

    // Validate Word
    if (!word) {
      errors.push('Từ vựng (word) không được để trống');
    }

    // Validate Word Type
    if (!wordType || !validWordTypes.includes(wordType)) {
      errors.push(`Loại từ (word_type) phải là một trong: ${validWordTypes.join(', ')}`);
    }

    // Validate Meaning Vi
    if (!meaningVi) {
      errors.push('Nghĩa tiếng Việt (meaning_vi) không được để trống');
    }

    // Validate Example & Warning if missing word
    if (!example) {
      errors.push('Câu ví dụ (example) không được để trống');
    } else if (word && !example.toLowerCase().includes(word.toLowerCase())) {
      warnings.push(`Câu ví dụ chưa chứa từ gốc "${word}"`);
    }

    // Validate Topic
    if (!topic) {
      errors.push('Chủ đề (topic) không được để trống');
    } else if (!validTopicCodes.includes(topic)) {
      // Gợi ý topic gần đúng
      const closest = validTopicCodes.find((t) => t.includes(topic) || topic.includes(t)) || 'office';
      errors.push(`Mã chủ đề "${topic}" không tồn tại. Gợi ý: "${closest}"`);
    }

    // Check trùng trong file
    const fileKey = `${word.toLowerCase()}_${wordType}_${topic}`;
    if (seenFileKeys.has(fileKey)) {
      errors.push(`Từ vựng (${word}, ${wordType}, ${topic}) bị lặp lại trong file`);
    } else {
      seenFileKeys.add(fileKey);
    }

    // Check trùng với DB
    const isDbDuplicate = dbVocabKeys.has(fileKey);
    if (isDbDuplicate) {
      warnings.push(`Từ vựng (${word}, ${wordType}, ${topic}) đã có trong Database`);
    }

    const isValid = errors.length === 0;

    if (isValid) {
      validRowsToInsert.push({
        word,
        word_type: wordType,
        meaning_vi: meaningVi,
        example,
        example_blank: exampleBlank,
        topic,
        level_tag: levelTag,
        audio_url: audioUrl,
        status: 'draft',
      });
    }

    results.push({
      rowIndex,
      word,
      wordType,
      meaningVi,
      example,
      exampleBlank,
      topic,
      levelTag,
      audioUrl,
      isValid,
      isDbDuplicate,
      errors,
      warnings,
    });
  });

  return {
    success: true,
    filename: file.name,
    totalRows: rawRows.length,
    validCount: validRowsToInsert.length,
    invalidCount: rawRows.length - validRowsToInsert.length,
    results,
    validRowsToInsert,
  };
}

export async function commitVocabExcelImport(
  validRows: ValidVocabRow[],
  filename: string
) {
  const { supabase, user } = await checkAdminAuth();

  if (!validRows || validRows.length === 0) {
    return { success: false, error: 'Không có dòng từ vựng hợp lệ nào để nhập' };
  }

  const { error: insertError } = await supabase
    .from('vocabulary_items')
    .upsert(validRows, { onConflict: 'word,word_type,topic' });

  if (insertError) {
    return { success: false, error: `Lỗi ghi từ vựng vào DB: ${insertError.message}` };
  }

  await supabase.from('content_imports').insert({
    admin_id: user.id,
    filename,
    total_rows: validRows.length,
    success_rows: validRows.length,
    error_rows: 0,
    error_detail: [],
  });

  return { success: true, count: validRows.length };
}

// ------------------------------------------------------------------------------
// 6. VOCABULARY CRUD DISPATCHERS (CHO ADMIN CONTENT MANAGEMENT)
// ------------------------------------------------------------------------------

export async function getAdminVocabItems(filters?: { topic?: string; level?: string; status?: string }) {
  const { supabase } = await checkAdminAuth();

  let query = supabase
    .from('vocabulary_items')
    .select('*, vocab_topics(display_name)')
    .order('created_at', { ascending: false });

  if (filters?.topic && filters.topic !== 'all') {
    query = query.eq('topic', filters.topic);
  }
  if (filters?.level && filters.level !== 'all') {
    query = query.eq('level_tag', filters.level);
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };

  return { success: true, items: data || [] };
}

export async function toggleVocabStatus(id: number, currentStatus: string) {
  const { supabase, user } = await checkAdminAuth();

  const newStatus = currentStatus === 'published' ? 'draft' : 'published';

  const { error } = await supabase
    .from('vocabulary_items')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  await supabase.from("admin_action_logs").insert({
    admin_id: user.id,
    action_type: "single_update_status",
    content_type: "vocabulary",
    affected_ids: [id],
    payload: { newStatus },
  });

  return { success: true, newStatus };
}

export async function upsertAdminVocabItem(itemData: {
  id?: number;
  word: string;
  word_type: string;
  meaning_vi: string;
  example?: string;
  example_blank?: string;
  topic: string;
  level_tag?: string;
  status: 'draft' | 'published';
}) {
  const { supabase, user } = await checkAdminAuth();

  if (itemData.id) {
    const { error } = await supabase
      .from('vocabulary_items')
      .update({
        word: itemData.word,
        word_type: itemData.word_type,
        meaning_vi: itemData.meaning_vi,
        example: itemData.example || null,
        example_blank: itemData.example_blank || null,
        topic: itemData.topic,
        level_tag: itemData.level_tag || '500+',
        status: itemData.status,
      })
      .eq('id', itemData.id);

    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from('vocabulary_items').insert({
      word: itemData.word,
      word_type: itemData.word_type,
      meaning_vi: itemData.meaning_vi,
      example: itemData.example || null,
      example_blank: itemData.example_blank || null,
      topic: itemData.topic,
      level_tag: itemData.level_tag || '500+',
      status: itemData.status,
    });

    if (error) return { success: false, error: error.message };
  }

  await supabase.from("admin_action_logs").insert({
    admin_id: user.id,
    action_type: itemData.id ? "single_update" : "single_create",
    content_type: "vocabulary",
    affected_ids: [itemData.id || itemData.word],
    payload: { word: itemData.word, topic: itemData.topic },
  });

  return { success: true };
}

export async function deleteAdminVocabItem(id: number) {
  const { supabase, user } = await checkAdminAuth();

  const { error } = await supabase.from('vocabulary_items').delete().eq('id', id);

  if (error) return { success: false, error: error.message };

  await supabase.from("admin_action_logs").insert({
    admin_id: user.id,
    action_type: "single_delete",
    content_type: "vocabulary",
    affected_ids: [id],
    payload: {},
  });

  return { success: true };
}
