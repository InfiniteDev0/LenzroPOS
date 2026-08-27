"use client"

import { useState } from "react"

import { formatCurrency } from "@/lib/currency"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Schema only supports one variant_value_id per order line, so — matching
// every example in the roadmap (always a single "Size" option) — only the
// item's first variant group is offered here even if more exist.
//
// The parent keys this component by item id, so a fresh instance (and
// fresh selectedValueId) is mounted per item rather than resetting via
// effect.
export function VariantPickerDialog({ item, open, onOpenChange, onConfirm }) {
  const variant = item?.item_variants?.[0]
  const [selectedValueId, setSelectedValueId] = useState(null)

  if (!variant) return null

  const selectedValue = variant.item_variant_values?.find((v) => v.id === selectedValueId)

  function handleConfirm() {
    if (!selectedValue) return
    onConfirm({
      variant_value_id: selectedValue.id,
      variant_label: `${variant.option_name}: ${selectedValue.value}`,
      unit_price: selectedValue.price_override ?? item.price,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item?.name}</DialogTitle>
          <DialogDescription>Choose a {variant.option_name.toLowerCase()}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 py-2">
          {variant.item_variant_values?.map((value) => (
            <button
              key={value.id}
              type="button"
              onClick={() => setSelectedValueId(value.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg border p-3 text-sm font-medium transition-colors",
                selectedValueId === value.id
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40"
                  : "border-border hover:bg-muted"
              )}
            >
              {value.value}
              <span className="text-xs font-normal text-muted-foreground">
                {formatCurrency(value.price_override ?? item.price)}
              </span>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-emerald-600 hover:bg-emerald-600/90"
            disabled={!selectedValue}
            onClick={handleConfirm}
          >
            Add to order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
