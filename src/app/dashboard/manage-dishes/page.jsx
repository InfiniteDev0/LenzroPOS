"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Upload } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/currency"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { menuCategories, menuItems } from "@/lib/mock-data"

const categoryOptions = menuCategories.filter((cat) => cat.id !== "all")

const emptyForm = {
  name: "",
  category: categoryOptions[0]?.id ?? "special",
  price: "",
  discountEnabled: false,
  discountPercent: "",
  imagePreview: "",
}

export default function ManageDishesPage() {
  const [dishes, setDishes] = useState(menuItems)
  const [category, setCategory] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const visibleItems =
    category === "all" ? dishes : dishes.filter((item) => item.category === category)

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, imagePreview: reader.result }))
    reader.readAsDataURL(file)
  }

  function handleDialogOpenChange(open) {
    setDialogOpen(open)
    if (!open) setForm(emptyForm)
  }

  function handleAddDish(e) {
    e.preventDefault()
    if (!form.name || !form.price) return

    const categoryLabel = categoryOptions.find((c) => c.id === form.category)?.label ?? ""

    setDishes((prev) => [
      {
        id: `dish-${Date.now()}`,
        name: form.name,
        tag: categoryLabel,
        price: Number(form.price),
        category: form.category,
        emoji: "🍽️",
        image: form.imagePreview || null,
        discount: form.discountEnabled ? Number(form.discountPercent) || 0 : 0,
      },
      ...prev,
    ])
    toast.success("Dish added")
    handleDialogOpenChange(false)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Manage Dishes</h1>
          <p className="text-sm text-muted-foreground">{dishes.length} dishes on the menu</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger
            render={
              <Button className="bg-teal-600 text-white hover:bg-teal-600/90">
                <Plus className="size-4" />
                Add Dish
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleAddDish} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Add Dish</DialogTitle>
                <DialogDescription>Add a new dish to the menu.</DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                  {form.imagePreview ? (
                    <img src={form.imagePreview} alt="" className="size-full object-cover" />
                  ) : (
                    <Upload className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="dish-image">Dish image</Label>
                  <Input id="dish-image" type="file" accept="image/*" onChange={handleImageChange} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dish-name">Dish name</Label>
                <Input
                  id="dish-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Grilled Chicken Salad"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dish-category">Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) => setForm((f) => ({ ...f, category: value }))}
                  >
                    <SelectTrigger id="dish-category" className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dish-price">Price (KSh)</Label>
                  <Input
                    id="dish-price"
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Allow discount</p>
                  <p className="text-xs text-muted-foreground">
                    Let this dish be discounted at checkout
                  </p>
                </div>
                <Switch
                  checked={form.discountEnabled}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, discountEnabled: checked }))}
                />
              </div>

              {form.discountEnabled && (
                <div className="space-y-1.5">
                  <Label htmlFor="dish-discount">Discount (%)</Label>
                  <Input
                    id="dish-discount"
                    type="number"
                    min="0"
                    max="100"
                    value={form.discountPercent}
                    onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              )}

              <DialogFooter>
                <Button type="submit" className="bg-teal-600 text-white hover:bg-teal-600/90">
                  Add Dish
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        {menuCategories.map((cat) => {
          const active = category === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-teal-600 bg-teal-50 text-teal-700 dark:bg-teal-950/40"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => toast("Add category — coming soon")}
          className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-teal-600 hover:text-teal-600"
        >
          <Plus className="size-3.5" />
          Add Category
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Dish</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibleItems.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        className="size-9 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
                        {item.emoji}
                      </span>
                    )}
                    <span className="font-medium">{item.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.tag}</td>
                <td className="px-4 py-3 font-medium">
                  {formatCurrency(item.price)}
                  {item.discount > 0 && (
                    <Badge className="ml-2 rounded-full border-none bg-teal-100 text-teal-700">
                      -{item.discount}%
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge className="rounded-full border-none bg-emerald-100 text-emerald-700">
                    Available
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground">
                      <Pencil className="size-3.5" />
                    </button>
                    <button className="flex size-7 items-center justify-center rounded-md border border-border text-destructive hover:bg-destructive/10">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
