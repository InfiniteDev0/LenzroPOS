"use client"

import { useMemo, useState } from "react"
import { AlertTriangleIcon, RotateCwIcon, SearchIcon } from "lucide-react"
import { toast } from "sonner"

import { AdminPageHeader } from "@/components/admin-page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InventoryTable } from "@/components/inventory-table"
import { MultiSelectFilter } from "@/components/multi-select-filter"
import { MENU_ITEMS } from "@/lib/mock-transactions"
import { initialInventory, stockStatus } from "@/lib/mock-inventory"

const CATEGORIES = Array.from(new Set(MENU_ITEMS.map((item) => item.category)))
const ITEM_NAMES = MENU_ITEMS.map((item) => item.name)

export default function Page() {
  const [inventory, setInventory] = useState(initialInventory)
  const [categories, setCategories] = useState(CATEGORIES)
  const [itemNames, setItemNames] = useState(ITEM_NAMES)
  const [search, setSearch] = useState("")
  const [selectedNames, setSelectedNames] = useState(() => new Set())

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return inventory
      .filter((item) => categories.length === 0 || categories.includes(item.category))
      .filter((item) => itemNames.length === 0 || itemNames.includes(item.name))
      .filter((item) => !query || item.name.toLowerCase().includes(query))
  }, [inventory, categories, itemNames, search])

  const criticalCount = useMemo(
    () => inventory.filter((item) => stockStatus(item) === "critical").length,
    [inventory]
  )

  function toggleRow(name) {
    setSelectedNames((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  function toggleRows(names, shouldSelect) {
    setSelectedNames((prev) => {
      const next = new Set(prev)
      for (const name of names) {
        if (shouldSelect) {
          next.add(name)
        } else {
          next.delete(name)
        }
      }
      return next
    })
  }

  function restock(names) {
    setInventory((prev) =>
      prev.map((item) => (names.has(item.name) ? { ...item, currentStock: item.parLevel } : item))
    )
    setSelectedNames((prev) => {
      const next = new Set(prev)
      names.forEach((name) => next.delete(name))
      return next
    })
    toast.success(
      names.size === 1 ? `Restocked ${[...names][0]}` : `Restocked ${names.size} items`
    )
  }

  return (
    <>
      <AdminPageHeader crumbs={[{ label: "Inventory" }]} />
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 px-4">
          <MultiSelectFilter
            allLabel="All categories"
            options={CATEGORIES}
            value={categories}
            onChange={setCategories} />
          <MultiSelectFilter
            allLabel="All items"
            options={ITEM_NAMES}
            value={itemNames}
            onChange={setItemNames} />
          <div className="relative ml-auto w-56">
            <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search items"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button
            variant="outline"
            className="gap-2"
            disabled={selectedNames.size === 0}
            onClick={() => restock(selectedNames)}>
            <RotateCwIcon />
            Restock selected{selectedNames.size > 0 ? ` (${selectedNames.size})` : ""}
          </Button>
          <Button
            className="gap-2"
            onClick={() => restock(new Set(inventory.map((item) => item.name)))}>
            <RotateCwIcon />
            Restock all
          </Button>
        </div>

        {criticalCount > 0 && (
          <div className="mx-4 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400">
            <AlertTriangleIcon className="size-4 shrink-0" />
            {criticalCount} {criticalCount === 1 ? "item is" : "items are"} critically low on stock
          </div>
        )}

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <InventoryTable
            items={filtered}
            selectedNames={selectedNames}
            onToggleRow={toggleRow}
            onToggleRows={toggleRows}
            onRestockOne={(name) => restock(new Set([name]))} />
        </div>
      </div>
    </>
  );
}
