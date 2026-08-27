"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangleIcon, SearchIcon } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@lenzro/supabase/client"
import { notifyError } from "@/lib/errors"
import { AdminPageHeader } from "@/components/admin-page-header"
import { Input } from "@/components/ui/input"
import { InventoryTable, stockStatus } from "@/components/inventory-table"
import { MultiSelectFilter } from "@/components/multi-select-filter"
import { StockAdjustmentDialog } from "@/components/stock-adjustment-dialog"

function getStock(item) {
  const raw = item.stock_levels
  return Array.isArray(raw) ? raw[0] : raw
}

export default function Page() {
  const [supabase] = useState(() => createClient())
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState([])
  const [dialogState, setDialogState] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    setLoading(true)
    const { data, error } = await supabase
      .from("items")
      .select("*, categories(name), stock_levels(quantity, low_stock_threshold)")
      .eq("track_stock", true)
      .order("name")
    if (error) {
      notifyError(error, "Couldn't load inventory")
    } else {
      setItems(data)
    }
    setLoading(false)
  }

  const rows = useMemo(
    () =>
      items.map((item) => {
        const stock = getStock(item)
        return {
          id: item.id,
          name: item.name,
          category: item.categories?.name ?? "—",
          quantity: Number(stock?.quantity ?? 0),
          threshold: stock?.low_stock_threshold != null ? Number(stock.low_stock_threshold) : null,
          soldBy: item.sold_by,
        }
      }),
    [items]
  )

  const categoryOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.category))).filter((c) => c !== "—"),
    [rows]
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows
      .filter((row) => categoryFilter.length === 0 || categoryFilter.includes(row.category))
      .filter((row) => !query || row.name.toLowerCase().includes(query))
  }, [rows, categoryFilter, search])

  const needsAttentionCount = useMemo(
    () => rows.filter((row) => stockStatus(row) !== "in").length,
    [rows]
  )

  function openAddStock(row) {
    setDialogState({ row, mode: "add" })
  }

  function openAdjustCount(row) {
    setDialogState({ row, mode: "adjust" })
  }

  async function handleSaveAdjustment({ quantity, note }) {
    setSaving(true)
    const { error } = await supabase.from("stock_adjustments").insert({
      item_id: dialogState.row.id,
      type: dialogState.mode,
      quantity,
      note,
    })
    setSaving(false)

    if (error) {
      notifyError(error, "Couldn't update stock")
      return
    }

    toast.success(dialogState.mode === "add" ? "Stock added" : "Count updated")
    setDialogState(null)
    loadData()
  }

  return (
    <>
      <AdminPageHeader crumbs={[{ label: "Inventory" }]} />
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 px-4">
          <MultiSelectFilter
            allLabel="All categories"
            options={categoryOptions}
            value={categoryFilter}
            onChange={setCategoryFilter}
          />
          <div className="relative ml-auto w-56">
            <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search items"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {!loading && needsAttentionCount > 0 && (
          <div className="mx-4 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400">
            <AlertTriangleIcon className="size-4 shrink-0" />
            {needsAttentionCount} {needsAttentionCount === 1 ? "item needs" : "items need"} restocking
          </div>
        )}

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {!loading && (
            <InventoryTable rows={filtered} onAddStock={openAddStock} onAdjustCount={openAdjustCount} />
          )}
        </div>
      </div>

      <StockAdjustmentDialog
        item={dialogState?.row}
        mode={dialogState?.mode}
        open={!!dialogState}
        onOpenChange={(open) => !open && setDialogState(null)}
        onSave={handleSaveAdjustment}
        saving={saving}
      />
    </>
  );
}
