"use client"

import { useQuery } from "@powersync/react"
import { CheckIcon, TagIcon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

function formatDiscountValue(discount) {
  return discount.kind === "percentage" ? `${discount.value}% off` : `KSh ${discount.value} off`;
}

export function DiscountPickerDialog({ open, onOpenChange, selectedId, onSelect }) {
  const { data: discounts } = useQuery(
    "SELECT * FROM discount_types WHERE active = 1 ORDER BY name"
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply a discount</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {selectedId && (
            <Button
              variant="outline"
              className="w-full justify-start text-destructive"
              onClick={() => {
                onSelect(null)
                onOpenChange(false)
              }}
            >
              Remove discount
            </Button>
          )}
          {(discounts ?? []).length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No discounts set up yet — ask the owner to add one from the back office.
            </p>
          )}
          {(discounts ?? []).map((discount) => (
            <button
              key={discount.id}
              type="button"
              onClick={() => {
                onSelect(discount)
                onOpenChange(false)
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left hover:bg-muted"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <TagIcon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{discount.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDiscountValue(discount)} · {discount.apply_to === "order" ? "whole order" : "every item"}
                </p>
              </div>
              {selectedId === discount.id && <CheckIcon className="size-4 shrink-0 text-emerald-600" />}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
