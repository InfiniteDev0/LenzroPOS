"use client"

import { useMemo } from "react"

import { formatCurrency } from "@/lib/currency"
import { aggregateByCategory } from "@/lib/sales-query"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function SalesByCategoryTable({ transactions }) {
  const rows = useMemo(() => aggregateByCategory(transactions), [transactions])

  return (
    <Card className={'bg-background'}>
      <CardContent className="px-2 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Items sold</TableHead>
              <TableHead className="text-right">Net sales</TableHead>
              <TableHead className="text-right">Cost of goods</TableHead>
              <TableHead className="text-right">Gross profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No data to display
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.category}>
                  <TableCell>{row.category}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.itemsSold}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCurrency(row.netSales)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                    {formatCurrency(row.costOfGoods)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-emerald-600">
                    {formatCurrency(row.grossProfit)}
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
