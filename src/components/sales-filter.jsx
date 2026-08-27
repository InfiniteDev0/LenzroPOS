"use client"

import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const SALES_FILTERS = [
  { key: "summary", label: "Sales summary" },
  { key: "item", label: "Sales by item" },
  { key: "category", label: "Sales by category" },
  { key: "employee", label: "Sales by employee" },
  { key: "payment", label: "Sales by payment type" },
  { key: "discounts", label: "Discounts" },
]

export function SalesFilter({ value, onChange }) {
  const activeLabel = SALES_FILTERS.find((filter) => filter.key === value)?.label

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="justify-start gap-2 rounded-md font-normal" />
        }>
        {activeLabel}
        <ChevronDownIcon className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {SALES_FILTERS.map((filter) => (
            <DropdownMenuRadioItem key={filter.key} value={filter.key}>
              {filter.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
