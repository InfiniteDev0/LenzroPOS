"use client"

import { useId } from "react"
import { ClockIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TIME_OPTIONS = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`)

export function TimeRangePicker({ value, onChange }) {
  const { mode, start, end } = value
  const allDayId = useId()
  const customId = useId()

  const label = mode === "all-day" ? "All day" : `${start} - ${end}`

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="w-[220px] justify-start rounded-md text-left font-normal" />
        }>
        <ClockIcon />
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <RadioGroup
          value={mode}
          onValueChange={(nextMode) => onChange({ ...value, mode: nextMode })}
          className="gap-0 p-1">
          <label
            htmlFor={allDayId}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm",
              mode === "all-day" && "bg-muted"
            )}>
            <RadioGroupItem id={allDayId} value="all-day" />
            All day
          </label>
          <label
            htmlFor={customId}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm",
              mode === "custom" && "bg-muted"
            )}>
            <RadioGroupItem id={customId} value="custom" />
            Custom period
          </label>
        </RadioGroup>

        {mode === "custom" && (
          <div className="grid grid-cols-2 gap-2 border-t p-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Start</span>
              <Select value={start} onValueChange={(nextStart) => onChange({ ...value, start: nextStart })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">End</span>
              <Select value={end} onValueChange={(nextEnd) => onChange({ ...value, end: nextEnd })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
