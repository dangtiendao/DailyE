import { createBrowserClient } from '@supabase/ssr';

// Khởi tạo Supabase client sử dụng trong Browser (Client Components)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
