import { createSerwistRoute } from "@serwist/turbopack";

// Compiles src/app/sw.js through esbuild at build time and serves it as a
// static route (e.g. /serwist/sw.js) — no webpack plugin, so this stays
// compatible with Turbopack instead of forcing a --webpack build like
// next-pwa would.
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    swSrc: "src/app/sw.js",
    useNativeEsbuild: true,
    // PowerSync's SQLite WASM binaries (~2.3-2.5MB each) exceed the
    // default 2MB precache limit. Without this they're skipped, which
    // would break a fully cold-started offline app open (browser closed,
    // reopened with zero network) — PowerSync couldn't initialize its
    // local database at all in that case.
    maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
  });
