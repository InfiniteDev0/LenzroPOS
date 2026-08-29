"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@lenzro/supabase/client"
import { formatCurrency } from "@/lib/currency"
import { saveItemWithVariants } from "@/lib/items-api"
import { notifyError } from "@/lib/errors"
import { uploadItemImage } from "@/lib/upload-item-image"
import { AdminPageHeader } from "@/components/admin-page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { ItemDialog } from "@/components/item-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

const ITEM_SELECT =
  "*, categories(id, name), item_variants(id, option_name, item_variant_values(id, value, price_override))"

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ItemsPageContent />
    </Suspense>
  );
}

function ItemsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryFilter = searchParams.get("category")

  const [supabase] = useState(() => createClient())
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter])

  async function loadData() {
    setLoading(true)
    let itemsQuery = supabase.from("items").select(ITEM_SELECT).order("created_at", { ascending: false })
    if (categoryFilter) itemsQuery = itemsQuery.eq("category_id", categoryFilter)

    const [itemsRes, categoriesRes] = await Promise.all([
      itemsQuery,
      supabase.from("categories").select("*").order("name"),
    ])
    if (itemsRes.error) notifyError(itemsRes.error, "Couldn't load items")
    else setItems(itemsRes.data)
    if (categoriesRes.error) notifyError(categoriesRes.error, "Couldn't load categories")
    else setCategories(categoriesRes.data)
    setLoading(false)
  }

  function openAdd() {
    setEditingItem(null)
    setDialogOpen(true)
  }

  function openEdit(item) {
    setEditingItem(item)
    setDialogOpen(true)
  }

  async function handleSave(form) {
    setSaving(true)
    const { variants, ...rest } = form
    const payload = {
      name: rest.name,
      category_id: rest.category_id,
      price: rest.price,
      cost: rest.cost,
      sold_by: rest.sold_by,
      sku: rest.sku || null,
      barcode: rest.barcode || null,
      available_for_sale: rest.available_for_sale,
      track_stock: rest.track_stock,
      image_url: rest.image_url || null,
    }
    const { error } = await saveItemWithVariants(supabase, {
      itemId: editingItem?.id ?? null,
      payload,
      variants,
    })
    setSaving(false)

    if (error) {
      notifyError(error, "Couldn't save the item")
      return
    }

    toast.success(editingItem ? "Item updated" : "Item added")
    setDialogOpen(false)
    loadData()
  }

  async function handleUploadImage(file) {
    const { url, error } = await uploadItemImage(supabase, file)
    if (error) {
      notifyError(error, "Couldn't upload the photo")
      return null
    }
    return url
  }

  async function handleDelete() {
    const { error } = await supabase.from("items").delete().eq("id", deleteTarget.id)
    if (error) {
      notifyError(error, "Couldn't delete the item")
    } else {
      toast.success("Item deleted")
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  const noCategories = categories.length === 0
  const activeCategory = categoryFilter ? categories.find((c) => c.id === categoryFilter) : null

  return (
    <>
      <AdminPageHeader crumbs={[{ label: "Item" }, { label: "All items" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {loading ? null : items.length === 0 && !categoryFilter ? (
          <EmptyState
            image="/item.png"
            imageAlt="Shopping cart"
            title="No items yet"
            description={
              noCategories
                ? "Create a category first, then add the dishes, drinks, and products you sell."
                : "Add the dishes, drinks, and products you sell so they show up here and across your reports."
            }
            actionLabel={noCategories ? "Go to categories" : "Add item"}
            onAction={noCategories ? () => router.push("/admin/items/categories") : openAdd}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                className="gap-2 bg-emerald-600 hover:bg-emerald-600/90"
                onClick={openAdd}
                disabled={noCategories}
              >
                <PlusIcon />
                Add item
              </Button>
              {activeCategory && (
                <Badge variant="outline" className="gap-1 rounded-full py-1 pr-1 pl-2.5">
                  Category: {activeCategory.name}
                  <button
                    type="button"
                    onClick={() => router.push("/admin/items")}
                    className="flex size-4 items-center justify-center rounded-full hover:bg-muted"
                  >
                    <XIcon className="size-3" />
                  </button>
                </Badge>
              )}
            </div>
            <Card className="bg-background">
              <CardContent className="px-2 sm:p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                          No items in this category yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-foreground">
                            {item.name}
                            {item.item_variants?.length > 0 && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({item.item_variants.length} variant
                                {item.item_variants.length > 1 ? "s" : ""})
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.categories?.name ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{item.sku || "—"}</TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                            {item.cost != null ? formatCurrency(item.cost) : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatCurrency(item.price)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              <Badge
                                className={
                                  item.available_for_sale
                                    ? "border-none bg-emerald-100 text-emerald-700"
                                    : "border-none bg-muted text-muted-foreground"
                                }
                              >
                                {item.available_for_sale ? "For sale" : "Not for sale"}
                              </Badge>
                              {item.track_stock && (
                                <Badge variant="outline" className="rounded-full">
                                  Tracked
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button variant="ghost" size="icon" className="size-7">
                                    <MoreHorizontalIcon className="size-4" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(item)}>
                                  <PencilIcon />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setDeleteTarget(item)}
                                >
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
          </>
        )}
      </div>

      <ItemDialog
        item={editingItem}
        categories={categories}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        onUploadImage={handleUploadImage}
        saving={saving}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
