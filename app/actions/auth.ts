'use server';

import { createClient } from '@/lib/supabase/server';
import { loginSchema, registerSchema, LoginInput, RegisterInput } from '@/lib/validators';
import { redirect } from 'next/navigation';

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
    // Trả về thông báo lỗi bằng tiếng Việt
    if (error.message.includes('Invalid login credentials')) {
      return { success: false, error: 'Email hoặc mật khẩu không chính xác' };
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

  // Đăng ký thành công -> Trả về kết quả để client redirect sang /onboarding
  return { success: true, userId: data.user?.id };
}

// Server Action: Đăng nhập / Đăng ký bằng Google OAuth
export async function loginWithGoogle() {
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
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

  if (!profile) {
    return {
      id: user.id,
      email: user.email || '',
      fullName: user.user_metadata?.full_name || 'Học viên DailyE',
      accessLevel: 'free' as const,
      targetScore: 500,
      createdAt: user.created_at,
    };
  }

  return {
    id: profile.id,
    email: user.email || '',
    fullName: profile.full_name,
    accessLevel: profile.access_level,
    targetScore: profile.target_score,
    currentLevel: profile.current_level,
    createdAt: profile.created_at,
  };
}
