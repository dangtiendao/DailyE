import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Khởi tạo Supabase client sử dụng trong Server Components, Server Actions và Route Handlers
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Hàm setAll có thể được gọi từ Server Component, nơi cookie không thể thay đổi trực tiếp.
            // Middleware sẽ xử lý việc cập nhật cookie này.
          }
        },
      },
    }
  );
}
