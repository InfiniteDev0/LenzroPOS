// "Owner" isn't assignable from the Add/Edit employee dialog — there's
// exactly one Owner row per account, auto-created alongside the account's
// profile on signup (see the 0006 migration's handle_new_user trigger).
export const ASSIGNABLE_EMPLOYEE_ROLES = ["Administrator", "Manager", "Cashier"]

export const AVATAR_COLORS = [
  "bg-emerald-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
]

// Deterministic per-employee color so it doesn't reshuffle on every reload.
export function avatarColorFor(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

// Maps a real `employees` row (DB shape) to the flat shape the existing
// Employee/Owner dialogs and table already expect (UI built before the
// real schema existed — keep the UI, adapt the data at the boundary).
export function toEmployeeViewModel(row) {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    pin: row.pos_pin ?? "",
    pinEnabled: row.pos_pin_enabled,
    status: row.status,
    color: avatarColorFor(row.id),
  }
}
