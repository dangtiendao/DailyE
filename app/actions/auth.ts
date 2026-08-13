'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  dailyGoalSchema,
  deleteAccountSchema,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  DailyGoalInput,
  DeleteAccountInput,
} from '@/lib/validators';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

// Server Action: Đăng nhập bằng Email + Password
export async function loginWithEmail(input: LoginInput) {
  const validation = loginSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { success: false, error: 'Email hoặc mật khẩu không chính xác' };
    }
    if (error.message.toLowerCase().includes('banned') || error.message.toLowerCase().includes('disabled')) {
      return { success: false, error: 'Tài khoản của bạn đã bị khóa bởi Quản trị viên. Vui lòng liên hệ hỗ trợ.' };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Server Action: Đăng ký bằng Email + Password
export async function registerWithEmail(input: RegisterInput) {
  const validation = registerSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
      },
    },
  });

  if (error) {
    if (error.message.includes('User already registered')) {
      return { success: false, error: 'Email này đã được đăng ký tài khoản' };
    }
    return { success: false, error: error.message };
  }

  return { success: true, userId: data.user?.id };
}

// Server Action: Đăng nhập / Đăng ký bằng Google OAuth
export async function loginWithGoogle() {
  const supabase = await createClient();
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { success: true };
}

// Server Action: Đăng xuất tài khoản
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

// Server Action: Cập nhật mục tiêu điểm TOEIC (target_score) trong Profile
export async function updateTargetScore(targetScore: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Bạn chưa đăng nhập' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ target_score: targetScore, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Server Action: Lấy thông tin chi tiết Profile của user hiện tại
export async function getUserProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Xác định provider đăng nhập (google vs email)
  const isGoogle = user.app_metadata?.provider === 'google' || 
    user.identities?.some((id) => id.provider === 'google');
  const provider = isGoogle ? 'google' : 'email';

  const email = profile?.email || user.email || '';

  if (!profile) {
    return {
      id: user.id,
      email,
      fullName: user.user_metadata?.full_name || 'Học viên DailyE',
      accessLevel: 'free' as const,
      status: 'active' as const,
      bannedReason: null,
      dailyGoalMinutes: 15,
      targetScore: 500,
      currentLevel: null,
      provider,
      createdAt: user.created_at,
    };
  }

  return {
    id: profile.id,
    email,
    fullName: profile.full_name,
    accessLevel: profile.access_level,
    status: profile.status || 'active',
    bannedReason: profile.banned_reason || null,
    dailyGoalMinutes: profile.daily_goal_minutes || 15,
    targetScore: profile.target_score || 500,
    currentLevel: profile.current_level,
    provider,
    createdAt: profile.created_at,
  };
}

// Server Action: Cập nhật Họ và tên
export async function updateUserProfile(input: UpdateProfileInput) {
  const validation = updateProfileSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Bạn chưa đăng nhập' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: validation.data.fullName, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Server Action: Cập nhật mục tiêu học tập hàng ngày (phút)
export async function updateDailyGoalMinutes(minutes: number) {
  const validation = dailyGoalSchema.safeParse({ dailyGoalMinutes: minutes });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Bạn chưa đăng nhập' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ daily_goal_minutes: validation.data.dailyGoalMinutes, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Server Action: Đổi mật khẩu (dành cho tài khoản email/password)
export async function changePassword(input: ChangePasswordInput) {
  const validation = changePasswordSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' };
  }

  // Kiểm tra server-side: User Google không được đổi mật khẩu
  const isGoogle = user.app_metadata?.provider === 'google' || 
    user.identities?.some((id) => id.provider === 'google');
  if (isGoogle) {
    return { success: false, error: 'Tài khoản đăng nhập qua Google không hỗ trợ đổi mật khẩu tại đây.' };
  }

  const { error } = await supabase.auth.updateUser({
    password: validation.data.newPassword,
  });

  if (error) {
    if (error.message.includes('same password') || error.message.includes('should be different')) {
      return { success: false, error: 'Mật khẩu mới không được trùng với mật khẩu cũ' };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Server Action: Gửi email quên mật khẩu
export async function sendForgotPasswordEmail(input: ForgotPasswordInput) {
  const validation = forgotPasswordSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

  const { error } = await supabase.auth.resetPasswordForEmail(validation.data.email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    // Vẫn trả về thông báo thành công trung tính để tránh đòn đánh rà quét email
    console.error('Error sending reset password email:', error.message);
  }

  return {
    success: true,
    message: 'Nếu địa chỉ email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi đến hòm thư của bạn.',
  };
}

// Server Action: Đặt lại mật khẩu từ recovery link
export async function resetPassword(input: ResetPasswordInput) {
  const validation = resetPasswordSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: validation.data.newPassword,
  });

  if (error) {
    return { success: false, error: 'Liên kết khôi phục đã hết hạn hoặc không hợp lệ. Vui lòng gửi lại yêu cầu.' };
  }

  return { success: true };
}

// Server Action: Reset tiến độ học của chính user (gọi RPC reset_my_progress)
export async function resetMyProgressAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Bạn chưa đăng nhập' };
  }

  const { data, error } = await supabase.rpc('reset_my_progress');

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Server Action: Xóa tài khoản vĩnh viễn (Server-side admin safety check + auth.admin.deleteUser)
export async function deleteAccountAction(input: DeleteAccountInput) {
  const validation = deleteAccountSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Bạn chưa đăng nhập' };
  }

  // Verify email nhập khớp với email của user
  const userEmail = user.email || '';
  if (validation.data.confirmEmail.toLowerCase() !== userEmail.toLowerCase()) {
    return { success: false, error: 'Email xác nhận không khớp với địa chỉ email tài khoản của bạn.' };
  }

  // Kiểm tra RLS & phân quyền: Nếu user là Admin, kiểm tra số lượng admin active còn lại
  const { data: profile } = await supabase
    .from('profiles')
    .select('access_level, status')
    .eq('id', user.id)
    .single();

  if (profile && profile.access_level === 'admin') {
    const { data: activeAdminCount, error: countError } = await supabase.rpc('check_active_admin_count_locked');
    
    if (countError) {
      return { success: false, error: 'Lỗi kiểm tra quyền hệ thống: ' + countError.message };
    }

    if (activeAdminCount !== null && (activeAdminCount as number) < 2) {
      return {
        success: false,
        error: 'Không thể xóa tài khoản. Bạn là Admin duy nhất còn hoạt động trong hệ thống. Hãy chuyển quyền Admin cho tài khoản khác trước khi xóa.',
      };
    }
  }

  // Thực hiện XÓA CỨNG bằng Service Role Key ở Server-side
  try {
    const adminClient = createAdminClient();
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      return { success: false, error: 'Lỗi khi xóa tài khoản: ' + deleteError.message };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi server khi xóa tài khoản' };
  }

  // Xóa session client & đăng xuất
  await supabase.auth.signOut();

  return { success: true };
}
