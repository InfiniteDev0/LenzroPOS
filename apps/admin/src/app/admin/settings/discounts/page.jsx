"use client"

import { useEffect, useState } from "react"
import { MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@lenzro/supabase/client"
import { notifyError } from "@/lib/errors"
import { formatCurrency } from "@/lib/currency"
import { DiscountDialog } from "@/components/discount-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function formatValue(discount) {
  return discount.kind === "percentage" ? `${discount.value}%` : formatCurrency(discount.value);
}

export default function Page() {
  const [supabase] = useState(() => createClient())
  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState(null)

  useEffect(() => {
    loadDiscounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadDiscounts() {
    setLoading(true)
    const { data, error } = await supabase
      .from("discount_types")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) {
      notifyError(error, "Couldn't load discounts")
    } else {
      setDiscounts(data)
    }
    setLoading(false)
  }

  function openAdd() {
    setEditingDiscount(null)
    setDialogOpen(true)
  }

  function openEdit(discount) {
    setEditingDiscount(discount)
    setDialogOpen(true)
  }

  async function handleSave(form) {
    const { error } = editingDiscount
      ? await supabase.from("discount_types").update(form).eq("id", editingDiscount.id)
      : await supabase.from("discount_types").insert(form)

    if (error) {
      notifyError(error, "Couldn't save the discount")
      return
    }

    toast.success(editingDiscount ? "Discount updated" : "Discount added")
    setDialogOpen(false)
    loadDiscounts()
  }

  async function handleDelete(discount) {
    const { error } = await supabase.from("discount_types").delete().eq("id", discount.id)
    if (error) {
      notifyError(error, "Couldn't delete the discount")
      return
    }
    toast.success(`${discount.name} removed`)
    loadDiscounts()
  }

  return (
    <>
      <Card className="gap-0 overflow-hidden py-0">
        <div className="border-b p-4">
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-600/90" onClick={openAdd}>
            <PlusIcon />
            Add discount
          </Button>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Applies to</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && discounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No discounts yet — cashiers won&apos;t have anything to offer at checkout.
                  </TableCell>
                </TableRow>
              ) : (
                discounts.map((discount) => (
                  <TableRow key={discount.id} className="cursor-pointer" onClick={() => openEdit(discount)}>
                    <TableCell className="font-medium text-foreground">{discount.name}</TableCell>
                    <TableCell className="text-muted-foreground">{formatValue(discount)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {discount.apply_to === "order" ? "Whole order" : "Every item"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={discount.active ? "text-emerald-600" : "text-muted-foreground"}>
                        {discount.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontalIcon className="size-4" />
                            </Button>
                          } />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(discount)}>
                            <PencilIcon />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => handleDelete(discount)}>
                            <Trash2Icon />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <DiscountDialog
        discount={editingDiscount}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave} />
    </>
  );
}
