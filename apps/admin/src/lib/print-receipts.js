import { format } from "date-fns"

import { formatCurrency } from "@/lib/currency"
import { EMPLOYEES } from "@/lib/employees"

function receiptHtml(t) {
  const employeeName = EMPLOYEES.find((e) => e.id === t.employeeId)?.name ?? t.employeeId

  return `
    <div class="receipt">
      <h2>Lenzro POS</h2>
      <p class="muted">Receipt ${t.id}</p>
      <p class="muted">${format(t.timestamp, "d MMM yyyy, h:mm a")}</p>
      <hr />
      <p>${t.itemName} &times;${t.quantity}</p>
      <p class="muted">${t.category} &middot; ${t.paymentMethod}</p>
      <p class="muted">Served by ${employeeName}</p>
      <hr />
      <p class="row"><span>Gross</span><span>${formatCurrency(t.gross)}</span></p>
      ${t.discount ? `<p class="row"><span>Discount</span><span>-${formatCurrency(t.discount)}</span></p>` : ""}
      ${t.refund ? `<p class="row"><span>Refund</span><span>-${formatCurrency(t.refund)}</span></p>` : ""}
      <p class="row total"><span>Net</span><span>${formatCurrency(t.net)}</span></p>
    </div>
  `;
}

// Opens a print-ready window with one receipt per transaction (page break
// between each) and triggers the browser print dialog.
export function printReceipts(transactions) {
  if (transactions.length === 0) return;

  const win = window.open("", "_blank", "width=420,height=640");
  if (!win) return;

  const body = transactions
    .map((t) => receiptHtml(t))
    .join('<div class="page-break"></div>');

  win.document.write(`
    <html>
      <head>
        <title>Receipts</title>
        <style>
          body { font-family: ui-monospace, monospace; padding: 16px; color: #111; }
          .receipt { max-width: 320px; margin: 0 auto 24px; }
          .receipt h2 { margin: 0 0 4px; }
          .muted { color: #666; margin: 2px 0; }
          hr { border: none; border-top: 1px dashed #999; margin: 10px 0; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
          .total { font-weight: bold; }
          .page-break { page-break-after: always; }
        </style>
      </head>
      <body>${body}</body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
