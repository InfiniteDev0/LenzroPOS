"use client"

import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { EMPLOYEES } from "@/lib/employees"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function EmployeePicker({ value: selected, onChange }) {
  const allSelected = selected.length === EMPLOYEES.length

  function toggleAll() {
    onChange(allSelected ? [] : EMPLOYEES.map((employee) => employee.id))
  }

  function toggleEmployee(id) {
    onChange(
      selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]
    )
  }

  const selectedEmployees = EMPLOYEES.filter((employee) => selected.includes(employee.id))
  const preview = selectedEmployees.slice(0, 2)
  const overflow = selectedEmployees.length - preview.length

  const label = allSelected
    ? "All"
    : selected.length === 0
      ? "None"
      : selected.length === 1
        ? selectedEmployees[0].name
        : `${selected.length} selected`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="justify-start gap-2 rounded-md font-normal" />
        }>
        <div className="flex items-center -space-x-2">
          {preview.map((employee) => (
            <Avatar key={employee.id} size="sm" className="ring-2 ring-background">
              <AvatarFallback className={cn("text-white", employee.color)}>
                {employee.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ))}
          {overflow > 0 && (
            <Avatar size="sm" className="ring-2 ring-background">
              <AvatarFallback className="bg-muted text-xs">+{overflow}</AvatarFallback>
            </Avatar>
          )}
        </div>
        {label}
        <ChevronDownIcon className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuCheckboxItem checked={allSelected} onCheckedChange={toggleAll}>
          All employees
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {EMPLOYEES.map((employee) => (
          <DropdownMenuCheckboxItem
            key={employee.id}
            checked={selected.includes(employee.id)}
            onCheckedChange={() => toggleEmployee(employee.id)}
            className="gap-2">
            <Avatar size="sm">
              <AvatarFallback className={cn("text-white", employee.color)}>
                {employee.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {employee.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
