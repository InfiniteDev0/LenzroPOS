import { format } from "date-fns"

import { formatCurrency } from "@/lib/currency"
import { EMPLOYEES } from "@/lib/employees"
import { loadReceiptSettings } from "@/lib/receipt-settings"

function escapeHtml(str = "") {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function multilineHtml(text, className) {
  return escapeHtml(text)
    .split("\n")
    .filter(Boolean)
    .map((line) => `<p class="${className}">${line}</p>`)
    .join("");
}

// Mock transactions model one item per order (see mock-transactions.js), so
// this stays a single-line-item layout rather than a multi-item cart —
// matching the actual data shape instead of a fancier reference receipt
// with line items this data doesn't have. "Show comments" has no field to
// gate yet (mock data has no comment/note field) — it's wired up but
// currently a no-op until that data exists.
function receiptHtml(t, settings) {
  const employeeName = EMPLOYEES.find((e) => e.id === t.employeeId)?.name ?? t.employeeId;
  const [businessName, ...addressLines] = settings.header.split("\n").filter(Boolean);

  return `
    <div class="receipt">
      ${settings.printedLogo ? `<img class="logo" src="${settings.printedLogo}" alt="" />` : ""}
      ${businessName ? `<h2>${escapeHtml(businessName)}</h2>` : ""}
      ${addressLines.map((line) => `<p class="muted center">${escapeHtml(line)}</p>`).join("")}
      <hr />
      <p class="muted center">${format(t.timestamp, "d MMM yyyy, h:mm a")}</p>
      <p class="row"><span>ORDER: #${escapeHtml(t.id)}</span><span>CASHIER: ${escapeHtml(employeeName)}</span></p>
      ${settings.showCustomerInfo ? `<p class="row"><span>CUSTOMER:</span><span>Walk-in</span></p>` : ""}
      <hr class="dashed" />
      <p class="row"><span>${escapeHtml(t.itemName)} &times;${t.quantity}</span><span>${formatCurrency(t.gross)}</span></p>
      <p class="muted">${escapeHtml(t.category)}</p>
      <hr class="dashed" />
      <p class="row"><span>Subtotal</span><span>${formatCurrency(t.gross)}</span></p>
      ${t.discount ? `<p class="row"><span>Discount</span><span>-${formatCurrency(t.discount)}</span></p>` : ""}
      ${t.refund ? `<p class="row"><span>Refund</span><span>-${formatCurrency(t.refund)}</span></p>` : ""}
      <p class="row total"><span>TOTAL</span><span>${formatCurrency(t.net)}</span></p>
      <hr class="dashed" />
      <p class="row"><span>PAYMENT METHOD:</span><span>${escapeHtml(t.paymentMethod).toUpperCase()}</span></p>
      <hr />
      ${multilineHtml(settings.footer, "muted center")}
      <div class="barcode"></div>
      <p class="muted center barcode-id">${escapeHtml(t.id)}</p>
    </div>
  `;
}

// Opens a print-ready window with one receipt per transaction (page break
// between each) and triggers the browser print dialog.
export function printReceipts(transactions) {
  if (transactions.length === 0) return;

  const settings = loadReceiptSettings();
  const win = window.open("", "_blank", "width=420,height=640");
  if (!win) return;

  const body = transactions
    .map((t) => receiptHtml(t, settings))
    .join('<div class="page-break"></div>');

  win.document.write(`
    <html>
      <head>
        <title>Receipts</title>
        <style>
          body { font-family: ui-monospace, monospace; padding: 16px; color: #111; }
          .receipt { max-width: 320px; margin: 0 auto 24px; }
          .receipt .logo { display: block; max-width: 120px; max-height: 60px; margin: 0 auto 8px; object-fit: contain; }
          .receipt h2 { margin: 0 0 4px; text-align: center; letter-spacing: 0.05em; }
          .muted { color: #555; margin: 2px 0; font-size: 12px; }
          .center { text-align: center; }
          hr { border: none; border-top: 1px solid #999; margin: 10px 0; }
          hr.dashed { border-top: 1px dashed #999; }
          .row { display: flex; justify-content: space-between; gap: 8px; margin: 3px 0; font-size: 13px; }
          .total { font-weight: bold; font-size: 15px; }
          .page-break { page-break-after: always; }
          .barcode {
            height: 40px;
            margin: 12px auto 4px;
            max-width: 260px;
            background: repeating-linear-gradient(90deg, #111 0 2px, transparent 2px 5px);
          }
          .barcode-id { letter-spacing: 0.15em; font-size: 11px; }
        </style>
      </head>
      <body>${body}</body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
