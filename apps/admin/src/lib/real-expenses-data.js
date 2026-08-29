// Flattens shift_expenses (+ the shift + employee that logged them) into
// the flat shape the admin Expenses report expects. RLS already scopes
// shift_expenses to this account via its parent shift, so no account_id
// filter is needed here — same pattern as fetchRealTransactions.
export async function fetchShiftExpenses(supabase) {
  const { data, error } = await supabase
    .from("shift_expenses")
    .select("id, amount, note, created_at, shifts(employee_id, employees(full_name))")
    .order("created_at", { ascending: false })

  if (error) return { data: null, error }

  const rows = data.map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    note: row.note ?? "",
    timestamp: new Date(row.created_at),
    employeeId: row.shifts?.employee_id ?? null,
    employeeName: row.shifts?.employees?.full_name ?? "Unknown",
  }))

  return { data: rows, error: null }
}
