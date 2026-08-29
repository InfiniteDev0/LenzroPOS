import { formatCurrency } from "@/lib/currency"

function escapeHtml(str = "") {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function row(label, value, className = "") {
  return `<p class="row ${className}"><span>${escapeHtml(label)}</span><span>${value}</span></p>`;
}

// The end-of-day (Z) report, printed the same software-only way receipts
// are — the browser's print dialog, no thermal/ESC-POS hardware path (see
// printTicket for why that's still deferred).
export function printDayReport({ businessDay, totals, employeeName, note }) {
  const win = window.open("", "_blank", "width=420,height=720");
  if (!win) return;

  const methodRows = totals.byPaymentMethod
    .filter((entry) => entry.method !== "tab")
    .map((entry) => row(entry.method, formatCurrency(entry.amount)))
    .join("");

  const discrepancyLabel =
    totals.discrepancy === 0
      ? "Exact"
      : totals.discrepancy > 0
        ? `${formatCurrency(totals.discrepancy)} over`
        : `${formatCurrency(Math.abs(totals.discrepancy))} short`;

  win.document.write(`
    <html>
      <head>
        <title>End of day — ${escapeHtml(formatTimestamp(businessDay.opened_at))}</title>
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
          .section { margin-top: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #555; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <h2>END OF DAY</h2>
          <p class="muted center">Lenzro POS</p>
          <p class="muted center">
            Opened ${escapeHtml(formatTimestamp(businessDay.opened_at))}<br />
            Closed ${escapeHtml(formatTimestamp(new Date().toISOString()))}
          </p>
          <p class="muted center">Closed by ${escapeHtml(employeeName ?? "—")}</p>
          <hr class="dashed" />

          <p class="section">Sales</p>
          ${row("Orders", totals.orderCount)}
          ${methodRows}
          ${row("Total taken", formatCurrency(totals.grossSales), "total")}
          ${
            totals.tabSales > 0
              ? `<hr class="dashed" /><p class="section">On tab (not in takings)</p>${row("Put on tabs", formatCurrency(totals.tabSales))}`
              : ""
          }

          <hr class="dashed" />
          <p class="section">Drawer</p>
          ${row("Opening floats", formatCurrency(totals.openingFloat))}
          ${row("Cash sales", formatCurrency(totals.cashSales))}
          ${row("Expenses", `&minus;${formatCurrency(totals.expensesTotal)}`)}
          ${row("Expected cash", formatCurrency(totals.expectedCash), "total")}
          ${row("Counted", formatCurrency(totals.countedCash))}
          ${row("Over / short", escapeHtml(discrepancyLabel), "total")}

          <hr class="dashed" />
          ${row("Shifts worked", totals.shifts.length)}
          ${note ? `<p class="muted">Note: ${escapeHtml(note)}</p>` : ""}
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
