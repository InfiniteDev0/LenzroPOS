// Fetches real orders/order_items and flattens them into the exact
// "transaction" shape sales-query.js already expects (one row per order
// item) — so the whole filter/aggregation pipeline built for
// mock-transactions.js works unchanged against real data.
//
// Only completed orders are included: voided orders don't exist yet (no
// void action has been built), but filtering here means reports stay
// correct the moment that feature lands, with no change needed here.
//
// No discount/refund tracking exists on orders yet (see ROADMAP.md Phase
// 10 for the design), so every transaction reads discount: 0, refund: 0,
// discountType: null — real zeros, not fabricated data.

const PAYMENT_LABELS = { cash: "Cash", card: "Card", mobile: "Mobile" };

const ORDERS_SELECT = `
  id, created_at, created_by, payment_method, status,
  order_items (
    id, name, quantity, unit_price, line_total, item_id,
    items ( cost, categories ( name ) )
  )
`;

export async function fetchRealTransactions(supabase) {
  const { data: orders, error } = await supabase
    .from("orders")
    .select(ORDERS_SELECT)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) return { data: null, error };

  const employeeIds = [...new Set(orders.map((o) => o.created_by))];
  const { data: profiles, error: profilesError } = employeeIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", employeeIds)
    : { data: [], error: null };

  if (profilesError) return { data: null, error: profilesError };

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name || "Unnamed"]));

  const transactions = orders.flatMap((order) =>
    (order.order_items ?? []).map((oi) => {
      const quantity = Number(oi.quantity);
      const gross = Number(oi.line_total);
      const unitCost = oi.items?.cost != null ? Number(oi.items.cost) : 0;
      const profit = gross - unitCost * quantity;

      return {
        id: oi.id,
        timestamp: new Date(order.created_at),
        employeeId: order.created_by,
        employeeName: nameById.get(order.created_by) ?? "Unknown",
        itemName: oi.name,
        category: oi.items?.categories?.name ?? "Uncategorized",
        quantity,
        paymentMethod: PAYMENT_LABELS[order.payment_method] ?? order.payment_method,
        discountType: null,
        gross,
        discount: 0,
        refund: 0,
        net: gross,
        profit,
      };
    })
  );

  return { data: transactions, error: null };
}
