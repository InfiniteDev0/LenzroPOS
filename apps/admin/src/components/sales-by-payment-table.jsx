"use client"

import { useMemo } from "react"

import { formatCurrency } from "@/lib/currency"
import { aggregateByPaymentType } from "@/lib/sales-query"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function SalesByPaymentTable({ transactions }) {
  const rows = useMemo(() => aggregateByPaymentType(transactions), [transactions])

  return (
    <Card className={'bg-background'}>
      <CardContent className="px-2 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment type</TableHead>
              <TableHead className="text-right">Transactions</TableHead>
              <TableHead className="text-right">Gross sales</TableHead>
              <TableHead className="text-right">Net sales</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No data to display
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.method}>
                  <TableCell>{row.method}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.transactions}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCurrency(row.grossSales)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium tabular-nums">
                    {formatCurrency(row.netSales)}
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
