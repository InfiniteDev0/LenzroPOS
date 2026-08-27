import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// `isProtectedRoute` and `homeRoute` are app-specific (admin protects
// /admin + /dashboard and comes home to /admin; pos protects everything
// except /auth and comes home to /). Defaults match admin's original
// behavior so existing callers don't need to change.
export async function updateSession(
  request,
  {
    isProtectedRoute = (pathname) => pathname.startsWith("/dashboard") || pathname.startsWith("/admin"),
    homeRoute = "/admin",
  } = {}
) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/auth");

  if (!user && isProtectedRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = homeRoute;
    return NextResponse.redirect(url);
  }

  return response;
}
