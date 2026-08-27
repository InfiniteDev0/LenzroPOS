import { AdminPageHeader } from "@/components/admin-page-header"
import { EmptyState } from "@/components/empty-state"

export default function Page() {
  return (
    <>
      <AdminPageHeader crumbs={[{ label: "Item" }, { label: "All categories" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <EmptyState
          image="/category.png"
          imageAlt="Category"
          title="No categories yet"
          description="Create categories to group your items so they're easier to organize later on."
          actionLabel="Add category" />
      </div>
    </>
  );
}
