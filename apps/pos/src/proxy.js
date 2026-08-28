import { updateSession } from "@lenzro/supabase/middleware";

export async function proxy(request) {
  return updateSession(request, {
    // /serwist serves the compiled service worker and /manifest.webmanifest
    // backs the install prompt — both must be fetchable (and the SW must
    // be able to precache /auth) without a session, same as /auth itself,
    // so the app is installable even before the first login.
    isProtectedRoute: (pathname) =>
      !pathname.startsWith("/auth") &&
      !pathname.startsWith("/serwist") &&
      pathname !== "/manifest.webmanifest",
    homeRoute: "/",
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
