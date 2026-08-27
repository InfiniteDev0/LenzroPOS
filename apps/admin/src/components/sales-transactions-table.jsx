import { formatCurrency } from "@/lib/currency"
import { todaysTransactions } from "@/lib/mock-sales"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const METHOD_STYLES = {
  Mpesa: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  Cash: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  Card: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400",
}

export function SalesTransactionsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s transactions</CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:p-6 sm:pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Sold by</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Gross sales</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Refund</TableHead>
              <TableHead className="text-right">Net sales</TableHead>
              <TableHead className="text-right">Gross profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {todaysTransactions.map((txn) => (
              <TableRow key={txn.id}>
                <TableCell className="text-muted-foreground">{txn.time}</TableCell>
                <TableCell>{txn.employee}</TableCell>
                <TableCell>
                  <Badge className={cn("font-normal", METHOD_STYLES[txn.method])}>
                    {txn.method}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatCurrency(txn.gross)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                  {txn.discount ? formatCurrency(txn.discount) : "—"}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-rose-600">
                  {txn.refund ? formatCurrency(txn.refund) : "—"}
                </TableCell>
                <TableCell className="text-right font-mono font-medium tabular-nums">
                  {formatCurrency(txn.net)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-emerald-600">
                  {formatCurrency(txn.profit)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
