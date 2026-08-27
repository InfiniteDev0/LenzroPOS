import { AdminPageHeader } from "@/components/admin-page-header"

export default function Page() {
  return (
    <>
      <AdminPageHeader crumbs={[{ label: "Employees" }, { label: "Access rights" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0" />
    </>
  );
}
