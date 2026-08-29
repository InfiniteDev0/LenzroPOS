import { updateSession } from "@lenzro/supabase/middleware";

export async function proxy(request) {
  return updateSession(request, {
    // /serwist serves the compiled service worker and /manifest.webmanifest
    // backs the install prompt — both must be fetchable (and the SW must
    // be able to precache /auth) without a session, same as /auth itself,
    // so the app is installable even before the first login.
    //
    // /@powersync holds PowerSync's SQLite worker and wasm bundles, copied
    // into public/ at build time. They're static assets, not pages, and
    // must never be auth-gated: a redirected worker request doesn't fail
    // loudly, it succeeds and returns the login page's HTML, which the
    // browser then refuses as a module script ("non-JavaScript MIME type
    // of text/html") and PowerSync dies with no usable error.
    isProtectedRoute: (pathname) =>
      !pathname.startsWith("/auth") &&
      !pathname.startsWith("/serwist") &&
      !pathname.startsWith("/@powersync") &&
      pathname !== "/manifest.webmanifest",
    homeRoute: "/",
  });
}

export const config = {
  // Excluded here too, so the middleware doesn't even run for the worker
  // bundles — same treatment as _next/static.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|@powersync|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
