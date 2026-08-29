"use client"

import { CalendarIcon, EyeIcon, PhoneIcon, Trash2Icon } from "lucide-react"

import { formatCurrency } from "@/lib/currency"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-indigo-500",
]

function avatarColorFor(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function initialsOf(name) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase()
}

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

export function CustomerCards({ customers, onSelect, onDelete }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {customers.map((customer) => {
        const owed = owedOf(customer)
        return (
          <Card key={customer.id} className="gap-3 py-4">
            <CardContent className="flex flex-col gap-3 px-4">
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarFallback className={`text-white ${avatarColorFor(customer.id)}`}>
                    {initialsOf(customer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.code}</p>
                </div>
              </div>

              {customer.phone && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <PhoneIcon className="size-3.5" />
                  {customer.phone}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-rose-50 px-2.5 py-1.5 dark:bg-rose-950/30">
                  <p className="text-[10px] font-medium tracking-wide text-rose-600 uppercase">Owed</p>
                  <p className="font-mono text-sm font-semibold text-rose-700 dark:text-rose-400">
                    {formatCurrency(owed)}
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50 px-2.5 py-1.5 dark:bg-emerald-950/30">
                  <p className="text-[10px] font-medium tracking-wide text-emerald-600 uppercase">Paid</p>
                  <p className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(customer.paid || 0)}
                  </p>
                </div>
              </div>

              {customer.createdAt && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarIcon className="size-3.5" />
                  {new Date(customer.createdAt).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}

              <div className="flex items-center justify-between border-t pt-3">
                <button
                  type="button"
                  onClick={() => onSelect(customer)}
                  className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  <EyeIcon className="size-3.5" />
                  Tap to view
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(customer)
                  }}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  );
}
