import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase Admin Client sử dụng SERVICE ROLE KEY cho Server Actions / Server Components.
// CHỈ dùng ở server-side cho các thao tác quản trị (auth.admin.deleteUser, bypass RLS có kiểm soát).
// TUYỆT ĐỐI KHÔNG import hay truyền key này xuống client.
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('Thiếu biến môi trường SUPABASE_SERVICE_ROLE_KEY ở Server-side.');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
