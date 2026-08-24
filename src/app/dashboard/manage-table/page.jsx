import { Plus, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { tables, tableStatusStyles } from "@/lib/mock-data-pages";

export default function ManageTablePage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Manage Table</h1>
          <p className="text-sm text-muted-foreground">
            {tables.length} tables · {tables.filter((t) => t.status === "occupied").length} occupied
          </p>
        </div>
        <Button className="bg-teal-600 text-white hover:bg-teal-600/90">
          <Plus className="size-4" />
          Add Table
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        {Object.entries(tableStatusStyles).map(([key, style]) => (
          <div key={key} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={cn("size-2.5 rounded-full", style.dot)} />
            {style.label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {tables.map((table) => {
          const style = tableStatusStyles[table.status];
          return (
            <div
              key={table.id}
              className={cn("rounded-xl border p-4 text-center", style.card)}
            >
              <p className="text-lg font-semibold">Table {table.id}</p>
              <p className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3.5" />
                {table.seats} seats
              </p>
              <Badge className={cn("mt-3 rounded-full border-none", style.badge)}>
                {style.label}
              </Badge>
              {table.order && (
                <p className="mt-2 text-xs text-muted-foreground">Order #{table.order}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
