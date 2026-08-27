"use client"

import { useEffect, useState } from "react"
import { PlusIcon, Trash2Icon, UtensilsIcon } from "lucide-react"

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { emptyItem } from "@lenzro/types"

function newVariant() {
  return { id: crypto.randomUUID(), option_name: "", values: [newVariantValue()] }
}

function newVariantValue() {
  return { id: crypto.randomUUID(), value: "", price_override: "" }
}

export function ItemDialog({ item, categories, open, onOpenChange, onSave, saving }) {
  const [form, setForm] = useState(emptyItem)
  const [variants, setVariants] = useState([])

  useEffect(() => {
    if (!open) return

    setForm(
      item
        ? {
            name: item.name,
            category_id: item.category_id,
            price: String(item.price),
            cost: item.cost != null ? String(item.cost) : "",
            sold_by: item.sold_by || "each",
            sku: item.sku || "",
            barcode: item.barcode || "",
            available_for_sale: item.available_for_sale,
            track_stock: item.track_stock,
          }
        : { ...emptyItem, category_id: categories[0]?.id ?? "" }
    )

    setVariants(
      item?.item_variants?.length
        ? item.item_variants.map((v) => ({
            id: v.id,
            option_name: v.option_name,
            values: v.item_variant_values?.length
              ? v.item_variant_values.map((val) => ({
                  id: val.id,
                  value: val.value,
                  price_override: val.price_override != null ? String(val.price_override) : "",
                }))
              : [newVariantValue()],
          }))
        : []
    )
  }, [item, open, categories])

  function addVariant() {
    setVariants((prev) => [...prev, newVariant()])
  }

  function removeVariant(id) {
    setVariants((prev) => prev.filter((v) => v.id !== id))
  }

  function updateVariantName(id, option_name) {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, option_name } : v)))
  }

  function addValue(variantId) {
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, values: [...v.values, newVariantValue()] } : v))
    )
  }

  function removeValue(variantId, valueId) {
    setVariants((prev) =>
      prev.map((v) =>
        v.id === variantId ? { ...v, values: v.values.filter((val) => val.id !== valueId) } : v
      )
    )
  }

  function updateValue(variantId, valueId, patch) {
    setVariants((prev) =>
      prev.map((v) =>
        v.id === variantId
          ? { ...v, values: v.values.map((val) => (val.id === valueId ? { ...val, ...patch } : val)) }
          : v
      )
    )
  }

  function handleSubmit(e) {
    e.preventDefault()

    const cleanVariants = variants
      .filter((v) => v.option_name.trim())
      .map((v) => ({
        option_name: v.option_name.trim(),
        values: v.values
          .filter((val) => val.value.trim())
          .map((val) => ({
            value: val.value.trim(),
            price_override: val.price_override === "" ? null : Number(val.price_override),
          })),
      }))
      .filter((v) => v.values.length > 0)

    onSave({
      ...form,
      price: Number(form.price) || 0,
      cost: form.cost === "" ? null : Number(form.cost),
      variants: cleanVariants,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="items-center text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-600 text-white">
              <UtensilsIcon className="size-8" />
            </div>
            <DialogTitle>{item ? "Edit item" : "Add item"}</DialogTitle>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="item-name">Name</FieldLabel>
              <Input
                id="item-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="item-category">Category</FieldLabel>
              <Select
                value={form.category_id}
                onValueChange={(value) => setForm((f) => ({ ...f, category_id: value }))}
              >
                <SelectTrigger id="item-category" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Sold by</FieldLabel>
              <RadioGroup
                className="grid-flow-col justify-start gap-6"
                value={form.sold_by}
                onValueChange={(value) => setForm((f) => ({ ...f, sold_by: value }))}
              >
                <FieldLabel htmlFor="sold-by-each" className="w-fit font-normal">
                  <RadioGroupItem id="sold-by-each" value="each" />
                  Each
                </FieldLabel>
                <FieldLabel htmlFor="sold-by-weight" className="w-fit font-normal">
                  <RadioGroupItem id="sold-by-weight" value="weight" />
                  Weight/Volume
                </FieldLabel>
              </RadioGroup>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="item-price">Price (KSh)</FieldLabel>
                <Input
                  id="item-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="item-cost">Cost (KSh)</FieldLabel>
                <Input
                  id="item-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cost}
                  onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                  placeholder="Optional"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="item-sku">SKU</FieldLabel>
                <Input
                  id="item-sku"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  placeholder="Optional"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="item-barcode">Barcode</FieldLabel>
                <Input
                  id="item-barcode"
                  value={form.barcode}
                  onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                  placeholder="Optional"
                />
              </Field>
            </div>

            <Field orientation="horizontal" className="items-center justify-between">
              <div>
                <FieldLabel htmlFor="item-for-sale">Available for sale</FieldLabel>
                <p className="text-xs text-muted-foreground">Shows as a button on the POS screen</p>
              </div>
              <Switch
                id="item-for-sale"
                checked={form.available_for_sale}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, available_for_sale: checked }))}
              />
            </Field>

            <Field orientation="horizontal" className="items-center justify-between">
              <div>
                <FieldLabel htmlFor="item-track-stock">Track stock</FieldLabel>
                <p className="text-xs text-muted-foreground">Shows as a row in Inventory</p>
              </div>
              <Switch
                id="item-track-stock"
                checked={form.track_stock}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, track_stock: checked }))}
              />
            </Field>

            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Variants</p>
                  <p className="text-xs text-muted-foreground">
                    e.g. Size: Small / Medium / Large, each with its own price
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                  <PlusIcon className="size-3.5" />
                  Add option
                </Button>
              </div>

              {variants.map((variant) => (
                <div
                  key={variant.id}
                  className="space-y-2 rounded-md border border-dashed border-border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      value={variant.option_name}
                      onChange={(e) => updateVariantName(variant.id, e.target.value)}
                      placeholder="Option name (e.g. Size)"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.id)}
                      className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border text-destructive hover:bg-destructive/10"
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2 pl-1">
                    {variant.values.map((val) => (
                      <div key={val.id} className="flex items-center gap-2">
                        <Input
                          value={val.value}
                          onChange={(e) => updateValue(variant.id, val.id, { value: e.target.value })}
                          placeholder="Value (e.g. Small)"
                        />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={val.price_override}
                          onChange={(e) =>
                            updateValue(variant.id, val.id, { price_override: e.target.value })
                          }
                          placeholder="Price override"
                          className="w-36"
                        />
                        <button
                          type="button"
                          onClick={() => removeValue(variant.id, val.id)}
                          className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border text-destructive hover:bg-destructive/10"
                        >
                          <Trash2Icon className="size-3.5" />
                        </button>
                      </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" onClick={() => addValue(variant.id)}>
                      <PlusIcon className="size-3.5" />
                      Add value
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
