// Pure allocation math — identical copy of apps/admin's version (no
// shared package between the two apps for business logic yet — see
// IMPROVISING_LOG.md). A payment's logged amount is always exactly what
// ends up allocated, never more — that's what keeps Owed = Taken - Paid
// correct without drifting.

function round2(n) {
  return Math.round(n * 100) / 100;
}

// tabOrders: [{ id, total, created_at }], allocations: [{ order_id, amount }]
export function computeOutstandingOrders(tabOrders, allocations) {
  const allocatedByOrder = new Map()
  for (const a of allocations) {
    allocatedByOrder.set(a.order_id, (allocatedByOrder.get(a.order_id) ?? 0) + Number(a.amount))
  }

  return tabOrders
    .map((o) => ({ ...o, remaining: round2(Number(o.total) - (allocatedByOrder.get(o.id) ?? 0)) }))
    .filter((o) => o.remaining > 0.004)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}

// Oldest-first unless targetOrderId narrows it to one specific order
// ("clear this receipt"). Caps at what's actually outstanding — never
// allocates more than exists to allocate.
export function allocatePayment(outstandingOldestFirst, amount, targetOrderId = null) {
  const orders = targetOrderId
    ? outstandingOldestFirst.filter((o) => o.id === targetOrderId)
    : outstandingOldestFirst

  let remaining = amount
  const allocations = []

  for (const order of orders) {
    if (remaining <= 0.004) break
    const alloc = Math.min(order.remaining, remaining)
    if (alloc <= 0.004) continue
    allocations.push({ order_id: order.id, amount: round2(alloc) })
    remaining -= alloc
  }

  const totalAllocated = round2(allocations.reduce((sum, a) => sum + a.amount, 0))
  return { allocations, totalAllocated }
}
