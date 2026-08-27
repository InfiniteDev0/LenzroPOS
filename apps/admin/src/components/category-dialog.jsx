"use client"

import { useEffect, useState } from "react"
import { TagIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { emptyCategory } from "@lenzro/types"

export function CategoryDialog({ category, open, onOpenChange, onSave, saving }) {
  const [form, setForm] = useState(emptyCategory)

  useEffect(() => {
    if (open) {
      setForm(category ? { name: category.name, active: category.active } : emptyCategory)
    }
  }, [category, open])

  function handleSubmit(e) {
    e.preventDefault()
    onSave(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader className="items-center text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-600 text-white">
              <TagIcon className="size-8" />
            </div>
            <DialogTitle>{category ? "Edit category" : "Add category"}</DialogTitle>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="category-name">Name</FieldLabel>
              <Input
                id="category-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </Field>
            <Field orientation="horizontal" className="items-center justify-between">
              <FieldLabel htmlFor="category-active">Active</FieldLabel>
              <Switch
                id="category-active"
                checked={form.active}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-600/90" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
