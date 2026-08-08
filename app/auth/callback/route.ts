import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Route Handler xử lý Callback từ Google OAuth
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/today';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Nếu có lỗi trao đổi mã authorization code, chuyển hướng về trang login kèm thông báo
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
