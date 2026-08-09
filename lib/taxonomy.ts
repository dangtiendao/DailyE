'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';

export interface TopicItem {
  code: string;
  display_name: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  vocab_count?: number;
  lesson_count?: number;
  question_count?: number;
}

export interface LevelItem {
  code: string;
  display_name: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  vocab_count?: number;
  lesson_count?: number;
  question_count?: number;
}

// ------------------------------------------------------------------------------
// 1. TOPIC & LEVEL FETCHING FUNCTIONS (SINGLE SOURCE OF TRUTH)
// ------------------------------------------------------------------------------

/**
 * Lấy danh sách Topics đang hoạt động (is_active = true) sắp xếp theo order_index
 */
export async function getActiveTopics(): Promise<TopicItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Lỗi lấy active topics:', error);
    return [];
  }
  return data || [];
}

/**
 * Lấy tất cả Topics (bao gồm cả topic đã ẩn) dành cho trang Admin
 */
export async function getAllTopics(): Promise<TopicItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Lỗi lấy all topics:', error);
    return [];
  }
  return data || [];
}

/**
 * Lấy danh sách Levels đang hoạt động (is_active = true) sắp xếp theo order_index
 */
export async function getActiveLevels(): Promise<LevelItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Lỗi lấy active levels:', error);
    return [];
  }
  return data || [];
}

/**
 * Lấy tất cả Levels dành cho trang Admin
 */
export async function getAllLevels(): Promise<LevelItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Lỗi lấy all levels:', error);
    return [];
  }
  return data || [];
}

// ------------------------------------------------------------------------------
// 2. VALIDATION HELPERS & DYNAMIC ZOD SCHEMAS
// ------------------------------------------------------------------------------

/**
 * Kiểm tra mã Topic có hợp lệ hay không
 */
export async function validateTopicCode(
  code: string,
  options?: { allowInactive?: boolean }
): Promise<{ isValid: boolean; topic?: TopicItem; error?: string }> {
  if (!code) return { isValid: false, error: 'Mã Topic không được để trống' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('code', code.toLowerCase().trim())
    .single();

  if (error || !data) {
    return { isValid: false, error: `Mã Topic "${code}" không tồn tại trong hệ thống` };
  }

  if (!options?.allowInactive && !data.is_active) {
    return { isValid: false, topic: data, error: `Topic "${data.display_name}" (${code}) đang bị ẩn` };
  }

  return { isValid: true, topic: data };
}

/**
 * Kiểm tra mã Level có hợp lệ hay không
 */
export async function validateLevelCode(
  code: string,
  options?: { allowInactive?: boolean }
): Promise<{ isValid: boolean; level?: LevelItem; error?: string }> {
  if (!code) return { isValid: false, error: 'Mã Level không được để trống' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .eq('code', code.trim())
    .single();

  if (error || !data) {
    return { isValid: false, error: `Mã Level "${code}" không tồn tại trong hệ thống` };
  }

  if (!options?.allowInactive && !data.is_active) {
    return { isValid: false, level: data, error: `Level "${data.display_name}" (${code}) đang bị ẩn` };
  }

  return { isValid: true, level: data };
}

/**
 * Helper revalidate cache Taxonomy sau khi Admin thực hiện cập nhật
 */
export async function revalidateTaxonomyCache() {
  try {
    revalidatePath('/admin/taxonomy');
    revalidatePath('/admin/content');
    revalidatePath('/admin/import');
    revalidatePath('/learn/vocabulary');
    revalidatePath('/practice');
  } catch (err) {
    console.error('Revalidate path error:', err);
  }
}
