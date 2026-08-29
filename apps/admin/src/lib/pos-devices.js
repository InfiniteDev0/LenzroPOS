export function toPosDeviceViewModel(row) {
  return {
    id: row.id,
    name: row.name,
    status: row.status === "activated" ? "Activated" : "Not activated",
    activatedAt: row.activated_at,
  }
}
