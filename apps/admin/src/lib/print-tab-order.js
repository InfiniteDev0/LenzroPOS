import { formatCurrency } from "@/lib/currency"

function escapeHtml(str = "") {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Same software-only print pattern as apps/pos's print-ticket.js — no
// hardware involved, just the browser's print dialog against a
// print-formatted window.
export function printTabOrder(order, customerName) {
  const win = window.open("", "_blank", "width=420,height=640");
  if (!win) return;

  const rows = order.items
    .map(
      (item) => `
        <p class="row">
          <span>${item.quantity}&times; ${escapeHtml(item.name)}${item.variant_label ? ` (${escapeHtml(item.variant_label)})` : ""}</span>
          <span>${formatCurrency(item.line_total)}</span>
        </p>`
    )
    .join("");

  win.document.write(`
    <html>
      <head>
        <title>Order #${order.id.slice(0, 8)}</title>
        <style>
          body { font-family: ui-monospace, monospace; padding: 16px; color: #111; }
          .receipt { max-width: 320px; margin: 0 auto; }
          .receipt h2 { margin: 0 0 4px; text-align: center; letter-spacing: 0.05em; }
          .muted { color: #555; margin: 2px 0; font-size: 12px; }
          .center { text-align: center; }
          hr { border: none; border-top: 1px solid #999; margin: 10px 0; }
          hr.dashed { border-top: 1px dashed #999; }
          .row { display: flex; justify-content: space-between; gap: 8px; margin: 3px 0; font-size: 13px; }
          .total { font-weight: bold; font-size: 15px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <h2>Lenzro POS</h2>
          <p class="muted center">${new Date(order.created_at).toLocaleString("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</p>
          <p class="row"><span>ORDER #${escapeHtml(order.id.slice(0, 8))}</span><span>${escapeHtml(order.employeeName)}</span></p>
          <p class="row"><span>CUSTOMER:</span><span>${escapeHtml(customerName)}</span></p>
          <hr class="dashed" />
          ${rows}
          <hr class="dashed" />
          <p class="row"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></p>
          <p class="row"><span>Tax</span><span>${formatCurrency(order.tax)}</span></p>
          <p class="row total"><span>TOTAL</span><span>${formatCurrency(order.total)}</span></p>
          <hr class="dashed" />
          <p class="row"><span>PAYMENT:</span><span>ON TAB</span></p>
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
