// Every shift the till has run, open or closed.
//
// Unlike the end-of-day report, these numbers are computed rather than
// read from a snapshot: a shift stores its own reconciliation figures
// only once it closes, and an open shift's takings are by definition
// still moving.

export async function fetchShifts(supabase) {
  const { data: shifts, error } = await supabase
    .from("shifts")
    .select(
      `id, opened_at, closed_at, opening_float, closing_cash_counted, expected_cash,
       discrepancy, expenses_total, status, business_day_id,
       employees ( full_name )`
    )
    .order("opened_at", { ascending: false })

  if (error) return { data: [], error };
  if (shifts.length === 0) return { data: [], error: null };

  // Sales per shift, so the list answers "what did that shift take?"
  // without opening each one.
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("shift_id, total, payment_method")
    .in(
      "shift_id",
      shifts.map((s) => s.id)
    )

  if (ordersError) return { data: [], error: ordersError };

  const totalsByShift = new Map()
  for (const order of orders ?? []) {
    const entry = totalsByShift.get(order.shift_id) ?? { orderCount: 0, sales: 0, tabSales: 0 }
    entry.orderCount += 1
    // Tab orders aren't takings — they're credit, and count on the day
    // they're paid off. Same rule the sales report uses.
    if (order.payment_method === "tab") entry.tabSales += Number(order.total) || 0;
    else entry.sales += Number(order.total) || 0;
    totalsByShift.set(order.shift_id, entry)
  }

  return {
    data: shifts.map((shift) => {
      const totals = totalsByShift.get(shift.id) ?? { orderCount: 0, sales: 0, tabSales: 0 }
      const openedAt = new Date(shift.opened_at)
      const closedAt = shift.closed_at ? new Date(shift.closed_at) : null

      return {
        id: shift.id,
        employeeName: shift.employees?.full_name ?? "Unattributed",
        openedAt,
        closedAt,
        // Still running means "so far", which is why this is computed
        // against now rather than a stored end time.
        durationMs: (closedAt ?? new Date()).getTime() - openedAt.getTime(),
        isOpen: shift.status === "open",
        openingFloat: Number(shift.opening_float ?? 0),
        countedCash: shift.closing_cash_counted == null ? null : Number(shift.closing_cash_counted),
        expectedCash: shift.expected_cash == null ? null : Number(shift.expected_cash),
        discrepancy: shift.discrepancy == null ? null : Number(shift.discrepancy),
        expensesTotal: Number(shift.expenses_total ?? 0),
        orderCount: totals.orderCount,
        sales: totals.sales,
        tabSales: totals.tabSales,
      };
    }),
    error: null,
  };
}

export function formatDuration(ms) {
  const minutes = Math.max(0, Math.round(ms / 60000))
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (hours === 0) return `${remainder}m`;
  return `${hours}h ${remainder}m`;
}
