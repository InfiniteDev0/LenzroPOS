// See apps/admin/src/lib/errors.js for the full rationale — same rule here:
// nothing calls toast.error(error.message) directly, always go through
// notifyError() instead.

import { toast } from "sonner";

const KNOWN_ERRORS = {
  PGRST200: "Something's still syncing on our end — try again in a moment.",
  PGRST116: "That record couldn't be found.",
  23505: "That already exists — try a different name or code.",
  23503: "This is linked to other records, so it can't be changed right now.",
  23502: "A required field is missing.",
  42501: "You don't have permission to do that.",
};

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

  return "Something went wrong on our end. Please try again.";
}

export function notifyError(error, actionLabel = "Something went wrong", description = null) {
  console.error(actionLabel, error);

  toast.error(actionLabel, {
    description: description ?? getFriendlyMessage(error),
  });
}
