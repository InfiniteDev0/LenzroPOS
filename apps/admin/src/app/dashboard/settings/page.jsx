import { createClient } from "@lenzro/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and restaurant preferences</p>
      </div>

      <div className="rounded-xl border border-border bg-background p-5">
        <h2 className="font-semibold">Profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="full-name">Full name</Label>
            <Input id="full-name" defaultValue={user?.user_metadata?.full_name ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" defaultValue={user?.email ?? ""} disabled />
          </div>
        </div>
        <Button className="mt-4">Save Changes</Button>
      </div>

      <div className="rounded-xl border border-border bg-background p-5">
        <h2 className="font-semibold">Restaurant</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="restaurant-name">Restaurant name</Label>
            <Input id="restaurant-name" placeholder="Lenzro Bistro" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" defaultValue="KES" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tax-rate">Tax rate (%)</Label>
            <Input id="tax-rate" type="number" defaultValue="5" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="service-charge">Service charge (KSh)</Label>
            <Input id="service-charge" type="number" defaultValue="80" />
          </div>
        </div>
        <Button className="mt-4 bg-teal-600 text-white hover:bg-teal-600/90">Save Changes</Button>
      </div>

      <div className="rounded-xl border border-destructive/30 bg-background p-5">
        <h2 className="font-semibold text-destructive">Danger Zone</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These actions are permanent and cannot be undone.
        </p>
        <Separator className="my-4" />
        <Button variant="destructive">Delete Account</Button>
      </div>
    </div>
  );
}
