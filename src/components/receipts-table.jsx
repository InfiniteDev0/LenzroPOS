"use client"

import { useState } from "react"
import { format } from "date-fns"
import { PrinterIcon } from "lucide-react"

import { formatCurrency } from "@/lib/currency"
import { EMPLOYEES } from "@/lib/employees"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export function ReceiptsTable({ transactions, selectedIds, onToggleRow, onToggleRows, onPrintOne }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const pageCount = Math.max(1, Math.ceil(transactions.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRows = transactions.slice((safePage - 1) * pageSize, safePage * pageSize)
  const pageIds = pageRows.map((t) => t.id)
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))

  function changePageSize(value) {
    setPageSize(Number(value))
    setPage(1)
  }

  return (
    <Card className={'bg-background'}>
      <CardContent className="px-2 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <Checkbox
                  checked={allOnPageSelected}
                  onCheckedChange={(checked) => onToggleRows(pageIds, Boolean(checked))} />
              </TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead>Date &amp; time</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Refund</TableHead>
              <TableHead className="text-right">Net</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="py-10 text-center text-muted-foreground">
                  No receipts match these filters
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((t) => (
                <TableRow key={t.id} data-state={selectedIds.has(t.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(t.id)}
                      onCheckedChange={() => onToggleRow(t.id)} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{t.id}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(t.timestamp, "d MMM, h:mm a")}
                  </TableCell>
                  <TableCell>{EMPLOYEES.find((e) => e.id === t.employeeId)?.name ?? t.employeeId}</TableCell>
                  <TableCell>
                    {t.itemName} <span className="text-muted-foreground">&times;{t.quantity}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.category}</TableCell>
                  <TableCell>{t.paymentMethod}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCurrency(t.gross)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                    {t.discount ? formatCurrency(t.discount) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-rose-600">
                    {t.refund ? formatCurrency(t.refund) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium tabular-nums">
                    {formatCurrency(t.net)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => onPrintOne(t)}>
                      <PrinterIcon className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <Select value={String(pageSize)} onValueChange={changePageSize}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}>
              Previous
            </Button>
            <span>
              Page {safePage} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={safePage >= pageCount}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
