import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Middleware bảo vệ các đường dẫn Learner và Admin dựa trên Supabase Auth Session
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Lấy thông tin user hiện tại
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Danh sách các route thuộc về Learner bắt buộc đăng nhập
  const isLearnerRoute =
    pathname.startsWith('/today') ||
    pathname.startsWith('/learn') ||
    pathname.startsWith('/practice') ||
    pathname.startsWith('/progress') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/onboarding');

  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');

  // 1. Chưa đăng nhập mà truy cập đường dẫn Learner hoặc Admin -> Redirect về /login
  if (!user && (isLearnerRoute || isAdminRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // 2. Đã đăng nhập mà truy cập trang /login hoặc /register -> Redirect về /today
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/today';
    return NextResponse.redirect(url);
  }

  // 3. Đã đăng nhập nhưng truy cập trang /admin -> Kiểm tra quyền access_level = 'admin'
  if (user && isAdminRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('access_level')
      .eq('id', user.id)
      .single();

    if (!profile || profile.access_level !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/today';
      url.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/today/:path*',
    '/learn/:path*',
    '/practice/:path*',
    '/progress/:path*',
    '/profile/:path*',
    '/onboarding/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
};
