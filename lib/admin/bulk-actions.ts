"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Limit tối đa bản ghi xử lý trong 1 lần gọi Server Action
const MAX_BULK_LIMIT = 100;

export type ContentType = "questions" | "lessons" | "vocabulary";
export type StatusType = "draft" | "published";

export interface BulkActionResult {
  success: boolean;
  success_count: number;
  failed: Array<{ id: string | number; reason: string }>;
  error?: string;
}

export interface BulkDeleteSafetyCheckResult {
  success: boolean;
  deletableIds: Array<string | number>;
  blockedItems: Array<{ id: string | number; reason: string }>;
  error?: string;
}

// ------------------------------------------------------------------------------
// HELPER: KIỂM TRA QUYỀN ADMIN SERVER-SIDE
// ------------------------------------------------------------------------------
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
// WHITELIST & ZOD VALIDATION RULES FOR BULK FIELDS
// ------------------------------------------------------------------------------
const FIELD_WHITELISTS: Record<ContentType, string[]> = {
  questions: ["level_tag", "topic", "difficulty"],
  lessons: ["level_tag", "skill"],
  vocabulary: ["topic", "level_tag"],
};

const VALID_LEVEL_TAGS = ["350+", "500+", "650+", "800+", "A2", "B1", "B2", "C1"];
const VALID_DIFFICULTIES = ["easy", "medium", "hard"];
const VALID_SKILLS = ["vocabulary", "grammar", "listening", "reading", "strategy"];

const FieldValidators: Record<string, z.ZodType<any>> = {
  level_tag: z.string().refine((val) => VALID_LEVEL_TAGS.includes(val), {
    message: `Level tag không hợp lệ. Phải là một trong: ${VALID_LEVEL_TAGS.join(", ")}`,
  }),
  difficulty: z.string().refine((val) => VALID_DIFFICULTIES.includes(val), {
    message: `Độ khó không hợp lệ. Phải là: easy, medium, hoặc hard`,
  }),
  skill: z.string().refine((val) => VALID_SKILLS.includes(val), {
    message: `Kỹ năng không hợp lệ. Phải là một trong: ${VALID_SKILLS.join(", ")}`,
  }),
  topic: z.string().min(1, "Chủ đề không được để trống"),
};

// Helper validate mảng IDs
function cleanAndValidateIds(ids: Array<string | number>): Array<string | number> {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error("Danh sách ID không được để trống.");
  }

  if (ids.length > MAX_BULK_LIMIT) {
    throw new Error(`Vượt quá giới hạn cho phép (tối đa ${MAX_BULK_LIMIT} bản ghi mỗi lần).`);
  }

  // Lọc các giá trị hợp lệ và loại bỏ trùng lặp
  const uniqueIds = Array.from(new Set(ids.filter((id) => id !== null && id !== undefined && id !== "")));
  if (uniqueIds.length === 0) {
    throw new Error("Không có ID hợp lệ nào được cung cấp.");
  }

  return uniqueIds;
}

