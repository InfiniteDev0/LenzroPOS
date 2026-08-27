import { format } from "date-fns"

function csvCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

// Builds a CSV of the given transactions and triggers a browser download.
export function exportTransactionsCsv(transactions, filename = "receipts.csv") {
  const headers = [
    "Receipt",
    "Date",
    "Time",
    "Employee",
    "Item",
    "Quantity",
    "Category",
    "Payment",
    "Gross",
    "Discount",
    "Refund",
    "Net",
  ];

  const rows = transactions.map((t) => [
    t.id,
    format(t.timestamp, "yyyy-MM-dd"),
    format(t.timestamp, "HH:mm"),
    t.employeeName ?? t.employeeId,
    t.itemName,
    t.quantity,
    t.category,
    t.paymentMethod,
    t.gross,
    t.discount,
    t.refund,
    t.net,
  ]);

  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
