// Central place to turn raw Supabase/Postgres errors into messages a
// non-technical user can actually read. The rule: nothing calls
// toast.error(error.message) directly, anywhere. Always go through
// notifyError() below instead.
//
// Usage:
//   import { notifyError } from "@/lib/errors";
//
//   const { error } = await supabase.from("items").insert(payload);
//   if (error) return notifyError(error, "Couldn't save the item");

import { toast } from "sonner";

// Postgres / PostgREST error codes mapped to plain-English explanations.
// Full PostgREST code list: https://postgrest.org/en/stable/references/errors.html
const KNOWN_ERRORS = {
  PGRST200: "Something's still syncing on our end — try again in a moment.",
  PGRST116: "That record couldn't be found.",
  23505: "That already exists — try a different name or code.",
  23503: "This is linked to other records, so it can't be changed right now.",
  23502: "A required field is missing.",
  42501: "You don't have permission to do that.",
};

// Fallback buckets for errors that don't come with a known Postgres code
// (network failures, expired sessions, schema-cache lag, etc.)
function guessFromMessage(message = "") {
  const m = message.toLowerCase();
  if (m.includes("failed to fetch") || m.includes("network"))
    return "Couldn't connect — check your internet connection and try again.";
  if (m.includes("jwt") || m.includes("session") || m.includes("not authenticated"))
    return "Your session expired — please sign in again.";
  if (m.includes("schema cache") || m.includes("could not find a relationship"))
    return "Still setting up — try again in a moment.";
  if (m.includes("duplicate key")) return "That already exists.";
  return null;
}

export function getFriendlyMessage(error) {
  if (!error) return "Something went wrong. Please try again.";

  const code = error.code;
  if (code && KNOWN_ERRORS[code]) return KNOWN_ERRORS[code];

  const guessed = guessFromMessage(error.message);
  if (guessed) return guessed;

  // Unknown error — safe generic fallback. Never show the raw message.
  return "Something went wrong on our end. Please try again.";
}

// Shows a friendly toast for the user. Logs the real error to the console
// so it's still visible in dev tools / server logs without exposing it to
// the user. Swap the console.error line for Sentry.captureException (or
// similar) once error tracking is wired up — see note in AGENTS.md.
//
// Pass `description` when the call site knows something more specific than
// the generic code-based mapping (e.g. "this category still has items
// assigned to it" instead of the generic 23503 message).
export function notifyError(error, actionLabel = "Something went wrong", description = null) {
  console.error(actionLabel, error);

  toast.error(actionLabel, {
    description: description ?? getFriendlyMessage(error),
  });
}
