"use client"

import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function MultiSelectFilter({ allLabel, options, value, onChange }) {
  const allSelected = value.length === options.length

  function toggleAll() {
    onChange(allSelected ? [] : options)
  }

  function toggleOption(option) {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option])
  }

  const label = allSelected
    ? allLabel
    : value.length === 0
      ? "None"
      : value.length === 1
        ? value[0]
        : `${value.length} selected`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="justify-start gap-2 rounded-md font-normal" />
        }>
        {label}
        <ChevronDownIcon className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 w-56 overflow-y-auto">
        <DropdownMenuCheckboxItem checked={allSelected} onCheckedChange={toggleAll}>
          {allLabel}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={value.includes(option)}
            onCheckedChange={() => toggleOption(option)}>
            {option}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
