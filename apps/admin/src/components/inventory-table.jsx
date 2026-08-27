"use client"

import { RotateCwIcon } from "lucide-react"

import { stockStatus } from "@/lib/mock-inventory"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const STATUS_META = {
  critical: { label: "Critical", badge: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400", bar: "bg-rose-500", text: "text-rose-600" },
  low: { label: "Low stock", badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", bar: "bg-amber-500", text: "text-amber-600" },
  healthy: { label: "In stock", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", bar: "bg-emerald-500", text: "text-emerald-600" },
}

export function InventoryTable({ items, selectedNames, onToggleRow, onToggleRows, onRestockOne }) {
  const names = items.map((item) => item.name)
  const allSelected = names.length > 0 && names.every((name) => selectedNames.has(name))

  return (
    <Card className={'bg-background'}>
      <CardContent className="px-2 sm:p-6 ">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => onToggleRows(names, Boolean(checked))} />
              </TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-56">Stock level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No items match these filters
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const status = stockStatus(item)
                const meta = STATUS_META[status]
                const percentage = Math.min(100, Math.round((item.currentStock / item.parLevel) * 100))

                return (
                  <TableRow key={item.name} data-state={selectedNames.has(item.name) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selectedNames.has(item.name)}
                        onCheckedChange={() => onToggleRow(item.name)} />
                    </TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.category}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {item.currentStock} / {item.parLevel} {item.unit}
                          </span>
                          <span className={cn("font-medium", meta.text)}>{percentage}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn("h-full rounded-full", meta.bar)}
                            style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-normal", meta.badge)}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        title="Restock to full"
                        onClick={() => onRestockOne(item.name)}>
                        <RotateCwIcon className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
