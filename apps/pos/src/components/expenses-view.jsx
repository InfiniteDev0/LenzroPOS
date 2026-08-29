"use client"

import { useQuery } from "@powersync/react"
import { ReceiptTextIcon } from "lucide-react"

import { formatCurrency } from "@/lib/currency"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-KE", { hour: "numeric", minute: "2-digit" });
}

function ExpenseCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Skeleton className="size-11 shrink-0 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3.5 w-1/3" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ExpensesView({ shiftId }) {
  const { data: expenses, isLoading } = useQuery(
    "SELECT * FROM shift_expenses WHERE shift_id = ? ORDER BY created_at DESC",
    [shiftId]
  )

  const total = (expenses ?? []).reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold lg:text-2xl">Expenses</h2>
          <p className="text-sm text-muted-foreground lg:text-base">Logged this shift</p>
        </div>
        {expenses?.length > 0 && (
          <p className="text-base font-medium lg:text-lg">Total: {formatCurrency(total)}</p>
        )}
      </div>

      {!isLoading && expenses?.length === 0 && (
        <p className="py-16 text-center text-base text-muted-foreground">
          No expenses logged this shift.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <ExpenseCardSkeleton key={i} />)
          : (expenses ?? []).map((expense) => (
          <Card key={expense.id}>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-muted">
                  <ReceiptTextIcon className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-base font-medium">{expense.note || "Expense"}</p>
                  <p className="text-sm text-muted-foreground">{formatTime(expense.created_at)}</p>
                </div>
              </div>
              <p className="text-base font-semibold">{formatCurrency(expense.amount)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
