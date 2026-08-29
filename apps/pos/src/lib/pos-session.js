// Local, per-browser state that has nothing to do with synced data:
// which physical device this install was activated as, who is signed in
// at the till, which shift is currently open, and whether the screen is
// PIN-locked. None of this belongs in PowerSync's synced tables — it's
// specific to this one installed instance of the app, not shared account
// data.
//
// Three separate ideas, deliberately not one:
//
//   Device   — activated once with a real Supabase login. Permanent.
//   Staff    — who is at the till right now, proven by their PIN. This is
//              the day-to-day credential; the Supabase session is never
//              signed out, so staff never see an email/password screen.
//   Shift    — a counted drawer. Only exists when the owner has Shifts
//              turned on in Settings > Features; the till sells fine
//              without one.
//
// Exposed as a subscribable store (see useSession below) rather than
// read once into useState on mount: localStorage is an external system,
// several components write to it, and every reader needs to see the
// change. It also can't be read during SSR, which useSyncExternalStore
// handles properly via its server snapshot.

const DEVICE_KEY = "lenzro_pos_device_id";
const STAFF_KEY = "lenzro_pos_staff";
const SHIFT_KEY = "lenzro_pos_shift";
const LOCKED_KEY = "lenzro_pos_locked";

const listeners = new Set();

// useSyncExternalStore compares snapshots by identity, so parsed objects
// have to be cached — re-parsing the JSON on every read would hand back a
// new object each time and spin the component forever.
const cache = new Map();

function notify() {
  cache.clear();
  for (const listener of listeners) listener();
}

export function subscribeSession(listener) {
  listeners.add(listener);
  // Another tab signing out (or activating a device) should be reflected
  // here too — `storage` only fires in *other* tabs, which is exactly the
  // case our own notify() doesn't cover.
  const onStorage = () => notify();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function readJson(key) {
  if (cache.has(key)) return cache.get(key);
  const raw = localStorage.getItem(key);
  let value = null;
  if (raw) {
    try {
      value = JSON.parse(raw);
    } catch {
      value = null;
    }
  }
  cache.set(key, value);
  return value;
}

export function getDeviceId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DEVICE_KEY);
}

export function setDeviceId(id) {
  localStorage.setItem(DEVICE_KEY, id);
  notify();
}

export function clearDeviceId() {
  localStorage.removeItem(DEVICE_KEY);
  notify();
}

// { employeeId, employeeName, role }
export function getStaffSession() {
  if (typeof window === "undefined") return null;
  return readJson(STAFF_KEY);
}

export function setStaffSession(session) {
  localStorage.setItem(STAFF_KEY, JSON.stringify(session));
  notify();
}

export function clearStaffSession() {
  localStorage.removeItem(STAFF_KEY);
  localStorage.removeItem(LOCKED_KEY);
  notify();
}

// { shiftId, businessDayId }
export function getShiftSession() {
  if (typeof window === "undefined") return null;
  return readJson(SHIFT_KEY);
}

export function setShiftSession(session) {
  localStorage.setItem(SHIFT_KEY, JSON.stringify(session));
  notify();
}

export function clearShiftSession() {
  localStorage.removeItem(SHIFT_KEY);
  notify();
}

export function isLocked() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LOCKED_KEY) === "1";
}

export function setLocked(locked) {
  if (locked) localStorage.setItem(LOCKED_KEY, "1");
  else localStorage.removeItem(LOCKED_KEY);
  notify();
}
