"use client"

import { useState } from "react"
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Banknote,
  CreditCard,
  ScanLine,
  Download,
  Receipt,
  Plus,
  Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/currency"
import { downloadCSV } from "@/lib/csv"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  financeSummary,
  recentTransactions,
  expenseCategories,
  initialExpenses,
  monthlySummary,
} from "@/lib/mock-data-pages"

const methodIcons = { Card: CreditCard, Cash: Banknote, Scan: ScanLine }

export default function FinancePage() {
  const [expenses, setExpenses] = useState(initialExpenses)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [form, setForm] = useState({ label: "", category: expenseCategories[0], amount: "" })

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  function handleAddExpense(e) {
    e.preventDefault()
    if (!form.label || !form.amount) return

    setExpenses((prev) => [
      {
        id: `e${Date.now()}`,
        label: form.label,
        category: form.category,
        amount: Number(form.amount),
        date: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ])
    setForm({ label: "", category: expenseCategories[0], amount: "" })
    setShowExpenseForm(false)
  }

  function removeExpense(id) {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  function handleDownloadTodaySales() {
    downloadCSV(
      `lenzro-pos-sales-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Order ID", "Table", "Amount (KES)", "Method", "Time"],
      recentTransactions.map((tx) => [tx.id, tx.table, tx.amount, tx.method, tx.time])
    )
  }

  function handleDownloadMonthlyReport() {
    downloadCSV(
      `lenzro-pos-monthly-report-${new Date().toISOString().slice(0, 7)}.csv`,
      ["Period", "Revenue (KES)", "Orders"],
      monthlySummary.map((row) => [row.week, row.revenue, row.orders])
    )
  }

  function handleDownloadReceipt(tx) {
    downloadCSV(`receipt-${tx.id}.csv`, ["Field", "Value"], [
      ["Order ID", tx.id],
      ["Table", tx.table],
      ["Amount (KES)", tx.amount],
      ["Payment Method", tx.method],
      ["Time", tx.time],
    ])
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Finance</h1>
          <p className="text-sm text-muted-foreground">Revenue, transactions and expenses overview</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadTodaySales}>
            <Download className="size-4" />
            Today&apos;s Sales (CSV)
          </Button>
          <Button variant="outline" onClick={handleDownloadMonthlyReport}>
            <Download className="size-4" />
            Monthly Report (CSV)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {financeSummary.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold">
              {stat.isCurrency ? formatCurrency(stat.value) : stat.value}
            </p>
            <p
              className={cn(
                "mt-1 flex items-center gap-1 text-xs font-medium",
                stat.up ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {stat.up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              {stat.change}
            </p>
          </div>
        ))}
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(totalExpenses)}</p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">{expenses.length} entries</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="font-semibold">Recent Transactions</h2>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Wallet className="size-4" />
              Today
            </span>
          </div>
          <div className="divide-y divide-border">
            {recentTransactions.map((tx) => {
              const Icon = methodIcons[tx.method]
              return (
                <div key={tx.id} className="flex items-center justify-between p-4 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-muted">
                      <Icon className="size-4 text-muted-foreground" />
                    </span>
                    <div>
                      <p className="font-medium">Order #{tx.id}</p>
                      <p className="text-xs text-muted-foreground">
                        Table {tx.table} · {tx.method}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(tx.amount)}</p>
                      <p className="text-xs text-muted-foreground">{tx.time}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadReceipt(tx)}
                      title="Download receipt"
                      className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                    >
                      <Receipt className="size-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="font-semibold">Expenses</h2>
            <Button size="sm" onClick={() => setShowExpenseForm((v) => !v)}>
              <Plus className="size-4" />
              Add Expense
            </Button>
          </div>

          {showExpenseForm && (
            <form onSubmit={handleAddExpense} className="space-y-3 border-b border-border p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="expense-label">Description</Label>
                  <Input
                    id="expense-label"
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="e.g. Meat Supplier"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expense-amount">Amount (KSh)</Label>
                  <Input
                    id="expense-amount"
                    type="number"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expense-category">Category</Label>
                <select
                  id="expense-category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {expenseCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="bg-teal-600 text-white hover:bg-teal-600/90">
                Save Expense
              </Button>
            </form>
          )}

          <div className="divide-y divide-border">
            {expenses.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">No expenses recorded yet.</p>
            )}
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <p className="font-medium">{expense.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {expense.category} · {expense.date}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-medium">{formatCurrency(expense.amount)}</p>
                  <button
                    type="button"
                    onClick={() => removeExpense(expense.id)}
                    className="flex size-7 items-center justify-center rounded-md border border-border text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
