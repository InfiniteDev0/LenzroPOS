import { createClient } from "@lenzro/supabase/server";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex h-screen min-h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          fullName={user?.user_metadata?.full_name}
          email={user?.email}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