// ------------------------------------------------------------------------------
// 1. BULK UPDATE STATUS (DRAFT <-> PUBLISHED)
// ------------------------------------------------------------------------------
export async function bulkUpdateStatus(
  contentType: ContentType,
  rawIds: Array<string | number>,
  newStatus: StatusType
): Promise<BulkActionResult> {
  try {
    const { supabase, user } = await checkAdminAuth();

    if (!["questions", "lessons", "vocabulary"].includes(contentType)) {
      return { success: false, success_count: 0, failed: [], error: "Loại nội dung không hợp lệ." };
    }

    if (!["draft", "published"].includes(newStatus)) {
      return { success: false, success_count: 0, failed: [], error: "Trạng thái mới không hợp lệ." };
    }

    const ids = cleanAndValidateIds(rawIds);

    const tableName =
      contentType === "questions"
        ? "questions"
        : contentType === "lessons"
        ? "lessons"
        : "vocabulary_items";

    const updatePayload: Record<string, any> = {
      status: newStatus,
    };
    if (contentType !== "vocabulary") {
      updatePayload.updated_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from(tableName)
      .update(updatePayload)
      .in("id", ids)
      .select("id");

    if (error) {
      return { success: false, success_count: 0, failed: [], error: `Lỗi cập nhật trạng thái DB: ${error.message}` };
    }

    const updatedCount = data ? data.length : 0;

    // Ghi log vào admin_action_logs
    await supabase.from("admin_action_logs").insert({
      admin_id: user.id,
      action_type: "bulk_update_status",
      content_type: contentType,
      affected_ids: ids,
      payload: { newStatus, updatedCount },
    });

    return {
      success: true,
      success_count: updatedCount,
      failed: [],
    };
  } catch (err: any) {
    return {
      success: false,
      success_count: 0,
      failed: [],
      error: err.message || "Lỗi không xác định khi cập nhật trạng thái hàng loạt.",
    };
  }
}

// ------------------------------------------------------------------------------
// 2. BULK UPDATE FIELD (METADATA WHITELISTED FIELDS)
// ------------------------------------------------------------------------------
export async function bulkUpdateField(
  contentType: ContentType,
  rawIds: Array<string | number>,
  field: string,
  value: any
): Promise<BulkActionResult> {
  try {
    const { supabase, user } = await checkAdminAuth();

    if (!["questions", "lessons", "vocabulary"].includes(contentType)) {
      return { success: false, success_count: 0, failed: [], error: "Loại nội dung không hợp lệ." };
    }

    const whitelist = FIELD_WHITELISTS[contentType];
    if (!whitelist.includes(field)) {
      return {
        success: false,
        success_count: 0,
        failed: [],
        error: `Trường '${field}' không nằm trong danh sách được phép sửa hàng loạt của ${contentType}.`,
      };
    }

    // Validate value với Zod
    const validator = FieldValidators[field];
    if (validator) {
      const parseResult = validator.safeParse(value);
      if (!parseResult.success) {
        return {
          success: false,
          success_count: 0,
          failed: [],
          error: parseResult.error.issues?.[0]?.message || parseResult.error.message || "Giá trị không hợp lệ.",
        };
      }
    }

    // Nếu sửa topic trong vocabulary_items, kiểm tra topic có tồn tại trong vocab_topics không
    if (contentType === "vocabulary" && field === "topic") {
      const { data: topicData } = await supabase
        .from("vocab_topics")
        .select("code")
        .eq("code", String(value).trim().toLowerCase())
        .maybeSingle();

      if (!topicData) {
        return {
          success: false,
          success_count: 0,
          failed: [],
          error: `Mã chủ đề '${value}' không tồn tại trong danh mục vocab_topics.`,
        };
      }
    }

    const ids = cleanAndValidateIds(rawIds);

    const tableName =
      contentType === "questions"
        ? "questions"
        : contentType === "lessons"
        ? "lessons"
        : "vocabulary_items";

    const updatePayload: Record<string, any> = {
      [field]: value,
    };
    if (contentType !== "vocabulary") {
      updatePayload.updated_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from(tableName)
      .update(updatePayload)
      .in("id", ids)
      .select("id");

    if (error) {
      return { success: false, success_count: 0, failed: [], error: `Lỗi cập nhật trường DB: ${error.message}` };
    }

    const updatedCount = data ? data.length : 0;

    // Ghi log vào admin_action_logs
    await supabase.from("admin_action_logs").insert({
      admin_id: user.id,
      action_type: "bulk_update_field",
      content_type: contentType,
      affected_ids: ids,
      payload: { field, value, updatedCount },
    });

    return {
      success: true,
      success_count: updatedCount,
      failed: [],
    };
  } catch (err: any) {
    return {
      success: false,
      success_count: 0,
      failed: [],
      error: err.message || "Lỗi không xác định khi cập nhật trường dữ liệu.",
    };
  }
}

// ------------------------------------------------------------------------------
// 3. CHECK BULK DELETE SAFETY (DÙNG CHO PREVIEW DIALOG TRÊN UI)
// ------------------------------------------------------------------------------
export async function checkBulkDeleteSafety(
  contentType: ContentType,
  rawIds: Array<string | number>
): Promise<BulkDeleteSafetyCheckResult> {
  try {
    const { supabase } = await checkAdminAuth();
    const ids = cleanAndValidateIds(rawIds);

    const deletableIds: Array<string | number> = [];
    const blockedItems: Array<{ id: string | number; reason: string }> = [];

    if (contentType === "questions") {
      // Check user_answers
      const { data: userAns } = await supabase
        .from("user_answers")
        .select("question_id")
        .in("question_id", ids);

      const referencedQuestionIds = new Set((userAns || []).map((a) => String(a.question_id)));

      for (const id of ids) {
        if (referencedQuestionIds.has(String(id))) {
          blockedItems.push({
            id,
            reason: "Đã có học viên làm bài thi / luyện tập câu hỏi này. Hãy chuyển trạng thái sang 'Nháp' để ẩn.",
          });
        } else {
          deletableIds.push(id);
        }
      }
    } else if (contentType === "lessons") {
      // Check lesson_progress
      const { data: lessonProg } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .in("lesson_id", ids);

      const referencedLessonIds = new Set((lessonProg || []).map((p) => String(p.lesson_id)));

      for (const id of ids) {
        if (referencedLessonIds.has(String(id))) {
          blockedItems.push({
            id,
            reason: "Đã có học viên hoàn thành bài học này. Hãy chuyển trạng thái sang 'Nháp' để ẩn.",
          });
        } else {
          deletableIds.push(id);
        }
      }
    } else if (contentType === "vocabulary") {
      // Check user_vocab_progress
      const { data: vocabProg } = await supabase
        .from("user_vocab_progress")
        .select("vocab_id")
        .in("vocab_id", ids);

      const referencedVocabIds = new Set((vocabProg || []).map((v) => String(v.vocab_id)));

      for (const id of ids) {
        if (referencedVocabIds.has(String(id))) {
          blockedItems.push({
            id,
            reason: "Đã có học viên học và ghi nhớ từ vựng này trong hệ thống SRS. Hãy chuyển trạng thái sang 'Nháp' để ẩn.",
          });
        } else {
          deletableIds.push(id);
        }
      }
    }

    return {
      success: true,
      deletableIds,
      blockedItems,
    };
  } catch (err: any) {
    return {
      success: false,
      deletableIds: [],
      blockedItems: [],
      error: err.message || "Lỗi kiểm tra an toàn xóa dữ liệu.",
    };
  }
}

// ------------------------------------------------------------------------------
// 4. BULK DELETE (XÓA HÀNG LOẠT THEO PHƯƠNG ÁN A - CHẶN BẢN GHI CÓ THAM CHIẾU)
// ------------------------------------------------------------------------------
export async function bulkDelete(
  contentType: ContentType,
  rawIds: Array<string | number>
): Promise<BulkActionResult> {
  try {
    const { supabase, user } = await checkAdminAuth();
    const ids = cleanAndValidateIds(rawIds);

    // Kiểm tra an toàn trước khi xóa
    const safetyCheck = await checkBulkDeleteSafety(contentType, ids);
    if (!safetyCheck.success) {
      return {
        success: false,
        success_count: 0,
        failed: [],
        error: safetyCheck.error,
      };
    }

    const { deletableIds, blockedItems } = safetyCheck;

    let deletedCount = 0;

    if (deletableIds.length > 0) {
      const tableName =
        contentType === "questions"
          ? "questions"
          : contentType === "lessons"
          ? "lessons"
          : "vocabulary_items";

      const { data, error } = await supabase
        .from(tableName)
        .delete()
        .in("id", deletableIds)
        .select("id");

      if (error) {
        return {
          success: false,
          success_count: 0,
          failed: blockedItems,
          error: `Lỗi xóa bản ghi trong DB: ${error.message}`,
        };
      }

      deletedCount = data ? data.length : 0;
    }

    // Ghi log vào admin_action_logs
    await supabase.from("admin_action_logs").insert({
      admin_id: user.id,
      action_type: "bulk_delete",
      content_type: contentType,
      affected_ids: deletableIds,
      payload: {
        requested_count: ids.length,
        deletedCount,
        blocked_count: blockedItems.length,
        blockedItems,
      },
    });

    return {
      success: true,
      success_count: deletedCount,
      failed: blockedItems,
    };
  } catch (err: any) {
    return {
      success: false,
      success_count: 0,
      failed: [],
      error: err.message || "Lỗi không xác định khi xóa hàng loạt.",
    };
  }
}

// ------------------------------------------------------------------------------
// 5. TRUY VẤN NHẬT KÝ THAO TÁC ADMIN (ADMIN ACTION LOGS)
// ------------------------------------------------------------------------------
export async function getAdminActionLogs(filters?: {
  actionType?: string;
  contentType?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const { supabase } = await checkAdminAuth();

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("admin_action_logs")
      .select("*, profiles:admin_id(full_name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filters?.actionType && filters.actionType !== "all") {
      query = query.eq("action_type", filters.actionType);
    }

    if (filters?.contentType && filters.contentType !== "all") {
      query = query.eq("content_type", filters.contentType);
    }

    const { data, count, error } = await query;

    if (error) {
      return { success: false, logs: [], totalCount: 0, page, totalPages: 0, error: error.message };
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      logs: data || [],
      totalCount,
      page,
      totalPages,
    };
  } catch (err: any) {
    return {
      success: false,
      logs: [],
      totalCount: 0,
      page: 1,
      totalPages: 0,
      error: err.message || "Lỗi đọc nhật ký thao tác.",
    };
  }
}

