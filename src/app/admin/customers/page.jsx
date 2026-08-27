"use client"

import { useMemo, useState } from "react"
import { LayoutGridIcon, PlusIcon, SearchIcon, TableIcon } from "lucide-react"

import { AdminPageHeader } from "@/components/admin-page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CustomerCards, CustomerTable } from "@/components/customer-list"
import { CustomerDialog } from "@/components/customer-dialog"
import { EmptyState } from "@/components/empty-state"
import { cn } from "@/lib/utils"

export default function Page() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState("")
  const [view, setView] = useState("table")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return customers
    return customers.filter((customer) =>
      [customer.name, customer.phone, customer.email].some((field) =>
        field?.toLowerCase().includes(query)
      )
    )
  }, [customers, search])

  function openAdd() {
    setEditingCustomer(null)
    setDialogOpen(true)
  }

  function openEdit(customer) {
    setEditingCustomer(customer)
    setDialogOpen(true)
  }

  function handleSave(form) {
    if (editingCustomer) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === editingCustomer.id ? { ...c, ...form } : c))
      )
    } else {
      setCustomers((prev) => [...prev, { ...form, id: crypto.randomUUID(), taken: 0, paid: 0 }])
    }
  }

  return (
    <>
      <AdminPageHeader crumbs={[{ label: "Customers" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {customers.length === 0 ? (
          <EmptyState
            image="/customer.png"
            imageAlt="Customer"
            title="No customers yet"
            description="Add customers to keep track of what they take on credit, what they've paid, and what they still owe."
            actionLabel="Add customer"
            onAction={openAdd} />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-600/90" onClick={openAdd}>
                <PlusIcon />
                Add customer
              </Button>
              <div className="relative ml-auto w-64">
                <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search customers"
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex items-center gap-1 rounded-md border p-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("size-7", view === "table" && "bg-muted")}
                  title="Table view"
                  onClick={() => setView("table")}>
                  <TableIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("size-7", view === "card" && "bg-muted")}
                  title="Card view"
                  onClick={() => setView("card")}>
                  <LayoutGridIcon className="size-4" />
                </Button>
              </div>
            </div>
            {view === "table" ? (
              <CustomerTable customers={filtered} onSelect={openEdit} />
            ) : (
              <CustomerCards customers={filtered} onSelect={openEdit} />
            )}
          </>
        )}
      </div>
      <CustomerDialog
        customer={editingCustomer}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave} />
    </>
  );
}
