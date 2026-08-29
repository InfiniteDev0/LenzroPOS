// Local, per-browser state that has nothing to do with synced data:
// which physical device this install was activated as, which shift is
// currently open on it, and whether the screen is PIN-locked. None of
// this belongs in PowerSync's synced tables — it's specific to this one
// installed instance of the app, not shared account data.

const DEVICE_KEY = "lenzro_pos_device_id";
const SHIFT_KEY = "lenzro_pos_shift";
const LOCKED_KEY = "lenzro_pos_locked";

export function getDeviceId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DEVICE_KEY);
}

export function setDeviceId(id) {
  localStorage.setItem(DEVICE_KEY, id);
}

export function clearDeviceId() {
  localStorage.removeItem(DEVICE_KEY);
}

// { shiftId, employeeId, employeeName }
export function getShiftSession() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SHIFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setShiftSession(session) {
  localStorage.setItem(SHIFT_KEY, JSON.stringify(session));
}

export function clearShiftSession() {
  localStorage.removeItem(SHIFT_KEY);
  localStorage.removeItem(LOCKED_KEY);
}

export function isLocked() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LOCKED_KEY) === "1";
}

export function setLocked(locked) {
  if (locked) localStorage.setItem(LOCKED_KEY, "1");
  else localStorage.removeItem(LOCKED_KEY);
}
