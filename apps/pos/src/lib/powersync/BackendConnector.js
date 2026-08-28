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
    const {
      data: { session },
    } = await this.supabase.auth.getSession();

    if (!session) return null;

    return {
      endpoint: process.env.NEXT_PUBLIC_POWERSYNC_URL,
      token: session.access_token,
    };
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
      // A plain "Failed to fetch" here just means we're offline — routine
      // and expected, not worth alarming a cashier over. Next.js's dev
      // overlay surfaces every console.error as a prominent panel, so
      // only genuinely unexpected upload failures (a rejected write, a
      // validation error, etc.) get logged loudly; the offline case stays
      // silent and just retries next sync attempt.
      const isNetworkFailure = error instanceof TypeError && /fetch/i.test(error.message);
      if (!isNetworkFailure) {
        console.error("PowerSync upload failed, will retry", error);
      }
      throw error;
    }
  }
}
