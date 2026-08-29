"use client"

import { useEffect, useState } from "react"
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CreditCardIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SmartphoneIcon,
  Trash2Icon,
  WalletIcon,
} from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@lenzro/supabase/client"
import { notifyError } from "@/lib/errors"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PaymentTypeDialog } from "@/components/payment-type-dialog"
import { Skeleton } from "@/components/ui/skeleton"

const KIND_ICONS = {
  cash: WalletIcon,
  card: CreditCardIcon,
  mobile: SmartphoneIcon,
  other: WalletIcon,
}

const KIND_LABELS = {
  cash: "Counts in the drawer",
  card: "Card machine",
  mobile: "Mobile money",
  other: "Other",
}

export default function Page() {
  const [supabase] = useState(() => createClient())
  const [paymentTypes, setPaymentTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    loadPaymentTypes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadPaymentTypes() {
    setLoading(true)
    const { data, error } = await supabase
      .from("payment_types")
      .select("*")
      .order("sort_order", { ascending: true })
    if (error) {
      notifyError(error, "Couldn't load payment types")
    } else {
      setPaymentTypes(data)
    }
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(paymentType) {
    setEditing(paymentType)
    setDialogOpen(true)
  }

  async function handleSave(form) {
    const { error } = editing
      ? await supabase.from("payment_types").update(form).eq("id", editing.id)
      : await supabase
          .from("payment_types")
          .insert({ ...form, sort_order: paymentTypes.length })

    if (error) {
      notifyError(error, "Couldn't save the payment type")
      return
    }

    toast.success(editing ? "Payment type updated" : `${form.name} added`, {
      description: "Tills pick this up as soon as they sync.",
    })
    setDialogOpen(false)
    loadPaymentTypes()
  }

  // Deactivating keeps past sales readable: an order paid by a type that
  // was later deleted would otherwise point at nothing. Deleting is still
  // offered, but only for a type nothing has been sold on.
  async function handleToggleActive(paymentType) {
    const { error } = await supabase
      .from("payment_types")
      .update({ active: !paymentType.active })
      .eq("id", paymentType.id)
    if (error) {
      notifyError(error, "Couldn't update the payment type")
      return
    }
    toast.success(
      paymentType.active ? `${paymentType.name} hidden from the till` : `${paymentType.name} is back on the till`
    )
    loadPaymentTypes()
  }

  async function handleDelete(paymentType) {
    const { count, error: countError } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("payment_type_id", paymentType.id)

    if (countError) {
      notifyError(countError, "Couldn't check past sales")
      return
    }

    if (count > 0) {
      toast.error(`${paymentType.name} has ${count} sale${count === 1 ? "" : "s"} against it`, {
        description: "Turn it off instead — deleting it would break those receipts.",
      })
      return
    }

    const { error } = await supabase.from("payment_types").delete().eq("id", paymentType.id)
    if (error) {
      notifyError(error, "Couldn't delete the payment type")
      return
    }
    toast.success(`${paymentType.name} removed`)
    loadPaymentTypes()
  }

  // Order matters: this is the left-to-right order of the payment buttons
  // on the till, so the one used most should sit first.
  async function move(index, direction) {
    const target = index + direction
    if (target < 0 || target >= paymentTypes.length) return

    const reordered = [...paymentTypes]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setPaymentTypes(reordered)

    const updates = reordered.map((type, i) =>
      supabase.from("payment_types").update({ sort_order: i }).eq("id", type.id)
    )
    const results = await Promise.all(updates)
    const failed = results.find((r) => r.error)
    if (failed) {
      notifyError(failed.error, "Couldn't save the new order")
      loadPaymentTypes()
    }
  }

  return (
    <>
      <Card className="gap-0 overflow-hidden py-0">
        <div className="border-b p-4">
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-600/90" onClick={openAdd}>
            <PlusIcon />
            Add payment type
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">
            These are the payment buttons your cashiers see at checkout, in this order.
          </p>
        </div>
        <CardContent className="divide-y p-0">
          {loading ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : paymentTypes.length === 0 ? (
            <p className="p-10 text-center text-muted-foreground">
              No payment types yet — cashiers won&apos;t be able to complete a sale.
            </p>
          ) : (
            paymentTypes.map((paymentType, index) => {
              const Icon = KIND_ICONS[paymentType.kind] ?? WalletIcon
              return (
                <div key={paymentType.id} className="flex items-center gap-3 p-4">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      className="text-muted-foreground disabled:opacity-30"
                      title="Move up">
                      <ChevronUpIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === paymentTypes.length - 1}
                      onClick={() => move(index, 1)}
                      className="text-muted-foreground disabled:opacity-30"
                      title="Move down">
                      <ChevronDownIcon className="size-4" />
                    </button>
                  </div>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{paymentType.name}</p>
                    <p className="text-sm text-muted-foreground">{KIND_LABELS[paymentType.kind]}</p>
                  </div>
                  {!paymentType.active && (
                    <Badge variant="outline" className="text-muted-foreground">
                      Off
                    </Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      } />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(paymentType)}>
                        <PencilIcon />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(paymentType)}>
                        {paymentType.active ? "Turn off" : "Turn on"}
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => handleDelete(paymentType)}>
                        <Trash2Icon />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
      <PaymentTypeDialog
        paymentType={editing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave} />
    </>
  );
}
