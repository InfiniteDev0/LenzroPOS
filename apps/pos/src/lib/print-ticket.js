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

// Software-only receipt print — opens the browser's print dialog against a
// print-formatted window. This is deliberately NOT the thermal/ESC-POS
// hardware path (WebUSB/Web Serial) — that's still deferred (see Phase 10)
// per an earlier explicit call to keep this app hardware-free for now.
// Printing to whatever default printer/PDF the OS offers needs none of
// that and closes a real gap in the meantime.
//
// `receipt` is the owner's Settings > Receipt config, synced down onto the
// account_settings row. Until migration 0015 this printed a hardcoded
// "Lenzro POS" header regardless of what the owner had configured.
export function printTicket(order, items, employeeName, receipt = {}) {
  const win = window.open("", "_blank", "width=420,height=640");
  if (!win) return;

  const isPreview = order.id === "PREVIEW";
  const orderLabel = isPreview ? "BILL PREVIEW" : `ORDER #${escapeHtml(order.id.slice(0, 8))}`;

  // First line of the header is the shop name, the rest is the address
  // block under it — same convention as the admin's receipt printer.
  const headerLines = String(receipt.receipt_header ?? "").split("\n").filter(Boolean);
  const [businessName, ...addressLines] = headerLines;
  const footerLines = String(receipt.receipt_footer ?? "").split("\n").filter(Boolean);

  const rows = items
    .map(
      (line) => `
        <p class="row">
          <span>${line.quantity}&times; ${escapeHtml(line.name)}${line.variant_label ? ` (${escapeHtml(line.variant_label)})` : ""}</span>
          <span>${formatCurrency(line.line_total)}</span>
        </p>`
    )
    .join("");

  win.document.write(`
    <html>
      <head>
        <title>${isPreview ? "Bill preview" : `Order #${order.id.slice(0, 8)}`}</title>
        <style>
          body { font-family: ui-monospace, monospace; padding: 16px; color: #111; }
          .receipt { max-width: 320px; margin: 0 auto; }
          .receipt .logo { display: block; max-width: 120px; max-height: 60px; margin: 0 auto 8px; object-fit: contain; }
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
          ${receipt.receipt_logo_url ? `<img class="logo" src="${escapeHtml(receipt.receipt_logo_url)}" alt="" />` : ""}
          <h2>${escapeHtml(businessName || "Lenzro POS")}</h2>
          ${addressLines.map((line) => `<p class="muted center">${escapeHtml(line)}</p>`).join("")}
          <p class="muted center">${formatTimestamp(order.created_at)}</p>
          <p class="row"><span>${orderLabel}</span><span>${escapeHtml(employeeName)}</span></p>
          ${
            receipt.receipt_show_customer && order.customer_name
              ? `<p class="row"><span>CUSTOMER:</span><span>${escapeHtml(order.customer_name)}</span></p>`
              : ""
          }
          <hr class="dashed" />
          ${rows}
          <hr class="dashed" />
          <p class="row"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></p>
          ${order.discount_amount > 0 ? `<p class="row"><span>Discount</span><span>&minus;${formatCurrency(order.discount_amount)}</span></p>` : ""}
          <p class="row"><span>Tax</span><span>${formatCurrency(order.tax)}</span></p>
          <p class="row total"><span>TOTAL</span><span>${formatCurrency(order.total)}</span></p>
          <hr class="dashed" />
          <p class="row"><span>PAYMENT:</span><span>${escapeHtml(order.payment_method).toUpperCase()}</span></p>
          ${footerLines.length > 0 ? `<hr />${footerLines.map((line) => `<p class="muted center">${escapeHtml(line)}</p>`).join("")}` : ""}
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
