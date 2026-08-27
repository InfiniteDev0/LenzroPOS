"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  CreditCardIcon,
  LogOutIcon,
  MinusIcon,
  PlusIcon,
  SmartphoneIcon,
  Trash2Icon,
  WalletIcon,
} from "lucide-react"

import { createClient } from "@lenzro/supabase/client"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/currency"
import { notifyError } from "@/lib/errors"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VariantPickerDialog } from "@/components/variant-picker-dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet"

const ITEM_SELECT =
  "*, item_variants(id, option_name, item_variant_values(id, value, price_override))"

function cartKey(itemId, variantValueId) {
  return `${itemId}:${variantValueId ?? "base"}`
}

export default function Page() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState(null)
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [checkingOut, setCheckingOut] = useState(false)
  const [variantItem, setVariantItem] = useState(null)

  async function loadData() {
    setLoading(true)
    const [{ data: userData }, categoriesRes, itemsRes] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("categories").select("*").eq("active", true).order("name"),
      supabase.from("items").select(ITEM_SELECT).eq("available_for_sale", true).order("name"),
    ])
    setUser(userData?.user ?? null)
    if (categoriesRes.error) notifyError(categoriesRes.error, "Couldn't load categories")
    else setCategories(categoriesRes.data)
    if (itemsRes.error) notifyError(itemsRes.error, "Couldn't load menu items")
    else setItems(itemsRes.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visibleItems = useMemo(
    () => (categoryFilter === "all" ? items : items.filter((i) => i.category_id === categoryFilter)),
    [items, categoryFilter]
  )

  function addLine(item, extra = {}) {
    const key = cartKey(item.id, extra.variant_value_id)
    setCart((prev) => {
      const existing = prev.find((line) => line.key === key)
      if (existing) {
        return prev.map((line) =>
          line.key === key ? { ...line, quantity: line.quantity + 1 } : line
        )
      }
      return [
        ...prev,
        {
          key,
          item_id: item.id,
          name: item.name,
          variant_value_id: extra.variant_value_id ?? null,
          variant_label: extra.variant_label ?? null,
          unit_price: extra.unit_price ?? item.price,
          quantity: 1,
        },
      ]
    })
  }

  function handleItemTap(item) {
    if (item.item_variants?.length > 0) {
      setVariantItem(item)
      return
    }
    addLine(item)
  }

  function setQuantity(key, quantity) {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((line) => line.key !== key)
        : prev.map((line) => (line.key === key ? { ...line, quantity } : line))
    )
  }

  function removeLine(key) {
    setCart((prev) => prev.filter((line) => line.key !== key))
  }

  const subtotal = cart.reduce((sum, line) => sum + line.unit_price * line.quantity, 0)
  const tax = 0
  const total = subtotal + tax
  const totalCount = cart.reduce((sum, line) => sum + line.quantity, 0)

  async function handleCheckout() {
    setCheckingOut(true)

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({ subtotal, tax, total, payment_method: paymentMethod })
      .select()
      .single()

    if (orderError) {
      notifyError(orderError, "Couldn't place the order")
      setCheckingOut(false)
      return
    }

    const orderItemsPayload = cart.map((line) => ({
      order_id: order.id,
      item_id: line.item_id,
      variant_value_id: line.variant_value_id,
      name: line.name,
      variant_label: line.variant_label,
      unit_price: line.unit_price,
      quantity: line.quantity,
      line_total: line.unit_price * line.quantity,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItemsPayload)
    setCheckingOut(false)

    if (itemsError) {
      notifyError(itemsError, "Order saved, but the items failed to record")
      return
    }

    toast.success(`Order placed — ${formatCurrency(total)}`)
    setCart([])
    setCartOpen(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/auth")
    router.refresh()
  }

  if (loading) {
    return <div className="flex min-h-svh items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold">Lenzro POS</h1>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
          <LogOutIcon className="size-4" />
        </Button>
      </header>

      <main className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              categoryFilter === "all"
                ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                categoryFilter === cat.id
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {visibleItems.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No items to sell yet — add some from the admin app.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemTap(item)}
                className="flex flex-col items-start gap-1 rounded-xl border border-border p-3 text-left transition-colors hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
              >
                <span className="text-sm font-medium">{item.name}</span>
                <span className="font-semibold">{formatCurrency(item.price)}</span>
                {item.item_variants?.length > 0 && (
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    Choose {item.item_variants[0].option_name}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}
      </main>

      <div className="sticky bottom-0 border-t border-border bg-background p-4">
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetTrigger
            render={
              <Button className="w-full justify-between bg-emerald-600 text-white hover:bg-emerald-600/90" size="lg">
                <span>{totalCount === 0 ? "Cart empty" : `${totalCount} item${totalCount > 1 ? "s" : ""} in cart`}</span>
                <span>{formatCurrency(total)}</span>
              </Button>
            }
          />
          <SheetContent className="flex flex-col p-0">
            <SheetHeader className="border-b border-border">
              <SheetTitle>Current order</SheetTitle>
              <SheetDescription>Review items before checkout</SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
              {cart.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Tap a menu item to add it here.
                </p>
              )}
              {cart.map((line) => (
                <div key={line.key} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{line.name}</p>
                    {line.variant_label && (
                      <p className="truncate text-xs text-muted-foreground">{line.variant_label}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{formatCurrency(line.unit_price)} each</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuantity(line.key, line.quantity - 1)}
                      className="flex size-6 items-center justify-center rounded-full border border-border text-muted-foreground"
                    >
                      <MinusIcon className="size-3.5" />
                    </button>
                    <span className="w-4 text-center font-medium">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.key, line.quantity + 1)}
                      className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white"
                    >
                      <PlusIcon className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      className="flex size-6 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-border p-4">
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "cash", label: "Cash", icon: WalletIcon },
                  { id: "card", label: "Card", icon: CreditCardIcon },
                  { id: "mobile", label: "Mobile", icon: SmartphoneIcon },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPaymentMethod(id)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border py-2 text-xs font-medium",
                      paymentMethod === id
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <SheetFooter className="border-t border-border">
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                disabled={cart.length === 0 || checkingOut}
                onClick={handleCheckout}
              >
                {checkingOut ? "Placing order…" : `Place order — ${formatCurrency(total)}`}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <VariantPickerDialog
        key={variantItem?.id ?? "none"}
        item={variantItem}
        open={!!variantItem}
        onOpenChange={(open) => !open && setVariantItem(null)}
        onConfirm={(extra) => {
          addLine(variantItem, extra)
          setVariantItem(null)
        }}
      />
    </div>
  );
}
