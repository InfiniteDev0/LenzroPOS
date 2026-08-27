"use client"

import { PackagePlusIcon, PencilIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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

export function stockStatus(row) {
  if (row.quantity <= 0) return "out"
  if (row.threshold != null && row.quantity <= row.threshold) return "low"
  return "in"
}

const STATUS_META = {
  out: { label: "Out of stock", badge: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400" },
  low: { label: "Low stock", badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  in: { label: "In stock", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
}

export function InventoryTable({ rows, onAddStock, onAdjustCount }) {
  return (
    <Card className="bg-background">
      <CardContent className="px-2 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>In stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No items match these filters
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const meta = STATUS_META[stockStatus(row)]
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-foreground">{row.name}</TableCell>
                    <TableCell className="text-muted-foreground">{row.category}</TableCell>
                    <TableCell>
                      {row.quantity} {row.soldBy === "weight" ? "" : "pcs"}
                    </TableCell>
                    <TableCell>
                      <Badge className={`border-none font-normal ${meta.badge}`}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          title="Add stock"
                          onClick={() => onAddStock(row)}
                        >
                          <PackagePlusIcon className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          title="Adjust count"
                          onClick={() => onAdjustCount(row)}
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                      </div>
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
