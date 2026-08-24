import Link from "next/link";
import { Wallet, ClipboardList, Table2, Timer, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { orderQueue } from "@/lib/mock-data";
import { dashboardStats, weeklySales, topDishes, tables, tableStatusStyles } from "@/lib/mock-data-pages";

const statIcons = { Wallet, ClipboardList, Table2, Timer };

const queueBadge = {
  "In Kitchen": "bg-emerald-100 text-emerald-700",
  "Wait List": "bg-orange-100 text-orange-700",
  Ready: "bg-violet-100 text-violet-700",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";
  const tableCounts = tables.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Welcome back, {firstName}</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s how the restaurant is doing today</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {dashboardStats.map((stat) => {
          const Icon = statIcons[stat.icon];
          return (
            <div key={stat.label} className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <span className="flex size-8 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950/40">
                  <Icon className="size-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {stat.isCurrency ? formatCurrency(stat.value) : stat.value}
              </p>
              <p
                className={cn(
                  "mt-1 flex items-center gap-1 text-xs font-medium",
                  stat.up ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {stat.up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {stat.change}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart data={weeklySales} />
        </div>

        <div className="rounded-xl border border-border bg-background p-5">
          <h2 className="font-semibold">Table Status</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(tableStatusStyles).map(([key, style]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className={cn("size-2.5 rounded-full", style.dot)} />
                  {style.label}
                </span>
                <span className="font-medium">{tableCounts[key] || 0}</span>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/manage-table"
            className="mt-4 flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline"
          >
            View all tables
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="font-semibold">Live Order Queue</h2>
            <Link href="/dashboard/order-line" className="text-sm font-medium text-teal-700 hover:underline">
              Open Order Line
            </Link>
          </div>
          <div className="divide-y divide-border">
            {orderQueue.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <p className="font-medium">Order #{order.id}</p>
                  <p className="text-xs text-muted-foreground">
                    Table {order.table} · {order.items} items · {order.time}
                  </p>
                </div>
                <Badge className={cn("rounded-full border-none", queueBadge[order.status])}>
                  {order.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="font-semibold">Top Selling Dishes</h2>
            <Link href="/dashboard/manage-dishes" className="text-sm font-medium text-teal-700 hover:underline">
              Manage Dishes
            </Link>
          </div>
          <div className="divide-y divide-border">
            {topDishes.map((dish) => (
              <div key={dish.name} className="flex items-center justify-between p-4 text-sm">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-muted text-lg">
                    {dish.emoji}
                  </span>
                  <div>
                    <p className="font-medium">{dish.name}</p>
                    <p className="text-xs text-muted-foreground">{dish.sold} sold today</p>
                  </div>
                </div>
                <p className="font-medium">{formatCurrency(dish.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
