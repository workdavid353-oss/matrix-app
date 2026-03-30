import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
  locales: ['en', 'he'],
  defaultLocale: 'en',
  localePrefix: 'always',
});

const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/pending'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathWithoutLocale = pathname.replace(/^\/(en|he)/, '') || '/';
  const isPublicPath = PUBLIC_PATHS.some((p) => pathWithoutLocale.startsWith(p));

  let response = intlMiddleware(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Use getSession — reads from cookie, no network call
  const { data: { session } } = await supabase.auth.getSession();

  if (!session && !isPublicPath) {
    const locale = pathname.match(/^\/(en|he)/)?.[1] ?? 'en';
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
  }

  // Redirect logged-in users away from login/register
  if (session && (pathWithoutLocale.startsWith('/auth/login') || pathWithoutLocale.startsWith('/auth/register'))) {
    const locale = pathname.match(/^\/(en|he)/)?.[1] ?? 'en';
    return NextResponse.redirect(new URL(`/${locale}/`, request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
