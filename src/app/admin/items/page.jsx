import { AdminPageHeader } from "@/components/admin-page-header"
import { EmptyState } from "@/components/empty-state"

export default function Page() {
  return (
    <>
      <AdminPageHeader crumbs={[{ label: "Item" }, { label: "All items" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <EmptyState
          image="/item.png"
          imageAlt="Shopping cart"
          title="No items yet"
          description="Add the dishes, drinks, and products you sell so they show up here and across your reports."
          actionLabel="Add item" />
      </div>
    </>
  );
}
