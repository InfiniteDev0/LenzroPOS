// The trading day — the thing that was missing between "a shift" and
// "the books". A shift is one person on the till; a business day is
// everything that happened between the first shift opening in the morning
// and the owner tapping "End business day" at night.
//
// Opening is implicit: the first shift started when no day is open opens
// one. Making the cashier tap "start the day" before they can tap "start
// my shift" is two screens for one intention.
//
// Closing is explicit, because closing is where the money is counted.

import { round2 } from "@/lib/tab-allocation"

// Returns the id of the open day for this device, opening one if needed.
//
// `supabase` is optional and only used when we're online. The local table
// is only as good as what has synced down, and acting on a stale empty
// result opens a second day that `business_days_one_open_per_device`
// rejects — after which the rejected row is reconciled away and anything
// referencing it (the shift being opened) is orphaned and vanishes too.
// Asking the server settles it when we can; offline, the local answer is
// the best available and the index is the backstop.
export async function ensureBusinessDayOpen(powersync, deviceId, employeeId, supabase = null) {
  const localExisting = await powersync.getOptional(
    "SELECT id FROM business_days WHERE pos_device_id = ? AND status = 'open' LIMIT 1",
    [deviceId]
  )
  if (localExisting?.id) return localExisting.id;

  if (supabase) {
    const { data: remoteExisting, error } = await supabase
      .from("business_days")
      .select("id")
      .eq("pos_device_id", deviceId)
      .eq("status", "open")
      .maybeSingle()
    if (error) throw error;
    if (remoteExisting?.id) return remoteExisting.id;
  }

  const id = crypto.randomUUID()
  await powersync.execute(
    `INSERT INTO business_days
       (id, pos_device_id, opened_at, opened_by_employee_id, status)
     VALUES (?, ?, ?, ?, 'open')`,
    [id, deviceId, new Date().toISOString(), employeeId ?? null]
  )
  return id;
}

export async function getOpenBusinessDay(powersync, deviceId) {
  return powersync.getOptional(
    "SELECT * FROM business_days WHERE pos_device_id = ? AND status = 'open' LIMIT 1",
    [deviceId]
  );
}

// Everything the Z-report shows, computed from the shifts that belong to
// the day. Tab sales are reported separately and excluded from the day's
// takings: an order on credit isn't money in until it's paid off, which
// is the same rule the Sales Report uses (see apps/admin/src/lib/
// real-sales-data.js).
export async function computeDayTotals(powersync, dayId) {
  const shifts = await powersync.getAll(
    "SELECT * FROM shifts WHERE business_day_id = ?",
    [dayId]
  )
  const shiftIds = shifts.map((s) => s.id)

  if (shiftIds.length === 0) {
    return {
      shifts: [],
      orderCount: 0,
      grossSales: 0,
      cashSales: 0,
      nonCashSales: 0,
      tabSales: 0,
      expensesTotal: 0,
      openingFloat: 0,
      expectedCash: 0,
      countedCash: 0,
      discrepancy: 0,
      byPaymentMethod: [],
      openShiftCount: 0,
    };
  }

  const placeholders = shiftIds.map(() => "?").join(", ")

  const orders = await powersync.getAll(
    `SELECT payment_method, total FROM orders WHERE shift_id IN (${placeholders})`,
    shiftIds
  )
  const expenses = await powersync.getAll(
    `SELECT amount FROM shift_expenses WHERE shift_id IN (${placeholders})`,
    shiftIds
  )
  // Which of the owner's payment types count as cash in the drawer.
  const cashTypes = await powersync.getAll(
    "SELECT name FROM payment_types WHERE kind = 'cash'"
  )
  const cashNames = new Set(cashTypes.map((t) => String(t.name).toLowerCase()))
  // "cash" is always drawer money even if the owner renamed or removed
  // the Cash payment type after these sales were rung up.
  cashNames.add("cash")

  const byMethod = new Map()
  let grossSales = 0
  let cashSales = 0
  let nonCashSales = 0
  let tabSales = 0

  for (const order of orders) {
    const method = order.payment_method ?? "unknown"
    const total = Number(order.total) || 0
    byMethod.set(method, round2((byMethod.get(method) ?? 0) + total))

    if (method === "tab") {
      tabSales += total
      continue
    }
    grossSales += total
    if (cashNames.has(String(method).toLowerCase())) cashSales += total;
    else nonCashSales += total;
  }

  const expensesTotal = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const openingFloat = shifts.reduce((sum, s) => sum + (Number(s.opening_float) || 0), 0)
  const countedCash = shifts.reduce(
    (sum, s) => sum + (Number(s.closing_cash_counted) || 0),
    0
  )
  const closedShifts = shifts.filter((s) => s.status === "closed")
  const discrepancy = closedShifts.reduce((sum, s) => sum + (Number(s.discrepancy) || 0), 0)

  return {
    shifts,
    orderCount: orders.length,
    grossSales: round2(grossSales),
    cashSales: round2(cashSales),
    nonCashSales: round2(nonCashSales),
    tabSales: round2(tabSales),
    expensesTotal: round2(expensesTotal),
    openingFloat: round2(openingFloat),
    // What should be in the drawer across the day: floats in, plus cash
    // taken, minus cash paid out as expenses.
    expectedCash: round2(openingFloat + cashSales - expensesTotal),
    countedCash: round2(countedCash),
    discrepancy: round2(discrepancy),
    byPaymentMethod: [...byMethod.entries()]
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => b.amount - a.amount),
    openShiftCount: shifts.length - closedShifts.length,
  };
}

// Snapshots the totals onto the row so the day's report can't drift later
// — the same reason a shift stores its own discrepancy instead of
// recomputing it. RLS only allows updating a day while status = 'open',
// so this is one-way.
export async function closeBusinessDay(powersync, dayId, employeeId, note) {
  const totals = await computeDayTotals(powersync, dayId)

  if (totals.openShiftCount > 0) {
    throw new Error("Close the open shift before ending the business day.");
  }

  await powersync.execute(
    `UPDATE business_days
        SET status = 'closed',
            closed_at = ?,
            closed_by_employee_id = ?,
            gross_sales = ?,
            cash_sales = ?,
            non_cash_sales = ?,
            tab_sales = ?,
            expenses_total = ?,
            order_count = ?,
            note = ?
      WHERE id = ?`,
    [
      new Date().toISOString(),
      employeeId ?? null,
      totals.grossSales,
      totals.cashSales,
      totals.nonCashSales,
      totals.tabSales,
      totals.expensesTotal,
      totals.orderCount,
      note || null,
      dayId,
    ]
  )

  return totals;
}
