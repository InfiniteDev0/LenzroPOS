"use client"

import { useMemo } from "react"

import { formatCurrency } from "@/lib/currency"
import { aggregateByEmployee } from "@/lib/sales-query"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function SalesByEmployeeTable({ transactions }) {
  const rows = useMemo(() => aggregateByEmployee(transactions), [transactions])

  return (
    <Card className={'bg-background'}>
      <CardContent className="px-2 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Gross sales</TableHead>
              <TableHead className="text-right">Refunds</TableHead>
              <TableHead className="text-right">Discounts</TableHead>
              <TableHead className="text-right">Net sales</TableHead>
              <TableHead className="text-right">Receipts</TableHead>
              <TableHead className="text-right">Average sale</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No sales in the selected time period
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.employeeId}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCurrency(row.grossSales)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-rose-600">
                    {row.refunds ? formatCurrency(row.refunds) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                    {row.discounts ? formatCurrency(row.discounts) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium tabular-nums">
                    {formatCurrency(row.netSales)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.receipts}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCurrency(row.averageSale)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
