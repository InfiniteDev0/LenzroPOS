// Deletes the .map files that `powersync-web copy-assets` drops beside
// every worker bundle in public/@powersync/.
//
// They can't just be filtered out of the service worker's precache list:
// Vercel answers source-map requests with 403, precaching is
// all-or-nothing, and one bad response aborts the whole install — so the
// service worker never activates and the browser keeps serving whatever
// it cached last. A deploy that landed perfectly then looks like it
// never happened.
//
// Filtering at runtime relies on the new worker actually installing to
// take effect, which is the very thing that's broken. Deleting the files
// removes them from the build manifest instead, so nothing can request
// them at all. They're debug artifacts; nothing offline needs them.

import { readdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../public/@powersync/", import.meta.url));

if (!existsSync(dir)) {
  console.log("strip-worker-sourcemaps: nothing to do, public/@powersync/ is absent");
  process.exit(0);
}

const entries = readdirSync(dir, { recursive: true, withFileTypes: true });
let removed = 0;

for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith(".map")) continue;
  rmSync(join(entry.parentPath ?? entry.path ?? dir, entry.name), { force: true });
  removed += 1;
}

console.log(`strip-worker-sourcemaps: removed ${removed} source map${removed === 1 ? "" : "s"}`);
