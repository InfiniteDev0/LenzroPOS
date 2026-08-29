import { UpdateType } from "@powersync/web";

import { createClient } from "@lenzro/supabase/client";

// Bridges PowerSync's local SQLite database to Supabase: fetchCredentials
// hands PowerSync the current session's JWT (PowerSync validates it via
// the "Use Supabase Auth" JWKS setup on the instance, not a separate
// token service), and uploadData replays queued local writes through the
// normal supabase-js client — so RLS and column defaults (account_id,
// created_by, status) behave exactly as they did before PowerSync existed.
export class BackendConnector {
  constructor() {
    this.supabase = createClient();
  }

  async fetchCredentials() {
    const endpoint = process.env.NEXT_PUBLIC_POWERSYNC_URL;

    // A missing endpoint is a deployment mistake, not a runtime state, and
    // it otherwise surfaces as a confusing sync failure much later. Say so
    // plainly instead.
    if (!endpoint) {
      throw new Error(
        "NEXT_PUBLIC_POWERSYNC_URL is not set — the till can't reach PowerSync."
      );
    }

    const {
      data: { session },
    } = await this.supabase.auth.getSession();

    // Null tells PowerSync to hold off and ask again. This is routine, not
    // a fault: the provider mounts on /auth too, so the first request for
    // credentials often happens before anyone has signed in.
    if (!session) return null;

    return { endpoint, token: session.access_token };
  }

  async uploadData(database) {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    try {
      for (const op of transaction.crud) {
        const table = this.supabase.from(op.table);

        switch (op.op) {
          case UpdateType.PUT:
            await table.upsert({ ...op.opData, id: op.id }).throwOnError();
            break;
          case UpdateType.PATCH:
            await table.update(op.opData).eq("id", op.id).throwOnError();
            break;
          case UpdateType.DELETE:
            await table.delete().eq("id", op.id).throwOnError();
            break;
        }
      }

      await transaction.complete();
    } catch (error) {
      // Don't call transaction.complete() on failure — leaving the
      // transaction pending means PowerSync retries it once connectivity
      // (or whatever caused the failure) recovers, instead of silently
      // dropping the order.
      //
      // A transport failure here just means we're offline — routine and
      // expected, not worth alarming a cashier over. Next.js's dev
      // overlay surfaces every console.error as a prominent panel, so
      // only genuinely unexpected upload failures (a rejected write, a
      // validation error, etc.) get logged loudly; the offline case stays
      // silent and just retries next sync attempt.
      //
      // Matching on the message doesn't work: browsers word this
      // differently ("Failed to fetch" in Chrome, "NetworkError when
      // attempting to fetch resource" in Firefox, "Load failed" in
      // Safari, plain "network error" elsewhere), and an earlier
      // /fetch/i test let "network error" through and dev-overlaid it.
      // supabase-js reports real API failures as PostgrestError, never a
      // TypeError, so any TypeError reaching here is the transport
      // giving up rather than the server rejecting the write.
      const isNetworkFailure = error instanceof TypeError;
      if (!isNetworkFailure) {
        console.error("PowerSync upload failed, will retry", error);
      }
      throw error;
    }
  }
}
