"use client"

import { formatCurrency } from "@/lib/currency"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function owedOf(customer) {
  return (customer.taken || 0) - (customer.paid || 0)
}

export function CustomerTable({ customers, onSelect }) {
  return (
    <Card className={'bg-background'}>
      <CardContent className="px-2 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>City</TableHead>
              <TableHead className="text-right">Taken</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Owed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => {
              const owed = owedOf(customer)
              return (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer"
                  onClick={() => onSelect(customer)}>
                  <TableCell className="font-medium text-foreground">{customer.name}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.phone || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.email || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.city || "—"}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCurrency(customer.taken || 0)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-emerald-600">
                    {formatCurrency(customer.paid || 0)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono font-medium tabular-nums ${owed > 0 ? "text-rose-600" : "text-muted-foreground"}`}>
                    {formatCurrency(owed)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function CustomerCards({ customers, onSelect }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {customers.map((customer) => {
        const owed = owedOf(customer)
        return (
          <Card
            key={customer.id}
            className="cursor-pointer transition-colors hover:bg-muted/40"
            onClick={() => onSelect(customer)}>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarFallback className="bg-indigo-500 text-white">
                    {customer.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{customer.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {customer.phone || customer.email || "No contact info"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t pt-3 text-center text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Taken</p>
                  <p className="font-mono font-medium tabular-nums">
                    {formatCurrency(customer.taken || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="font-mono font-medium tabular-nums text-emerald-600">
                    {formatCurrency(customer.paid || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Owed</p>
                  <p
                    className={`font-mono font-medium tabular-nums ${owed > 0 ? "text-rose-600" : "text-muted-foreground"}`}>
                    {formatCurrency(owed)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  );
}
