// Fetches real orders/order_items and flattens them into the exact
// "transaction" shape sales-query.js already expects (one row per order
// item) — so the whole filter/aggregation pipeline built for
// mock-transactions.js works unchanged against real data.
//
// Only completed orders are included: voided orders don't exist yet (no
// void action has been built), but filtering here means reports stay
// correct the moment that feature lands, with no change needed here.
//
// A tab order is NOT counted as a sale on the day it's placed — it's a
// debt, not revenue yet. It only becomes a sale once it's FULLY paid off
// (via customer_payment_allocations — see tab-allocation.js and
// IMPROVISING_LOG.md), and it's dated on the day that happened, in full
// — not prorated across whatever partial payments led up to it. A
// still-partially-paid tab order is excluded entirely until then.
//
// No discount/refund tracking exists on orders yet (see ROADMAP.md Phase
// 10 for the design), so every transaction reads discount: 0, refund: 0,
// discountType: null — real zeros, not fabricated data.

const PAYMENT_LABELS = { cash: "Cash", card: "Card", mobile: "Mobile", tab: "Tab" };

const ORDERS_SELECT = `
  id, created_at, payment_method, status, total, customer_id, customer_name,
  shifts ( employee_id, employees ( full_name ) ),
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

  const tabOrderIds = orders.filter((o) => o.payment_method === "tab").map((o) => o.id);
  const { data: allocations, error: allocationsError } = tabOrderIds.length
    ? await supabase
        .from("customer_payment_allocations")
        .select("order_id, amount, created_at")
        .in("order_id", tabOrderIds)
        .order("created_at", { ascending: true })
    : { data: [], error: null };
  if (allocationsError) return { data: null, error: allocationsError };

  const allocationsByOrder = new Map();
  for (const a of allocations) {
    const list = allocationsByOrder.get(a.order_id) ?? [];
    list.push(a);
    allocationsByOrder.set(a.order_id, list);
  }

  // Walks this order's allocations oldest-first; returns the date the
  // running total first reached the order's full amount, or null if it
  // never has (still outstanding — not a sale yet).
  function paidInFullDate(order) {
    const total = Number(order.total);
    let cumulative = 0;
    for (const a of allocationsByOrder.get(order.id) ?? []) {
      cumulative += Number(a.amount);
      if (cumulative >= total - 0.004) return new Date(a.created_at);
    }
    return null;
  }

  const transactions = orders.flatMap((order) => {
    let revenueDate = new Date(order.created_at);

    if (order.payment_method === "tab") {
      const settledOn = paidInFullDate(order);
      if (!settledOn) return []; // still owed — not a sale yet
      revenueDate = settledOn;
    }

    // Attributed via the shift it was rung up under (Phase 7), not
    // `created_by` — every order's created_by is the same shared owner
    // session regardless of which cashier actually rang it up, so it
    // never reflected the real employee.
    const employeeId = order.shifts?.employee_id ?? null;
    const employeeName = order.shifts?.employees?.full_name ?? "Unknown";

    return (order.order_items ?? []).map((oi) => {
      const quantity = Number(oi.quantity);
      const gross = Number(oi.line_total);
      const unitCost = oi.items?.cost != null ? Number(oi.items.cost) : 0;
      const profit = gross - unitCost * quantity;

      return {
        id: oi.id,
        orderId: order.id,
        timestamp: revenueDate,
        employeeId,
        employeeName,
        customerId: order.customer_id,
        customerName: order.customer_name,
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
    });
  });

  return { data: transactions, error: null };
}
