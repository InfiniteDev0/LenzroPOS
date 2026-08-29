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

// A five-column table can't survive a phone — it either squeezes every
// column to nothing or scrolls sideways, and neither is usable one-handed
// behind a counter. Below `md` each row becomes a card instead: the same
// data, stacked, with real tap targets.
function InventoryCards({ rows, onAddStock, onAdjustCount }) {
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-muted-foreground">No items match these filters</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const meta = STATUS_META[stockStatus(row)]
        return (
          <Card key={row.id} className="gap-0 py-0">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{row.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{row.category}</p>
                </div>
                <Badge className={`shrink-0 border-none font-normal ${meta.badge}`}>
                  {meta.label}
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-3 border-t pt-3">
                <p className="text-sm text-muted-foreground">
                  <span className="text-lg font-semibold text-foreground">{row.quantity}</span>{" "}
                  {row.soldBy === "weight" ? "in stock" : "pcs in stock"}
                </p>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    className="h-10 gap-1.5"
                    onClick={() => onAddStock(row)}
                  >
                    <PackagePlusIcon className="size-4" />
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 gap-1.5"
                    onClick={() => onAdjustCount(row)}
                  >
                    <PencilIcon className="size-4" />
                    Adjust
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function InventoryTable({ rows, onAddStock, onAdjustCount }) {
  return (
    <>
      <div className="md:hidden">
        <InventoryCards rows={rows} onAddStock={onAddStock} onAdjustCount={onAdjustCount} />
      </div>

      <Card className="hidden bg-background md:block">
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
    </>
  );
}
