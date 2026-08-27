import { updateSession } from "@lenzro/supabase/middleware";

export async function proxy(request) {
  return updateSession(request, {
    isProtectedRoute: (pathname) => !pathname.startsWith("/auth"),
    homeRoute: "/",
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
