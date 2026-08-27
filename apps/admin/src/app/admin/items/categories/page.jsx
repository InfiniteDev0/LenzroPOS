"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRightIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@lenzro/supabase/client"
import { notifyError } from "@/lib/errors"
import { AdminPageHeader } from "@/components/admin-page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { CategoryDialog } from "@/components/category-dialog"
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

export default function Page() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadCategories() {
    setLoading(true)
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) {
      notifyError(error, "Couldn't load categories")
    } else {
      setCategories(data)
    }
    setLoading(false)
  }

  function openAdd() {
    setEditingCategory(null)
    setDialogOpen(true)
  }

  function openEdit(category) {
    setEditingCategory(category)
    setDialogOpen(true)
  }

  async function handleSave(form) {
    setSaving(true)
    const payload = { name: form.name, active: form.active }
    const { error } = editingCategory
      ? await supabase.from("categories").update(payload).eq("id", editingCategory.id)
      : await supabase.from("categories").insert(payload)
    setSaving(false)

    if (error) {
      notifyError(error, "Couldn't save the category")
      return
    }

    toast.success(editingCategory ? "Category updated" : "Category added")
    setDialogOpen(false)
    loadCategories()
  }

  async function handleDelete() {
    const { error } = await supabase.from("categories").delete().eq("id", deleteTarget.id)
    if (error) {
      notifyError(
        error,
        "Couldn't delete the category",
        error.code === "23503"
          ? "This category still has items assigned to it — move or delete those first."
          : null
      )
    } else {
      toast.success("Category deleted")
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  return (
    <>
      <AdminPageHeader crumbs={[{ label: "Item" }, { label: "All categories" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {loading ? null : categories.length === 0 ? (
          <EmptyState
            image="/category.png"
            imageAlt="Category"
            title="No categories yet"
            description="Create categories to group your items so they're easier to organize later on."
            actionLabel="Add category"
            onAction={openAdd}
          />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-600/90" onClick={openAdd}>
                <PlusIcon />
                Add category
              </Button>
            </div>
            <Card className="bg-background">
              <CardContent className="px-2 sm:p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow
                        key={category.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/admin/items?category=${category.id}`)}
                      >
                        <TableCell className="font-medium text-foreground">{category.name}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              category.active
                                ? "border-none bg-emerald-100 text-emerald-700"
                                : "border-none bg-muted text-muted-foreground"
                            }
                          >
                            {category.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <ArrowRightIcon className="mr-1 size-4 text-muted-foreground" />
                            <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button variant="ghost" size="icon" className="size-7">
                                    <MoreHorizontalIcon className="size-4" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(category)}>
                                  <PencilIcon />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setDeleteTarget(category)}
                                >
                                  <Trash2Icon />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <CategoryDialog
        category={editingCategory}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        saving={saving}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone. Items using this category must be reassigned first.
            </AlertDialogDescription>
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
