import { allocatePayment, computeOutstandingOrders } from "@/lib/tab-allocation"

// Same allocation logic as apps/admin's logCustomerPaymentWithAllocation,
// against the local synced tables instead of Supabase directly — reads
// via powersync.getAll() (one-off, outside of a React render), writes
// via powersync.execute(), same write-local-then-upload pattern as
// everything else in this app.
export async function logCustomerPaymentWithAllocation(
  powersync,
  customerId,
  amount,
  { targetOrderId = null, recordedByEmployeeId = null } = {}
) {
  const tabOrders = await powersync.getAll(
    "SELECT id, total, created_at FROM orders WHERE customer_id = ? AND payment_method = 'tab' ORDER BY created_at ASC",
    [customerId]
  )

  const orderIds = tabOrders.map((o) => o.id)
  const allocations = orderIds.length
    ? await powersync.getAll(
        `SELECT order_id, amount FROM customer_payment_allocations WHERE order_id IN (${orderIds.map(() => "?").join(",")})`,
        orderIds
      )
    : []

  const outstanding = computeOutstandingOrders(tabOrders, allocations)
  const { allocations: toApply, totalAllocated } = allocatePayment(outstanding, amount, targetOrderId)

  if (totalAllocated <= 0) {
    return { actualAmount: 0, error: new Error("Nothing outstanding to apply this to.") }
  }

  const paymentId = crypto.randomUUID()
  const now = new Date().toISOString()

  await powersync.execute(
    "INSERT INTO customer_payments (id, customer_id, amount, created_at, recorded_by_employee_id) VALUES (?, ?, ?, ?, ?)",
    [paymentId, customerId, totalAllocated, now, recordedByEmployeeId]
  )

  for (const a of toApply) {
    await powersync.execute(
      "INSERT INTO customer_payment_allocations (id, payment_id, order_id, amount, created_at) VALUES (?, ?, ?, ?, ?)",
      [crypto.randomUUID(), paymentId, a.order_id, a.amount, now]
    )
  }

  return { actualAmount: totalAllocated, error: null }
}
