// Closed trading days, for the owner to review after the fact.
//
// The totals are read straight off the business_days row rather than
// recomputed: they were snapshotted when the day was closed on the till,
// and that snapshot is the point — a day's report must not drift as tabs
// get paid off or late data syncs in. Recomputing here would quietly
// disagree with the report that was printed and signed off at the time.

export async function fetchBusinessDays(supabase) {
  const { data, error } = await supabase
    .from("business_days")
    .select(
      `id, opened_at, closed_at, status, gross_sales, cash_sales, non_cash_sales,
       tab_sales, expenses_total, order_count, note,
       opened_by:employees!business_days_opened_by_employee_id_fkey ( full_name ),
       closed_by:employees!business_days_closed_by_employee_id_fkey ( full_name )`
    )
    .order("opened_at", { ascending: false })

  if (error) return { data: [], error };

  return {
    data: data.map((day) => ({
      id: day.id,
      openedAt: new Date(day.opened_at),
      closedAt: day.closed_at ? new Date(day.closed_at) : null,
      status: day.status,
      grossSales: Number(day.gross_sales ?? 0),
      cashSales: Number(day.cash_sales ?? 0),
      nonCashSales: Number(day.non_cash_sales ?? 0),
      tabSales: Number(day.tab_sales ?? 0),
      expensesTotal: Number(day.expenses_total ?? 0),
      orderCount: day.order_count ?? 0,
      note: day.note,
      openedBy: day.opened_by?.full_name ?? null,
      closedBy: day.closed_by?.full_name ?? null,
    })),
    error: null,
  };
}

// The shifts that made up a day, so the owner can see who worked it and
// whose drawer was over or short.
export async function fetchShiftsForDay(supabase, businessDayId) {
  const { data, error } = await supabase
    .from("shifts")
    .select(
      `id, opened_at, closed_at, opening_float, closing_cash_counted,
       expected_cash, discrepancy, expenses_total, status,
       employees ( full_name )`
    )
    .eq("business_day_id", businessDayId)
    .order("opened_at", { ascending: true })

  if (error) return { data: [], error };

  return {
    data: data.map((shift) => ({
      id: shift.id,
      employeeName: shift.employees?.full_name ?? "—",
      openedAt: new Date(shift.opened_at),
      closedAt: shift.closed_at ? new Date(shift.closed_at) : null,
      openingFloat: Number(shift.opening_float ?? 0),
      countedCash: Number(shift.closing_cash_counted ?? 0),
      expectedCash: Number(shift.expected_cash ?? 0),
      discrepancy: Number(shift.discrepancy ?? 0),
      expensesTotal: Number(shift.expenses_total ?? 0),
      status: shift.status,
    })),
    error: null,
  };
}
