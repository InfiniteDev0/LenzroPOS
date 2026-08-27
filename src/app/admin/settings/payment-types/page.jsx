"use client"

import { useState } from "react"
import { GripVerticalIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function Page() {
  const [paymentTypes, setPaymentTypes] = useState(["Cash", "Card"])
  const [selected, setSelected] = useState(new Set())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState("")

  function toggleSelected(type) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    setPaymentTypes((prev) => [...prev, name.trim()])
    toast.success(`${name.trim()} added`)
    setName("")
    setDialogOpen(false)
  }

  return (
    <>
      <Card className="gap-0 overflow-hidden py-0">
        <div className="border-b p-4">
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-600/90"
            onClick={() => setDialogOpen(true)}>
            <PlusIcon />
            Add payment type
          </Button>
        </div>
        <CardContent className="divide-y p-0">
          <div className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
            <Checkbox disabled />
            <span>Name</span>
          </div>
          {paymentTypes.map((type) => (
            <div key={type} className="flex items-center gap-3 p-4">
              <Checkbox checked={selected.has(type)} onCheckedChange={() => toggleSelected(type)} />
              <span className="flex-1">{type}</span>
              <GripVerticalIcon className="size-4 text-muted-foreground" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAdd}>
            <DialogHeader>
              <DialogTitle>Add payment type</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Field>
                <FieldLabel htmlFor="payment-type-name">Name</FieldLabel>
                <Input
                  id="payment-type-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required />
              </Field>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-600/90">
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
