'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  adminUserListSchema,
  updateUserRoleSchema,
  banUserSchema,
  unbanUserSchema,
  deleteUserByAdminSchema,
  AdminUserListInput,
  UpdateUserRoleInput,
  BanUserInput,
  UnbanUserInput,
  DeleteUserByAdminInput,
} from '@/lib/validators';
import { headers } from 'next/headers';

// ------------------------------------------------------------------------------
// HELPER: VERIFY QUYỀN ADMIN SERVER-SIDE TẠI MỌI ACTION
// ------------------------------------------------------------------------------
async function verifyAdminServerSide() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Chưa đăng nhập. Vui lòng đăng nhập tài khoản Admin.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, access_level, status, email')
    .eq('id', user.id)
    .single();

  const profileData = profile as any;

  if (!profileData || profileData.access_level !== 'admin' || profileData.status === 'banned') {
    throw new Error('Bạn không có quyền Admin để thực hiện thao tác quản trị này.');
  }

  return { supabase, user, profile: profileData };
}

// ------------------------------------------------------------------------------
// 1. LẤY DANH SÁCH USER (TÌM KIẾM, FILTER, SẮP XẾP, PHÂN TRANG 20/TRANG)
// ------------------------------------------------------------------------------
export async function getUsersList(input: AdminUserListInput) {
  try {
    const { user } = await verifyAdminServerSide();
    const validation = adminUserListSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const { search, accessLevel, status, sortBy, sortOrder, page, pageSize } = validation.data;
    const adminClient = createAdminClient();

    let query = adminClient
      .from('profiles')
      .select('*', { count: 'exact' });

    // Tìm kiếm ILIKE trên full_name hoặc email
    if (search && search.trim() !== '') {
      const s = `%${search.trim()}%`;
      query = query.or(`full_name.ilike.${s},email.ilike.${s}`);
    }

    // Filter theo access_level
    if (accessLevel && accessLevel !== 'all') {
      query = query.eq('access_level', accessLevel);
    }

    // Filter theo status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Sắp xếp
    const isAscending = sortOrder === 'asc';
    query = query.order(sortBy || 'created_at', { ascending: isAscending });

    // Phân trang
    const currentPage = Math.max(1, page || 1);
    const limit = pageSize || 20;
    const from = (currentPage - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data: users, count, error } = await query;

    if (error) {
      return { success: false, error: 'Lỗi tải danh sách người dùng: ' + error.message };
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      success: true,
      users: (users as any[]) || [],
      totalCount,
      page: currentPage,
      totalPages,
      currentAdminId: user.id,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi server khi lấy danh sách user' };
  }
}

// ------------------------------------------------------------------------------
// 2. LẤY CHI TIẾT USER KÈM THỐNG KÊ HỌC TẬP
// ------------------------------------------------------------------------------
export async function getUserDetail(userId: string) {
  try {
    await verifyAdminServerSide();
    const adminClient = createAdminClient();

    // 1. Lấy thông tin profile
    const { data: rawProfile, error: profileErr } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileErr || !rawProfile) {
      return { success: false, error: 'Không tìm thấy người dùng này trong hệ thống.' };
    }

    const profile: any = rawProfile;

    // 2. Lấy thông tin Auth user để xem provider đăng nhập
    const { data: authUserData } = await adminClient.auth.admin.getUserById(userId);
    const authUser = authUserData?.user;
    const isGoogle = authUser?.app_metadata?.provider === 'google' ||
      authUser?.identities?.some((id: any) => id.provider === 'google');
    const provider = isGoogle ? 'google' : 'email';

    // 3. Thống kê học tập: test_attempts
    const { data: attempts } = await adminClient
      .from('test_attempts')
      .select('id, score, total_questions, started_at')
      .eq('user_id', userId);

    const attemptsList = (attempts as any[]) || [];
    const totalAttempts = attemptsList.length;
    let totalQuestionsAnswered = 0;
    let totalScore = 0;
    attemptsList.forEach((a) => {
      totalQuestionsAnswered += a.total_questions || 0;
      totalScore += a.score || 0;
    });

    // 4. Thống kê từ vựng: user_vocab_progress
    const { data: vocabProgress } = await adminClient
      .from('user_vocab_progress')
      .select('familiarity')
      .eq('user_id', userId);

    const vocabList = (vocabProgress as any[]) || [];
    let vocabMastered = 0;
    let vocabLearning = 0;
    vocabList.forEach((v) => {
      if (v.familiarity === 3) vocabMastered++;
      else vocabLearning++;
    });

    // 5. Thống kê bài học: lesson_progress
    const { count: completedLessonsCount } = await adminClient
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      success: true,
      profile: {
        ...profile,
        provider,
      },
      stats: {
        totalAttempts,
        totalQuestionsAnswered,
        averageScore: totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0,
        vocabMastered,
        vocabLearning,
        totalVocabCount: vocabList.length,
        completedLessonsCount: completedLessonsCount || 0,
        streakCount: profile.streak_count || 0,
        lastActiveDate: profile.last_active_date,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi server khi lấy chi tiết user' };
  }
}

// ------------------------------------------------------------------------------
// 3. CẬP NHẬT QUYỀN HẠN USER (UPDATE ROLE)
// ------------------------------------------------------------------------------
export async function updateUserRole(input: UpdateUserRoleInput) {
  try {
    const { user: currentAdmin, supabase } = await verifyAdminServerSide();
    const validation = updateUserRoleSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const { userId, newRole, confirmEmail } = validation.data;

    // QUY TẮC 1: Admin không được tự đổi quyền chính mình
    if (userId === currentAdmin.id) {
      return { success: false, error: 'Bạn không thể tự thay đổi quyền hạn của chính mình.' };
    }

    const adminClient = createAdminClient();
    const { data: rawProfile } = await adminClient
      .from('profiles')
      .select('id, access_level, status, email, full_name')
      .eq('id', userId)
      .single();

    if (!rawProfile) {
      return { success: false, error: 'Không tìm thấy thông tin người dùng.' };
    }

    const targetProfile: any = rawProfile;

    if (targetProfile.access_level === newRole) {
      return { success: false, error: `Người dùng này đã ở quyền ${newRole}.` };
    }

    // QUY TẮC 2: Hạ quyền Admin -> Kiểm tra với Row Lock chống Race condition (Hệ thống luôn còn >= 1 Admin)
    if (targetProfile.access_level === 'admin' && newRole !== 'admin') {
      const { data: activeAdminCount, error: countErr } = await supabase.rpc(
        'check_active_admin_count_locked'
      );

      if (countErr) {
        return { success: false, error: 'Lỗi kiểm tra số lượng Admin: ' + countErr.message };
      }

      if (activeAdminCount !== null && (activeAdminCount as number) < 2) {
        return {
          success: false,
          error: 'Không thể hạ quyền Admin này. Hệ thống phải duy trì ít nhất 1 Admin hoạt động.',
        };
      }
    }

    // QUY TẮC 5: Nâng quyền Admin -> Bắt buộc xác nhận 2 lớp (gõ đúng email user)
    if (newRole === 'admin') {
      if (!confirmEmail || confirmEmail.trim().toLowerCase() !== (targetProfile.email || '').toLowerCase()) {
        return {
          success: false,
          error: 'Email xác nhận không khớp với địa chỉ email của tài khoản được nâng quyền Admin.',
        };
      }
    }

    // Thực hiện cập nhật role
    const { error: updateErr } = await adminClient
      .from('profiles')
      .update({ access_level: newRole, updated_at: new Date().toISOString() } as any)
      .eq('id', userId);

    if (updateErr) {
      return { success: false, error: 'Cập nhật quyền thất bại: ' + updateErr.message };
    }

    // QUY TẮC 4: Ghi nhật ký admin_action_logs
    await adminClient.from('admin_action_logs').insert({
      admin_id: currentAdmin.id,
      action_type: 'user_update_role',
      content_type: 'profiles',
      affected_ids: [userId],
      payload: {
        target_email: targetProfile.email,
        target_name: targetProfile.full_name,
        old_role: targetProfile.access_level,
        new_role: newRole,
      },
    } as any);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi server khi đổi quyền user' };
  }
}

// ------------------------------------------------------------------------------
// 4. KHÓA VÀ MỞ KHÓA TÀI KHOẢN (BAN / UNBAN USER)
// ------------------------------------------------------------------------------
export async function banUser(input: BanUserInput) {
  try {
    const { user: currentAdmin, supabase } = await verifyAdminServerSide();
    const validation = banUserSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const { userId, reason } = validation.data;

    // QUY TẮC 1: Admin không được tự khóa chính mình
    if (userId === currentAdmin.id) {
      return { success: false, error: 'Bạn không thể tự khóa tài khoản của chính mình.' };
    }

    const adminClient = createAdminClient();
    const { data: rawProfile } = await adminClient
      .from('profiles')
      .select('id, access_level, status, email, full_name')
      .eq('id', userId)
      .single();

    if (!rawProfile) {
      return { success: false, error: 'Không tìm thấy người dùng này.' };
    }

    const targetProfile: any = rawProfile;

    if (targetProfile.status === 'banned') {
      return { success: false, error: 'Tài khoản này đã bị khóa từ trước.' };
    }

    // QUY TẮC 2: Khóa tài khoản Admin -> Kiểm tra số Admin active còn lại
    if (targetProfile.access_level === 'admin') {
      const { data: activeAdminCount } = await supabase.rpc('check_active_admin_count_locked');
      if (activeAdminCount !== null && (activeAdminCount as number) < 2) {
        return {
          success: false,
          error: 'Không thể khóa tài khoản Admin này. Hệ thống phải duy trì ít nhất 1 Admin hoạt động.',
        };
      }
    }

    // LỚP 1: UPDATE profiles.status = 'banned' + banned_reason
    const { error: updateErr } = await adminClient
      .from('profiles')
      .update({
        status: 'banned',
        banned_reason: reason,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', userId);

    if (updateErr) {
      return { success: false, error: 'Lỗi cập nhật trạng thái khóa: ' + updateErr.message };
    }

    // LỚP 2: Gọi Supabase Auth Admin Native Ban API (chặn tầng đăng nhập)
    try {
      await adminClient.auth.admin.updateUserById(userId, { ban_duration: '876000h' });
    } catch (authBanErr: any) {
      console.warn('Supabase Auth Native Ban notice:', authBanErr.message);
    }

    // Ghi nhật ký admin_action_logs
    await adminClient.from('admin_action_logs').insert({
      admin_id: currentAdmin.id,
      action_type: 'user_ban',
      content_type: 'profiles',
      affected_ids: [userId],
      payload: {
        target_email: targetProfile.email,
        target_name: targetProfile.full_name,
        reason,
      },
    } as any);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi server khi khóa tài khoản' };
  }
}

export async function unbanUser(input: UnbanUserInput) {
  try {
    const { user: currentAdmin } = await verifyAdminServerSide();
    const validation = unbanUserSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const { userId } = validation.data;
    const adminClient = createAdminClient();

    const { data: rawProfile } = await adminClient
      .from('profiles')
      .select('id, access_level, status, email, full_name')
      .eq('id', userId)
      .single();

    if (!rawProfile) {
      return { success: false, error: 'Không tìm thấy người dùng này.' };
    }

    const targetProfile: any = rawProfile;

    if (targetProfile.status === 'active') {
      return { success: false, error: 'Tài khoản này đang ở trạng thái hoạt động.' };
    }

    // LỚP 1: UPDATE profiles.status = 'active' & clear banned_reason
    const { error: updateErr } = await adminClient
      .from('profiles')
      .update({
        status: 'active',
        banned_reason: null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', userId);

    if (updateErr) {
      return { success: false, error: 'Lỗi mở khóa tài khoản: ' + updateErr.message };
    }

    // LỚP 2: Gọi Supabase Auth Admin Unban API
    try {
      await adminClient.auth.admin.updateUserById(userId, { ban_duration: 'none' });
    } catch (authUnbanErr: any) {
      console.warn('Supabase Auth Native Unban notice:', authUnbanErr.message);
    }

    // Ghi nhật ký admin_action_logs
    await adminClient.from('admin_action_logs').insert({
      admin_id: currentAdmin.id,
      action_type: 'user_unban',
      content_type: 'profiles',
      affected_ids: [userId],
      payload: {
        target_email: targetProfile.email,
        target_name: targetProfile.full_name,
      },
    } as any);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi server khi mở khóa tài khoản' };
  }
}

// ------------------------------------------------------------------------------
// 5. ADMIN XÓA TÀI KHOẢN USER (DELETE USER)
// ------------------------------------------------------------------------------
export async function deleteUserByAdmin(input: DeleteUserByAdminInput) {
  try {
    const { user: currentAdmin, supabase } = await verifyAdminServerSide();
    const validation = deleteUserByAdminSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const { userId, confirmEmail } = validation.data;

    // QUY TẮC 1: Admin không được tự xóa chính mình
    if (userId === currentAdmin.id) {
      return { success: false, error: 'Bạn không thể tự xóa tài khoản của chính mình.' };
    }

    const adminClient = createAdminClient();
    const { data: rawProfile } = await adminClient
      .from('profiles')
      .select('id, access_level, status, email, full_name')
      .eq('id', userId)
      .single();

    if (!rawProfile) {
      return { success: false, error: 'Không tìm thấy người dùng này trong hệ thống.' };
    }

    const targetProfile: any = rawProfile;

    // QUY TẮC 6: Confirm 2 lớp (gõ đúng email user đích)
    if (confirmEmail.trim().toLowerCase() !== (targetProfile.email || '').toLowerCase()) {
      return {
        success: false,
        error: 'Email xác nhận không khớp với địa chỉ email của tài khoản cần xóa.',
      };
    }

    // QUY TẮC 2: Xóa tài khoản Admin -> Kiểm tra số Admin active còn lại
    if (targetProfile.access_level === 'admin') {
      const { data: activeAdminCount } = await supabase.rpc('check_active_admin_count_locked');
      if (activeAdminCount !== null && (activeAdminCount as number) < 2) {
        return {
          success: false,
          error: 'Không thể xóa tài khoản Admin này. Hệ thống phải duy trì ít nhất 1 Admin hoạt động.',
        };
      }
    }

    // Lấy thống kê tóm tắt trước khi xóa để đối soát trong log
    const { count: totalAttemptsCount } = await adminClient
      .from('test_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Ghi log admin_action_logs TRƯỚC KHI xóa cứng
    await adminClient.from('admin_action_logs').insert({
      admin_id: currentAdmin.id,
      action_type: 'user_delete',
      content_type: 'profiles',
      affected_ids: [userId],
      payload: {
        target_email: targetProfile.email,
        target_name: targetProfile.full_name,
        target_role: targetProfile.access_level,
        stats_summary: {
          total_attempts: totalAttemptsCount || 0,
        },
      },
    } as any);

    // Thực hiện XÓA CỨNG (CASCADE dọn dẹp các bảng phụ thuộc)
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteErr) {
      return { success: false, error: 'Xóa tài khoản thất bại: ' + deleteErr.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi server khi xóa người dùng' };
  }
}

// ------------------------------------------------------------------------------
// 6. GỬI EMAIL RESET MẬT KHẨU HỘ USER
// ------------------------------------------------------------------------------
export async function sendResetPasswordEmailByAdmin(userId: string) {
  try {
    const { user: currentAdmin } = await verifyAdminServerSide();
    const adminClient = createAdminClient();

    const { data: rawProfile } = await adminClient
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (!rawProfile) {
      return { success: false, error: 'Không tìm thấy địa chỉ email của người dùng này.' };
    }

    const targetProfile: any = rawProfile;

    if (!targetProfile.email) {
      return { success: false, error: 'Không tìm thấy địa chỉ email của người dùng này.' };
    }

    // Kiểm tra provider của user
    const { data: authUserData } = await adminClient.auth.admin.getUserById(userId);
    const authUser = authUserData?.user;
    const isGoogle = authUser?.app_metadata?.provider === 'google' ||
      authUser?.identities?.some((id: any) => id.provider === 'google');

    if (isGoogle) {
      return {
        success: false,
        error: 'Tài khoản này đăng nhập qua Google. Không thể gửi email đặt lại mật khẩu.',
      };
    }

    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const origin = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

    const { error: resetErr } = await adminClient.auth.resetPasswordForEmail(
      targetProfile.email,
      {
        redirectTo: `${origin}/reset-password`,
      }
    );

    if (resetErr) {
      return { success: false, error: 'Gửi email thất bại: ' + resetErr.message };
    }

    // Ghi nhật ký admin_action_logs
    await adminClient.from('admin_action_logs').insert({
      admin_id: currentAdmin.id,
      action_type: 'user_reset_password',
      content_type: 'profiles',
      affected_ids: [userId],
      payload: {
        target_email: targetProfile.email,
        target_name: targetProfile.full_name,
      },
    } as any);

    return {
      success: true,
      message: `Đã gửi email hướng dẫn đặt lại mật khẩu đến ${targetProfile.email}.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi server khi gửi email reset mật khẩu' };
  }
}
