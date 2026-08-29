"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutGridIcon, PlusIcon, SearchIcon, TableIcon } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@lenzro/supabase/client"
import { notifyError } from "@/lib/errors"
import { fetchCustomersWithBalances } from "@/lib/real-customers-data"
import { AdminPageHeader } from "@/components/admin-page-header"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CustomerCards, CustomerTable } from "@/components/customer-list"
import { CustomerDialog } from "@/components/customer-dialog"
import { EmptyState } from "@/components/empty-state"
import { cn } from "@/lib/utils"

export default function Page() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [view, setView] = useState("card")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    loadCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadCustomers() {
    setLoading(true)
    const { data, error } = await fetchCustomersWithBalances(supabase)
    if (error) {
      notifyError(error, "Couldn't load customers")
    } else {
      setCustomers(data)
    }
    setLoading(false)
  }

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

  function openDetail(customer) {
    router.push(`/admin/customers/${customer.id}`)
  }

  async function handleSave(form) {
    const payload = {
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      country: form.country || null,
      id_number: form.idNumber || null,
    }

    const { error } = editingCustomer
      ? await supabase.from("customers").update(payload).eq("id", editingCustomer.id)
      : await supabase.from("customers").insert(payload)

    if (error) {
      notifyError(error, "Couldn't save the customer")
      return
    }

    toast.success(editingCustomer ? "Customer updated" : "Customer added")
    setDialogOpen(false)
    loadCustomers()
  }

  async function handleDelete() {
    const { error } = await supabase.from("customers").delete().eq("id", deleteTarget.id)
    if (error) {
      notifyError(
        error,
        "Couldn't delete this customer",
        error.code === "23503"
          ? "They still have orders or payments on record — those have to stay for the books."
          : null
      )
      setDeleteTarget(null)
      return
    }
    toast.success(`${deleteTarget.name} removed`)
    setDeleteTarget(null)
    loadCustomers()
  }

  return (
    <>
      <AdminPageHeader crumbs={[{ label: "Open Tabs" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {!loading && customers.length === 0 ? (
          <EmptyState
            image="/customer.png"
            imageAlt="Customer"
            title="No open tabs yet"
            description="Add people you trust to order now and pay later — friends, regulars, anyone you're comfortable extending a tab to."
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
              <CustomerTable customers={filtered} onSelect={openDetail} />
            ) : (
              <CustomerCards customers={filtered} onSelect={openDetail} onDelete={setDeleteTarget} />
            )}
          </>
        )}
      </div>
      <CustomerDialog
        customer={editingCustomer}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave} />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
