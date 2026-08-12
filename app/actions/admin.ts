"use server";

import { createClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";
import matter from "gray-matter";
import {
  getActiveTopics,
  getAllTopics,
  getActiveLevels,
  validateTopicCode,
  validateLevelCode,
  revalidateTaxonomyCache,
} from "@/lib/taxonomy";

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
    .select("*, topics(display_name)")
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

  // 1. Lấy danh sách active topics & levels từ DB
  const [activeTopics, allTopics, activeLevels] = await Promise.all([
    getActiveTopics(),
    getAllTopics(),
    getActiveLevels(),
  ]);

  const activeTopicCodes = activeTopics.map((t) => t.code.toLowerCase());
  const allTopicMap = new Map(allTopics.map((t) => [t.code.toLowerCase(), t]));
  const validLevelCodes = activeLevels.map((l) => l.code);

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
    const topic = row.topic ? String(row.topic).trim().toLowerCase() : "";
    const levelTag = row.level_tag ? String(row.level_tag).trim() : null;
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

    // Validate Level Tag động (nếu có truyền)
    if (levelTag && !validLevelCodes.includes(levelTag)) {
      errors.push(`Trình độ (level_tag) '${levelTag}' không hợp lệ hoặc đang bị ẩn. Các trình độ hợp lệ: ${validLevelCodes.join(', ')}`);
    }

    // Validate Topic động (cho phép ô trống NULL, nhưng nếu điền phải thuộc bảng topics và active)
    if (topic) {
      const topicObj = allTopicMap.get(topic);
      if (!topicObj) {
        const closest = activeTopicCodes.find((t) => t.includes(topic) || topic.includes(t)) || activeTopicCodes[0] || 'office';
        errors.push(`Mã chủ đề '${topic}' không tồn tại. Gợi ý: '${closest}'`);
      } else if (!topicObj.is_active) {
        errors.push(`Chủ đề '${topicObj.display_name}' (${topic}) đang bị ẩn, hãy bật lại hoặc chọn chủ đề khác`);
      }
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

  // 1. Lấy danh sách topics & levels hợp lệ từ DB
  const [activeTopics, allTopics, activeLevels] = await Promise.all([
    getActiveTopics(),
    getAllTopics(),
    getActiveLevels(),
  ]);

  const activeTopicCodes = activeTopics.map((t) => t.code.toLowerCase());
  const allTopicMap = new Map(allTopics.map((t) => [t.code.toLowerCase(), t]));
  const validLevelCodes = activeLevels.map((l) => l.code);

  // 2. Lấy danh sách các cặp (word, word_type, topic) đã tồn tại trong DB
  const { data: dbVocab } = await supabase.from('vocabulary_items').select('word, word_type, topic');
  const dbVocabKeys = new Set(
    (dbVocab || []).map((v) => `${v.word.trim().toLowerCase()}_${(v.word_type || '').toLowerCase()}_${v.topic.toLowerCase()}`)
  );

  const seenFileKeys = new Set<string>();
  const validWordTypes = ['n', 'v', 'adj', 'adv', 'phrase'];

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
    const levelTag = row.level_tag ? String(row.level_tag).trim() : (validLevelCodes[0] || '500+');
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

    // Validate Level Tag động
    if (row.level_tag && !validLevelCodes.includes(levelTag)) {
      errors.push(`Trình độ (level_tag) "${row.level_tag}" không hợp lệ hoặc đang bị ẩn. Các trình độ hợp lệ: ${validLevelCodes.join(', ')}`);
    }

    // Validate Topic động (kiểm tra tồn tại và ẩn/hiện)
    if (!topic) {
      errors.push('Chủ đề (topic) không được để trống');
    } else {
      const topicObj = allTopicMap.get(topic);
      if (!topicObj) {
        const closest = activeTopicCodes.find((t) => t.includes(topic) || topic.includes(t)) || activeTopicCodes[0] || 'office';
        errors.push(`Mã chủ đề "${topic}" không tồn tại. Gợi ý: "${closest}"`);
      } else if (!topicObj.is_active) {
        errors.push(`Chủ đề "${topicObj.display_name}" (${topic}) đang bị ẩn, hãy bật lại hoặc chọn chủ đề khác`);
      }
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

// ------------------------------------------------------------------------------
// 7. PARSE & COMMIT IMPORT BÀI HỌC (.MD + YAML FRONTMATTER)
// ------------------------------------------------------------------------------

export interface ParsedLessonImportRow {
  filename: string;
  title: string;
  slug: string;
  skill: string;
  levelTag: string;
  topic: string | null;
  orderIndex: number;
  content: string;
  isValid: boolean;
  isDbDuplicate: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidLessonImportRow {
  title: string;
  slug: string;
  content: string;
  skill: "vocabulary" | "grammar" | "listening" | "reading" | "strategy";
  level_tag: string;
  topic: string | null;
  order_index: number;
  status: "draft";
}

export async function parseLessonsImport(formData: FormData) {
  const { supabase } = await checkAdminAuth();

  const files = formData.getAll("files") as File[];
  if (!files || files.length === 0) {
    return {
      success: false,
      error: "Vui lòng chọn ít nhất một file Markdown (.md) để tải lên.",
    };
  }

  if (files.length > 50) {
    return {
      success: false,
      error: "Giới hạn tối đa 50 file .md mỗi lần import.",
    };
  }

  // Lấy danh sách slug hiện có trong DB
  const { data: dbLessons } = await supabase.from("lessons").select("slug");
  const existingDbSlugs = new Set((dbLessons || []).map((l) => l.slug.toLowerCase()));

  const seenFileSlugs = new Set<string>();
  const validSkills = ["vocabulary", "grammar", "listening", "reading", "strategy"];

  const results: ParsedLessonImportRow[] = [];
  const validRowsToInsert: ValidLessonImportRow[] = [];

  for (const file of files) {
    const filename = file.name;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (file.size > 200 * 1024) {
      errors.push("Kích thước file vượt quá 200KB");
    }

    let rawText = "";
    try {
      rawText = await file.text();
    } catch {
      errors.push("Không thể đọc nội dung file .md");
    }

    let frontmatterData: Record<string, any> = {};
    let markdownContent = "";

    if (rawText) {
      try {
        const parsed = matter(rawText);
        frontmatterData = parsed.data || {};
        markdownContent = parsed.content ? parsed.content.trim() : "";
      } catch (err) {
        errors.push(`Lỗi cú pháp YAML frontmatter: ${(err as Error).message}`);
      }
    }

    const title = String(frontmatterData.title || "").trim();
    const slug = String(frontmatterData.slug || "").trim().toLowerCase();
    const skill = String(frontmatterData.skill || "").trim().toLowerCase();
    const levelTag = String(frontmatterData.level_tag || "").trim();
    const topicRaw = frontmatterData.topic ? String(frontmatterData.topic).trim().toLowerCase() : null;
    const orderIndex = Number(frontmatterData.order_index) || 0;

    // 1. Validate Title
    if (!title) {
      errors.push("Tiêu đề bài học (title) không được để trống trong Frontmatter");
    }

    // 2. Validate Slug
    if (!slug) {
      errors.push("Mã định danh (slug) không được để trống trong Frontmatter");
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      errors.push(`Mã slug "${slug}" không hợp lệ (Chỉ gồm chữ thường a-z, chữ số 0-9 và dấu gạch ngang -)`);
    } else if (seenFileSlugs.has(slug)) {
      errors.push(`Mã slug "${slug}" bị lặp lại trong lô file tải lên này`);
    } else {
      seenFileSlugs.add(slug);
    }

    const isDbDuplicate = !!slug && existingDbSlugs.has(slug);
    if (isDbDuplicate) {
      warnings.push(`Mã slug "${slug}" đã tồn tại trong Database. Khi commit sẽ ghi đè nội dung bài học cũ.`);
    }

    // 3. Validate Skill
    if (!skill || !validSkills.includes(skill)) {
      errors.push(`Kỹ năng (skill) "${skill}" không hợp lệ. Phải là một trong: ${validSkills.join(", ")}`);
    }

    // 4. Validate Level Tag động
    if (!levelTag) {
      errors.push("Trình độ (level_tag) không được để trống trong Frontmatter");
    } else {
      const levelCheck = await validateLevelCode(levelTag, { allowInactive: false });
      if (!levelCheck.isValid) {
        errors.push(levelCheck.error || `Trình độ (level_tag) "${levelTag}" không hợp lệ hoặc đang bị ẩn`);
      }
    }

    // 5. Validate Topic động (tùy chọn)
    let finalTopic: string | null = null;
    if (topicRaw) {
      const topicCheck = await validateTopicCode(topicRaw, { allowInactive: false });
      if (!topicCheck.isValid) {
        errors.push(topicCheck.error || `Chủ đề (topic) "${topicRaw}" không hợp lệ hoặc đang bị ẩn`);
      } else {
        finalTopic = topicRaw;
      }
    }

    // 6. Validate Content Markdown
    if (!markdownContent) {
      errors.push("Nội dung bài học (Markdown) rỗng sau phần Frontmatter");
    } else if (markdownContent.length < 200) {
      warnings.push("Cảnh báo: Nội dung bài học khá ngắn (dưới 200 ký tự)");
    }

    const isValid = errors.length === 0;

    const rowResult: ParsedLessonImportRow = {
      filename,
      title,
      slug,
      skill,
      levelTag,
      topic: finalTopic,
      orderIndex,
      content: markdownContent,
      isValid,
      isDbDuplicate,
      errors,
      warnings,
    };

    results.push(rowResult);

    if (isValid) {
      validRowsToInsert.push({
        title,
        slug,
        content: markdownContent,
        skill: skill as any,
        level_tag: levelTag,
        topic: finalTopic,
        order_index: orderIndex,
        status: "draft",
      });
    }
  }

  return {
    success: true,
    batchName: `batch_lessons_${files.length}_files`,
    totalFiles: files.length,
    validCount: validRowsToInsert.length,
    errorCount: results.filter((r) => !r.isValid).length,
    warningCount: results.filter((r) => r.warnings.length > 0).length,
    results,
    validRowsToInsert,
  };
}

export async function commitLessonsImport(
  validRows: ValidLessonImportRow[],
  filename: string
) {
  const { supabase, user } = await checkAdminAuth();

  if (!validRows || validRows.length === 0) {
    return { success: false, error: "Không có file bài học hợp lệ nào để nhập" };
  }

  // Upsert vào bảng lessons theo slug
  const { error: insertError } = await supabase
    .from("lessons")
    .upsert(validRows, { onConflict: "slug" });

  if (insertError) {
    return { success: false, error: `Lỗi ghi bài học vào DB: ${insertError.message}` };
  }

  // Ghi nhật ký vào content_imports
  await supabase.from("content_imports").insert({
    admin_id: user.id,
    filename: filename || `batch_lessons_${validRows.length}_files`,
    total_rows: validRows.length,
    success_rows: validRows.length,
    error_rows: 0,
    error_detail: [],
  });

  // Ghi audit log
  await supabase.from("admin_action_logs").insert({
    admin_id: user.id,
    action_type: "content_import_lessons",
    content_type: "lessons",
    affected_ids: validRows.map((r) => r.slug),
    payload: { filename, count: validRows.length },
  });

  revalidateTaxonomyCache();

  return { success: true, count: validRows.length };
}

// ------------------------------------------------------------------------------
// 8. PARSE & COMMIT IMPORT LESSON_QUESTIONS (LIÊN KẾT BÀI HỌC ↔ CÂU HỎI)
// ------------------------------------------------------------------------------

export interface ParsedLessonQuestionRow {
  rowIndex: number;
  lessonSlug: string;
  questionCode: string;
  orderIndex: number;
  isValid: boolean;
  isDbDuplicate: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidLessonQuestionRow {
  lesson_id: string;
  question_id: string;
  order_index: number;
}

export async function parseLessonQuestionsImport(formData: FormData) {
  const { supabase } = await checkAdminAuth();

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "Vui lòng chọn file Excel / CSV để tải lên." };
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

  if (!rawRows || rawRows.length === 0) {
    return { success: false, error: "File Excel rỗng, không tìm thấy dòng dữ liệu nào." };
  }

  // Lấy toàn bộ lessons (slug -> { id, title, status })
  const { data: dbLessons } = await supabase.from("lessons").select("id, slug, title, status");
  const lessonMap = new Map((dbLessons || []).map((l) => [l.slug.toLowerCase(), l]));
  const allLessonSlugs = Array.from(lessonMap.keys());

  // Lấy toàn bộ questions (code -> { id, code, question_text, status })
  const { data: dbQuestions } = await supabase.from("questions").select("id, code, question_text, status");
  const questionMap = new Map((dbQuestions || []).map((q) => [q.code.toUpperCase(), q]));
  const allQuestionCodes = Array.from(questionMap.keys());

  // Lấy các cặp lesson_questions hiện có trong DB
  const { data: dbLQ } = await supabase.from("lesson_questions").select("lesson_id, question_id");
  const existingPairSet = new Set((dbLQ || []).map((lq) => `${lq.lesson_id}_${lq.question_id}`));

  const seenFilePairs = new Set<string>();

  const results: ParsedLessonQuestionRow[] = [];
  const validRowsToInsert: ValidLessonQuestionRow[] = [];

  rawRows.forEach((row, idx) => {
    const rowIndex = idx + 2;
    const errors: string[] = [];
    const warnings: string[] = [];

    const lessonSlug = String(row.lesson_slug || "").trim().toLowerCase();
    const questionCode = String(row.question_code || "").trim().toUpperCase();
    const orderIndex = Number(row.order_index) || 1;

    if (!lessonSlug) {
      errors.push("Mã bài học (lesson_slug) không được để trống");
    }

    if (!questionCode) {
      errors.push("Mã câu hỏi (question_code) không được để trống");
    }

    const filePairKey = `${lessonSlug}_${questionCode}`;
    if (lessonSlug && questionCode) {
      if (seenFilePairs.has(filePairKey)) {
        errors.push(`Cặp liên kết (${lessonSlug}, ${questionCode}) bị lặp lại trong file này`);
      } else {
        seenFilePairs.add(filePairKey);
      }
    }

    const lessonObj = lessonMap.get(lessonSlug);
    if (lessonSlug && !lessonObj) {
      const closest = allLessonSlugs.find((s) => s.includes(lessonSlug) || lessonSlug.includes(s)) || allLessonSlugs[0] || 'bai-hoc';
      errors.push(`Bài học với slug "${lessonSlug}" không tồn tại. Gợi ý: "${closest}"`);
    }

    const questionObj = questionMap.get(questionCode);
    if (questionCode && !questionObj) {
      const closest = allQuestionCodes.find((c) => c.includes(questionCode) || questionCode.includes(c)) || allQuestionCodes[0] || 'P5-0001';
      errors.push(`Câu hỏi với mã "${questionCode}" không tồn tại. Gợi ý: "${closest}"`);
    }

    let isDbDuplicate = false;
    if (lessonObj && questionObj) {
      const dbPairKey = `${lessonObj.id}_${questionObj.id}`;
      if (existingPairSet.has(dbPairKey)) {
        isDbDuplicate = true;
        warnings.push(`Liên kết (${lessonSlug}, ${questionCode}) đã tồn tại trong Database. Sẽ bỏ qua khi commit.`);
      }

      if (lessonObj.status === 'draft' || questionObj.status === 'draft') {
        warnings.push(`Cảnh báo: ${lessonObj.status === 'draft' ? 'Bài học' : ''}${lessonObj.status === 'draft' && questionObj.status === 'draft' ? ' và ' : ''}${questionObj.status === 'draft' ? 'Câu hỏi' : ''} đang ở trạng thái Draft. Liên kết chỉ hoạt động khi cả 2 được Published.`);
      }
    }

    const isValid = errors.length === 0;

    results.push({
      rowIndex,
      lessonSlug,
      questionCode,
      orderIndex,
      isValid,
      isDbDuplicate,
      errors,
      warnings,
    });

    if (isValid && lessonObj && questionObj && !isDbDuplicate) {
      validRowsToInsert.push({
        lesson_id: lessonObj.id,
        question_id: questionObj.id,
        order_index: orderIndex,
      });
    }
  });

  return {
    success: true,
    filename: file.name,
    totalRows: rawRows.length,
    validCount: validRowsToInsert.length,
    invalidCount: results.filter((r) => !r.isValid).length,
    warningCount: results.filter((r) => r.warnings.length > 0).length,
    results,
    validRowsToInsert,
  };
}

export async function commitLessonQuestionsImport(
  validRows: ValidLessonQuestionRow[],
  filename: string
) {
  const { supabase, user } = await checkAdminAuth();

  if (!validRows || validRows.length === 0) {
    return { success: false, error: "Không có dòng liên kết hợp lệ nào để nhập" };
  }

  const { error: insertError } = await supabase
    .from("lesson_questions")
    .upsert(validRows, { onConflict: "lesson_id,question_id" });

  if (insertError) {
    return { success: false, error: `Lỗi ghi liên kết vào DB: ${insertError.message}` };
  }

  await supabase.from("content_imports").insert({
    admin_id: user.id,
    filename: filename || "lesson_questions_import.xlsx",
    total_rows: validRows.length,
    success_rows: validRows.length,
    error_rows: 0,
    error_detail: [],
  });

  await supabase.from("admin_action_logs").insert({
    admin_id: user.id,
    action_type: "content_import_lesson_questions",
    content_type: "lessons",
    affected_ids: validRows.map((r) => `${r.lesson_id}:${r.question_id}`),
    payload: { filename, count: validRows.length },
  });

  revalidateTaxonomyCache();

  return { success: true, count: validRows.length };
}

// ------------------------------------------------------------------------------
// 9. PARSE & COMMIT IMPORT ĐỀ THI TOEIC (TESTS & TEST_QUESTIONS - 2 SHEETS)
// ------------------------------------------------------------------------------

export interface ParsedTestImportResult {
  testCode: string;
  title: string;
  testType: string;
  timeLimitMinutes: number;
  questionCount: number;
  isValid: boolean;
  isDbDuplicate: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidTestImportPayload {
  test_code: string;
  title: string;
  test_type: "mini" | "part" | "full";
  time_limit_minutes: number;
  questions: Array<{ question_id: string; order_index: number }>;
}

export async function parseTestsImport(formData: FormData) {
  const { supabase } = await checkAdminAuth();

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "Vui lòng chọn file Excel Đề thi (.xlsx) để tải lên." };
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const sheetNames = workbook.SheetNames;
  const testsSheetName = sheetNames.find((s) => s.toLowerCase().trim() === "tests") || sheetNames[0];
  const testQuestionsSheetName = sheetNames.find((s) => s.toLowerCase().trim() === "test_questions") || sheetNames[1];

  if (!testsSheetName || !testQuestionsSheetName) {
    return {
      success: false,
      error: "File Excel phải chứa 2 Sheet có tên 'tests' và 'test_questions'.",
    };
  }

  const rawTests: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[testsSheetName]);
  const rawTestQuestions: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[testQuestionsSheetName]);

  if (!rawTests || rawTests.length === 0) {
    return { success: false, error: "Sheet 'tests' rỗng, không có thông tin đề thi nào." };
  }

  // Lấy danh sách questions (code -> { id, code, question_text })
  const { data: dbQuestions } = await supabase.from("questions").select("id, code, question_text");
  const questionMap = new Map((dbQuestions || []).map((q) => [q.code.toUpperCase(), q]));

  // Lấy danh sách tests hiện có trong DB (title / id)
  const { data: dbTests } = await supabase.from("tests").select("id, title");
  const existingTestTitles = new Set((dbTests || []).map((t) => t.title.toLowerCase()));

  const validTestTypes = ["mini", "part", "full"];
  const seenTestCodes = new Set<string>();

  const results: ParsedTestImportResult[] = [];
  const validTestsToInsert: ValidTestImportPayload[] = [];

  for (const rawTest of rawTests) {
    const errors: string[] = [];
    const warnings: string[] = [];

    const testCode = String(rawTest.test_code || "").trim().toUpperCase();
    const title = String(rawTest.title || "").trim();
    const testType = String(rawTest.test_type || "").trim().toLowerCase();
    const timeLimitMinutes = Number(rawTest.time_limit_minutes) || 120;

    if (!testCode) {
      errors.push("Mã đề thi (test_code) không được để trống");
    } else if (seenTestCodes.has(testCode)) {
      errors.push(`Mã đề thi "${testCode}" bị lặp lại trong Sheet tests`);
    } else {
      seenTestCodes.add(testCode);
    }

    if (!title) {
      errors.push("Tiêu đề đề thi (title) không được để trống");
    }

    if (!testType || !validTestTypes.includes(testType)) {
      errors.push(`Loại đề thi (test_type) "${testType}" không hợp lệ. Phải là: mini, part, hoặc full`);
    }

    if (timeLimitMinutes <= 0) {
      errors.push("Thời gian làm bài (time_limit_minutes) phải là số dương");
    }

    const isDbDuplicate = !!title && existingTestTitles.has(title.toLowerCase());
    if (isDbDuplicate) {
      warnings.push(`Đề thi tiêu đề "${title}" đã tồn tại trong DB. Khi commit sẽ đè dữ liệu đề thi.`);
    }

    // Lọc danh sách câu hỏi tương ứng trong Sheet test_questions
    const matchingTQRows = rawTestQuestions.filter(
      (tq) => String(tq.test_code || "").trim().toUpperCase() === testCode
    );

    const questionPayloadList: Array<{ question_id: string; order_index: number }> = [];
    const seenOrders = new Set<number>();

    matchingTQRows.forEach((tqRow, idx) => {
      const qCode = String(tqRow.question_code || "").trim().toUpperCase();
      const orderIdx = Number(tqRow.order_index) || idx + 1;

      if (!qCode) {
        errors.push(`Hàng ${idx + 2} trong Sheet test_questions: question_code rỗng`);
        return;
      }

      const qObj = questionMap.get(qCode);
      if (!qObj) {
        errors.push(`Mã câu hỏi "${qCode}" (thứ tự ${orderIdx}) không tồn tại trong DB`);
        return;
      }

      if (seenOrders.has(orderIdx)) {
        errors.push(`Thứ tự câu hỏi (order_index = ${orderIdx}) bị lặp lại trong đề thi "${testCode}"`);
      } else {
        seenOrders.add(orderIdx);
      }

      questionPayloadList.push({
        question_id: qObj.id,
        order_index: orderIdx,
      });
    });

    const questionCount = questionPayloadList.length;
    if (questionCount === 0) {
      errors.push(`Đề thi "${testCode}" không có câu hỏi hợp lệ nào trong Sheet test_questions`);
    } else {
      // Warning kiểm tra số lượng câu chuẩn theo test_type
      if (testType === "mini" && (questionCount < 10 || questionCount > 30)) {
        warnings.push(`Cảnh báo: Đề Mini Test thường có 10-30 câu (hiện tại: ${questionCount} câu)`);
      } else if (testType === "part" && (questionCount < 20 || questionCount > 60)) {
        warnings.push(`Cảnh báo: Đề Part Test thường có 20-60 câu (hiện tại: ${questionCount} câu)`);
      } else if (testType === "full" && questionCount !== 200) {
        warnings.push(`Cảnh báo: Đề Full Test tiêu chuẩn TOEIC là 200 câu (hiện tại: ${questionCount} câu)`);
      }
    }

    const isValid = errors.length === 0;

    results.push({
      testCode,
      title,
      testType,
      timeLimitMinutes,
      questionCount,
      isValid,
      isDbDuplicate,
      errors,
      warnings,
    });

    if (isValid) {
      validTestsToInsert.push({
        test_code: testCode,
        title,
        test_type: testType as any,
        time_limit_minutes: timeLimitMinutes,
        questions: questionPayloadList,
      });
    }
  }

  return {
    success: true,
    filename: file.name,
    totalTests: rawTests.length,
    validCount: validTestsToInsert.length,
    results,
    validTestsToInsert,
  };
}

export async function commitTestsImport(
  validTests: ValidTestImportPayload[],
  filename: string
) {
  const { supabase, user } = await checkAdminAuth();

  if (!validTests || validTests.length === 0) {
    return { success: false, error: "Không có đề thi hợp lệ nào để nhập" };
  }

  let successCount = 0;
  const errorDetails: string[] = [];

  for (const testPayload of validTests) {
    try {
      // 1. Ưu tiên thực thi qua RPC Stored Procedure nguyên tử (ACID Transaction Block 100%)
      const { data: rpcData, error: rpcErr } = await supabase.rpc("import_test_with_questions", {
        p_title: testPayload.title,
        p_test_type: testPayload.test_type,
        p_time_limit_minutes: testPayload.time_limit_minutes,
        p_questions: testPayload.questions,
      });

      if (!rpcErr && rpcData) {
        successCount++;
        continue;
      }

      // 2. Fallback nếu RPC chưa được deploy lên DB môi trường thật
      const { data: existingTest } = await supabase
        .from("tests")
        .select("id")
        .eq("title", testPayload.title)
        .maybeSingle();

      let testId = existingTest?.id;

      if (testId) {
        await supabase
          .from("tests")
          .update({
            test_type: testPayload.test_type,
            time_limit_minutes: testPayload.time_limit_minutes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", testId);

        await supabase.from("test_questions").delete().eq("test_id", testId);
      } else {
        const { data: newTest, error: insertTestErr } = await supabase
          .from("tests")
          .insert({
            title: testPayload.title,
            test_type: testPayload.test_type,
            time_limit_minutes: testPayload.time_limit_minutes,
            status: "draft",
          })
          .select("id")
          .single();

        if (insertTestErr || !newTest) {
          throw new Error(`Lỗi tạo đề thi "${testPayload.title}": ${insertTestErr?.message}`);
        }

        testId = newTest.id;
      }

      const tqRows = testPayload.questions.map((q) => ({
        test_id: testId,
        question_id: q.question_id,
        order_index: q.order_index,
      }));

      const { error: insertTQErr } = await supabase.from("test_questions").insert(tqRows);
      if (insertTQErr) {
        throw new Error(`Lỗi chèn câu hỏi cho đề "${testPayload.title}": ${insertTQErr.message}`);
      }

      successCount++;
    } catch (err) {
      errorDetails.push((err as Error).message);
    }
  }

  // Ghi nhật ký import
  await supabase.from("content_imports").insert({
    admin_id: user.id,
    filename: filename || "tests_import.xlsx",
    total_rows: validTests.length,
    success_rows: successCount,
    error_rows: validTests.length - successCount,
    error_detail: errorDetails,
  });

  // Ghi audit log
  await supabase.from("admin_action_logs").insert({
    admin_id: user.id,
    action_type: "content_import_tests",
    content_type: "tests",
    affected_ids: validTests.map((t) => t.test_code),
    payload: { filename, successCount, total: validTests.length },
  });

  revalidateTaxonomyCache();

  return { success: true, count: successCount, errors: errorDetails };
}

// ------------------------------------------------------------------------------
// 10. TESTS CRUD FOR ADMIN CONTENT TAB "ĐỀ THI"
// ------------------------------------------------------------------------------

export async function getAdminTests() {
  const { supabase } = await checkAdminAuth();

  const { data: tests, error } = await supabase
    .from("tests")
    .select("*, test_questions(count), test_attempts(count)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Lỗi đọc danh sách đề thi: ${error.message}`);
  }

  return (tests || []).map((t: any) => ({
    id: t.id,
    title: t.title,
    test_type: t.test_type,
    time_limit_minutes: t.time_limit_minutes,
    status: t.status,
    created_at: t.created_at,
    question_count: t.test_questions?.[0]?.count || 0,
    attempt_count: t.test_attempts?.[0]?.count || 0,
  }));
}

export async function toggleTestStatus(id: string, currentStatus: string) {
  const { supabase, user } = await checkAdminAuth();

  const nextStatus = currentStatus === "published" ? "draft" : "published";

  const { error } = await supabase
    .from("tests")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  await supabase.from("admin_action_logs").insert({
    admin_id: user.id,
    action_type: "single_update",
    content_type: "tests",
    affected_ids: [id],
    payload: { status: nextStatus },
  });

  revalidateTaxonomyCache();

  return { success: true, nextStatus };
}

export async function deleteTest(id: string) {
  const { supabase, user } = await checkAdminAuth();

  // Kiểm tra lượt làm bài test_attempts
  const { count } = await supabase
    .from("test_attempts")
    .select("*", { count: "exact", head: true })
    .eq("test_id", id);

  if ((count || 0) > 0) {
    return {
      success: false,
      error: `Không thể xóa đề thi này vì đã có ${count} lượt học viên làm bài. Hãy đổi trạng thái sang Draft để ẩn.`,
    };
  }

  const { error } = await supabase.from("tests").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  await supabase.from("admin_action_logs").insert({
    admin_id: user.id,
    action_type: "single_delete",
    content_type: "tests",
    affected_ids: [id],
    payload: {},
  });

  revalidateTaxonomyCache();

  return { success: true };
}

// ------------------------------------------------------------------------------
// 11. PARSE & COMMIT IMPORT TAXONOMY (TOPICS & LEVELS - 2 SHEETS)
// ------------------------------------------------------------------------------

export interface ParsedTopicImportRow {
  rowIndex: number;
  code: string;
  displayName: string;
  description: string | null;
  orderIndex: number;
  isValid: boolean;
  isDbDuplicate: boolean;
  errors: string[];
  warnings: string[];
}

export interface ParsedLevelImportRow {
  rowIndex: number;
  code: string;
  displayName: string;
  orderIndex: number;
  isValid: boolean;
  isDbDuplicate: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidTopicImportPayload {
  code: string;
  display_name: string;
  description: string | null;
  order_index: number;
  is_existing: boolean;
}

export interface ValidLevelImportPayload {
  code: string;
  display_name: string;
  order_index: number;
  is_existing: boolean;
}

export async function parseTaxonomyImport(formData: FormData) {
  const { supabase } = await checkAdminAuth();

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "Vui lòng chọn file Excel / CSV Taxonomy để tải lên." };
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const sheetNames = workbook.SheetNames;
  const topicsSheetName = sheetNames.find((s) => s.toLowerCase().trim() === "topics") || sheetNames[0];
  const levelsSheetName = sheetNames.find((s) => s.toLowerCase().trim() === "levels") || sheetNames[1];

  const rawTopics: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[topicsSheetName] || {});
  const rawLevels: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[levelsSheetName] || {});

  if (rawTopics.length > 100 || rawLevels.length > 100) {
    return {
      success: false,
      error: "Giới hạn tối đa 100 dòng mỗi sheet trong file Taxonomy.",
    };
  }

  // Lấy DB topics & levels hiện có
  const { data: dbTopics } = await supabase.from("topics").select("code, display_name, description, order_index, is_active");
  const dbTopicMap = new Map((dbTopics || []).map((t) => [t.code.toLowerCase(), t]));

  const { data: dbLevels } = await supabase.from("levels").select("code, display_name, order_index, is_active");
  const dbLevelMap = new Map((dbLevels || []).map((l) => [l.code, l]));

  const seenTopicCodes = new Set<string>();
  const topicResults: ParsedTopicImportRow[] = [];
  const validTopicsToInsert: ValidTopicImportPayload[] = [];

  rawTopics.forEach((row, idx) => {
    const rowIndex = idx + 2;
    const errors: string[] = [];
    const warnings: string[] = [];

    const code = String(row.code || "").trim().toLowerCase();
    const displayName = String(row.display_name || "").trim();
    const description = row.description ? String(row.description).trim() : null;
    const orderIndex = Number(row.order_index);

    if (!code) {
      errors.push("Mã Topic (code) không được để trống");
    } else if (!/^[a-z0-9_]+$/.test(code)) {
      errors.push(`Mã Topic "${code}" không hợp lệ. Chỉ gồm chữ cái thường (a-z), chữ số (0-9) và dấu gạch dưới (_)`);
    } else if (seenTopicCodes.has(code)) {
      errors.push(`Mã Topic "${code}" bị lặp lại trong Sheet topics`);
    } else {
      seenTopicCodes.add(code);
    }

    if (!displayName) {
      errors.push("Tên hiển thị Topic (display_name) không được để trống");
    }

    if (orderIndex < 0) {
      errors.push("Thứ tự hiển thị (order_index) không được là số âm");
    }

    const existingInDb = dbTopicMap.get(code);
    const isDbDuplicate = !!existingInDb;
    if (isDbDuplicate) {
      warnings.push(`Topic "${code}" đã tồn tại trong DB. Sẽ chỉ cập nhật Tên hiển thị/Mô tả/Thứ tự (Metadata Update), giữ nguyên trạng thái ${existingInDb.is_active ? 'Active' : 'Ẩn'}.`);
    }

    const isValid = errors.length === 0;

    topicResults.push({
      rowIndex,
      code,
      displayName,
      description,
      orderIndex: isNaN(orderIndex) ? 0 : orderIndex,
      isValid,
      isDbDuplicate,
      errors,
      warnings,
    });

    if (isValid) {
      validTopicsToInsert.push({
        code,
        display_name: displayName,
        description,
        order_index: isNaN(orderIndex) ? 0 : orderIndex,
        is_existing: isDbDuplicate,
      });
    }
  });

  const seenLevelCodes = new Set<string>();
  const levelResults: ParsedLevelImportRow[] = [];
  const validLevelsToInsert: ValidLevelImportPayload[] = [];

  rawLevels.forEach((row, idx) => {
    const rowIndex = idx + 2;
    const errors: string[] = [];
    const warnings: string[] = [];

    const code = String(row.code || "").trim();
    const displayName = String(row.display_name || "").trim();
    const orderIndex = Number(row.order_index);

    if (!code) {
      errors.push("Mã Level (code) không được để trống");
    } else if (!/^[a-zA-Z0-9_+ -]+$/.test(code)) {
      errors.push(`Mã Level "${code}" chứa ký tự không hợp lệ`);
    } else if (seenLevelCodes.has(code)) {
      errors.push(`Mã Level "${code}" bị lặp lại trong Sheet levels`);
    } else {
      seenLevelCodes.add(code);
    }

    if (!displayName) {
      errors.push("Tên hiển thị Level (display_name) không được để trống");
    }

    if (orderIndex < 0) {
      errors.push("Thứ tự hiển thị (order_index) không được là số âm");
    }

    const existingInDb = dbLevelMap.get(code);
    const isDbDuplicate = !!existingInDb;
    if (isDbDuplicate) {
      warnings.push(`Level "${code}" đã tồn tại trong DB. Sẽ chỉ cập nhật Tên hiển thị/Thứ tự (Metadata Update), giữ nguyên trạng thái ${existingInDb.is_active ? 'Active' : 'Ẩn'}.`);
    }

    const isValid = errors.length === 0;

    levelResults.push({
      rowIndex,
      code,
      displayName,
      orderIndex: isNaN(orderIndex) ? 0 : orderIndex,
      isValid,
      isDbDuplicate,
      errors,
      warnings,
    });

    if (isValid) {
      validLevelsToInsert.push({
        code,
        display_name: displayName,
        order_index: isNaN(orderIndex) ? 0 : orderIndex,
        is_existing: isDbDuplicate,
      });
    }
  });

  return {
    success: true,
    filename: file.name,
    totalTopics: rawTopics.length,
    validTopicsCount: validTopicsToInsert.length,
    totalLevels: rawLevels.length,
    validLevelsCount: validLevelsToInsert.length,
    topicResults,
    levelResults,
    validTopicsToInsert,
    validLevelsToInsert,
  };
}

export async function commitTaxonomyImport(
  validTopics: ValidTopicImportPayload[],
  validLevels: ValidLevelImportPayload[],
  filename: string
): Promise<{
  success: boolean;
  insertedTopics?: number;
  updatedTopics?: number;
  insertedLevels?: number;
  updatedLevels?: number;
  message?: string;
  error?: string;
}> {
  try {
    const { supabase, user } = await checkAdminAuth();

    let insertedTopics = 0;
    let updatedTopics = 0;
    let insertedLevels = 0;
    let updatedLevels = 0;

    // Process Topics
    for (const t of validTopics) {
      if (t.is_existing) {
        await supabase
          .from("topics")
          .update({
            display_name: t.display_name,
            description: t.description,
            order_index: t.order_index,
            updated_at: new Date().toISOString(),
          })
          .eq("code", t.code);
        updatedTopics++;
      } else {
        await supabase.from("topics").insert({
          code: t.code,
          display_name: t.display_name,
          description: t.description,
          order_index: t.order_index,
          is_active: true,
        });
        insertedTopics++;
      }
    }

    // Process Levels
    for (const l of validLevels) {
      if (l.is_existing) {
        await supabase
          .from("levels")
          .update({
            display_name: l.display_name,
            order_index: l.order_index,
            updated_at: new Date().toISOString(),
          })
          .eq("code", l.code);
        updatedLevels++;
      } else {
        await supabase.from("levels").insert({
          code: l.code,
          display_name: l.display_name,
          order_index: l.order_index,
          is_active: true,
        });
        insertedLevels++;
      }
    }

    const totalProcessed = insertedTopics + updatedTopics + insertedLevels + updatedLevels;

    // Ghi content_imports
    await supabase.from("content_imports").insert({
      admin_id: user.id,
      filename: filename || "taxonomy_import.xlsx",
      total_rows: validTopics.length + validLevels.length,
      success_rows: totalProcessed,
      error_rows: 0,
      error_detail: [],
    });

    // Ghi audit log
    await supabase.from("admin_action_logs").insert({
      admin_id: user.id,
      action_type: "taxonomy_import",
      content_type: "topics",
      affected_ids: [...validTopics.map((t) => t.code), ...validLevels.map((l) => l.code)],
      payload: { filename, insertedTopics, updatedTopics, insertedLevels, updatedLevels },
    });

    revalidateTaxonomyCache();

    return {
      success: true,
      insertedTopics,
      updatedTopics,
      insertedLevels,
      updatedLevels,
      message: `Import Taxonomy thành công! Thêm mới ${insertedTopics} Topics, ${insertedLevels} Levels; Cập nhật ${updatedTopics} Topics, ${updatedLevels} Levels.`,
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }
}
