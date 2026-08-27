"use client"

import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const PRESETS = [
  { label: "Today", getValue: () => ({ mode: "single", value: new Date() }) },
  { label: "Yesterday", getValue: () => ({ mode: "single", value: subDays(new Date(), 1) }) },
  {
    label: "This week",
    getValue: () => ({
      mode: "range",
      value: { from: startOfWeek(new Date()), to: endOfWeek(new Date()) },
    }),
  },
  {
    label: "Last week",
    getValue: () => {
      const lastWeek = subWeeks(new Date(), 1)
      return { mode: "range", value: { from: startOfWeek(lastWeek), to: endOfWeek(lastWeek) } }
    },
  },
  {
    label: "This month",
    getValue: () => ({
      mode: "range",
      value: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
    }),
  },
  {
    label: "Last month",
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1)
      return { mode: "range", value: { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) } }
    },
  },
  {
    label: "Last 7 days",
    getValue: () => ({ mode: "range", value: { from: subDays(new Date(), 6), to: new Date() } }),
  },
  {
    label: "Last 30 days",
    getValue: () => ({ mode: "range", value: { from: subDays(new Date(), 29), to: new Date() } }),
  },
]

function formatLabel(mode, value) {
  if (mode === "single") {
    return value ? format(value, "PPP") : "Pick a date"
  }

  if (!value?.from) return "Pick a date"
  if (!value.to) return format(value.from, "MMM d, yyyy")
  return `${format(value.from, "MMM d, yyyy")} - ${format(value.to, "MMM d, yyyy")}`
}

export function DatePicker({ value, onChange }) {
  const { mode, value: dateValue } = value

  function applyPreset(preset) {
    onChange(preset.getValue())
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "w-70 justify-start rounded-md text-left font-normal",
              !dateValue && "text-muted-foreground"
            )} />
        }>
        <CalendarIcon />
        {formatLabel(mode, dateValue)}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="flex flex-col gap-1 border-r p-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                className="justify-start font-normal"
                onClick={() => applyPreset(preset)}>
                {preset.label}
              </Button>
            ))}
          </div>
          {mode === "single" ? (
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={(date) => date && onChange({ mode: "single", value: date })} />
          ) : (
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={dateValue}
              onSelect={(range) => onChange({ mode: "range", value: range })} />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
