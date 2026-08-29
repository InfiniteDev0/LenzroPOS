/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import { Serwist } from "serwist";

// Source maps must not be precached. PowerSync's copy-assets step emits a
// .js.map beside every worker bundle, and Vercel answers those with 403 in
// production. Precaching is all-or-nothing: one bad response aborts the
// whole install, so the service worker never activates and the browser
// keeps serving whatever it cached last — which looks exactly like a
// deploy that didn't take effect.
//
// They're debug artifacts nothing offline needs, and they were roughly
// half the precache payload.
function withoutSourceMaps(entries) {
  return (entries ?? []).filter((entry) => {
    const url = typeof entry === "string" ? entry : entry?.url;
    return typeof url === "string" && !url.endsWith(".map");
  });
}

const serwist = new Serwist({
  precacheEntries: withoutSourceMaps(self.__SW_MANIFEST),
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
