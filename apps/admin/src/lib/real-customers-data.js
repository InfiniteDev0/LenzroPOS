import { allocatePayment, computeOutstandingOrders } from "@/lib/tab-allocation"

// Taken/Paid/Owed are computed at read time, not stored — see
// IMPROVISING_LOG.md for why this is simpler than the original Phase 8
// sketch (no per-ticket settlement, just a running account balance).
export async function fetchCustomersWithBalances(supabase) {
  const [{ data: customers, error: customersError }, { data: orders, error: ordersError }, { data: payments, error: paymentsError }] =
    await Promise.all([
      supabase.from("customers").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("customer_id, total").eq("payment_method", "tab"),
      supabase.from("customer_payments").select("customer_id, amount"),
    ])

  const error = customersError || ordersError || paymentsError
  if (error) return { data: null, error }

  const takenByCustomer = new Map()
  for (const order of orders) {
    if (!order.customer_id) continue
    takenByCustomer.set(order.customer_id, (takenByCustomer.get(order.customer_id) ?? 0) + Number(order.total))
  }

  const paidByCustomer = new Map()
  for (const payment of payments) {
    paidByCustomer.set(
      payment.customer_id,
      (paidByCustomer.get(payment.customer_id) ?? 0) + Number(payment.amount)
    )
  }

  const rows = customers.map((c, index) => ({
    id: c.id,
    name: c.name,
    email: c.email ?? "",
    phone: c.phone ?? "",
    address: c.address ?? "",
    city: c.city ?? "",
    country: c.country ?? "",
    idNumber: c.id_number ?? "",
    createdAt: c.created_at,
    // Display-only, derived from list position (oldest = 1) — not a
    // stored column, so it stays stable regardless of sort order here.
    code: `CLT-${String(customers.length - index).padStart(4, "0")}`,
    taken: takenByCustomer.get(c.id) ?? 0,
    paid: paidByCustomer.get(c.id) ?? 0,
  }))

  return { data: rows, error: null }
}

export async function fetchCustomerById(supabase, customerId) {
  const { data, error } = await supabase.from("customers").select("*").eq("id", customerId).single()
  if (error) return { data: null, error }

  return {
    data: {
      id: data.id,
      name: data.name,
      email: data.email ?? "",
      phone: data.phone ?? "",
      address: data.address ?? "",
      city: data.city ?? "",
      country: data.country ?? "",
      idNumber: data.id_number ?? "",
    },
    error: null,
  }
}

// Per-customer detail: every order they've put on their tab (full receipt
// detail — line items included, so it can be printed same as any other
// receipt), who rang it up (via the shift it was sold under), and when —
// how much of each is still outstanding vs. already cleared — plus every
// payment they've made against the balance, and who recorded it.
export async function fetchCustomerTabDetail(supabase, customerId) {
  const [{ data: orders, error: ordersError }, { data: payments, error: paymentsError }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, subtotal, tax, total, payment_method, created_at, shifts(employee_id, employees(full_name)), order_items(id, name, variant_label, quantity, line_total, items(categories(name)))"
      )
      .eq("customer_id", customerId)
      .eq("payment_method", "tab")
      .order("created_at", { ascending: false }),
    supabase
      .from("customer_payments")
      .select("id, amount, created_at, employees(full_name)")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),
  ])

  const error = ordersError || paymentsError
  if (error) return { data: null, error }

  const orderIds = orders.map((o) => o.id)
  const { data: allocations, error: allocationsError } = orderIds.length
    ? await supabase.from("customer_payment_allocations").select("order_id, amount").in("order_id", orderIds)
    : { data: [], error: null }
  if (allocationsError) return { data: null, error: allocationsError }

  const allocatedByOrder = new Map()
  for (const a of allocations) {
    allocatedByOrder.set(a.order_id, (allocatedByOrder.get(a.order_id) ?? 0) + Number(a.amount))
  }

  return {
    data: {
      orders: orders.map((o) => {
        const total = Number(o.total)
        const amountPaid = allocatedByOrder.get(o.id) ?? 0
        return {
          id: o.id,
          subtotal: Number(o.subtotal),
          tax: Number(o.tax),
          total,
          payment_method: o.payment_method,
          created_at: o.created_at,
          timestamp: new Date(o.created_at),
          employeeId: o.shifts?.employee_id ?? null,
          employeeName: o.shifts?.employees?.full_name ?? "Unknown",
          amountPaid,
          remaining: Math.max(0, Math.round((total - amountPaid) * 100) / 100),
          isFullyPaid: amountPaid >= total - 0.004,
          items: (o.order_items ?? []).map((item) => ({
            ...item,
            quantity: Number(item.quantity),
            line_total: Number(item.line_total),
            category: item.items?.categories?.name ?? "Uncategorized",
          })),
        };
      }),
      payments: payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        timestamp: new Date(p.created_at),
        recordedByName: p.employees?.full_name ?? "Owner",
      })),
    },
    error: null,
  }
}

// Logs a payment and immediately allocates it across this customer's
// outstanding tab orders — oldest first, unless targetOrderId narrows it
// to "clear this one receipt". The amount actually recorded is always
// exactly what got allocated (never more), so Paid always stays in sync
// with what's really been applied — see tab-allocation.js.
export async function logCustomerPaymentWithAllocation(supabase, customerId, amount, targetOrderId = null) {
  const { data: tabOrders, error: ordersError } = await supabase
    .from("orders")
    .select("id, total, created_at")
    .eq("customer_id", customerId)
    .eq("payment_method", "tab")
    .order("created_at", { ascending: true })
  if (ordersError) return { actualAmount: 0, error: ordersError }

  const orderIds = tabOrders.map((o) => o.id)
  const { data: allocations, error: allocationsError } = orderIds.length
    ? await supabase.from("customer_payment_allocations").select("order_id, amount").in("order_id", orderIds)
    : { data: [], error: null }
  if (allocationsError) return { actualAmount: 0, error: allocationsError }

  const outstanding = computeOutstandingOrders(tabOrders, allocations)
  const { allocations: toApply, totalAllocated } = allocatePayment(outstanding, amount, targetOrderId)

  if (totalAllocated <= 0) {
    return { actualAmount: 0, error: new Error("Nothing outstanding to apply this to.") }
  }

  const { data: payment, error: paymentError } = await supabase
    .from("customer_payments")
    .insert({ customer_id: customerId, amount: totalAllocated })
    .select("id")
    .single()
  if (paymentError) return { actualAmount: 0, error: paymentError }

  const { error: insertAllocError } = await supabase
    .from("customer_payment_allocations")
    .insert(toApply.map((a) => ({ payment_id: payment.id, order_id: a.order_id, amount: a.amount })))
  if (insertAllocError) return { actualAmount: 0, error: insertAllocError }

  return { actualAmount: totalAllocated, error: null }
}
