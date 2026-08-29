"use client"

import { useState } from "react"
import {
  BarcodeIcon,
  ClockIcon,
  MailIcon,
  MonitorIcon,
  PrinterIcon,
  ShoppingBagIcon,
  TicketIcon,
  TimerIcon,
  UtensilsCrossedIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

const FEATURES = [
  {
    key: "shifts",
    icon: ClockIcon,
    title: "Shifts",
    description: "Track cash that goes in and out of your drawer.",
  },
  {
    key: "timeClock",
    icon: TimerIcon,
    title: "Time clock",
    description: "Track employees' clock in/out time and calculate their total work hours.",
  },
  {
    key: "openTickets",
    icon: TicketIcon,
    title: "Open tickets",
    description: "Allow to save and edit orders before completing a payment.",
  },
  {
    key: "lowStockNotifications",
    icon: MailIcon,
    title: "Low stock notifications",
    description: "Get daily email on items that are low or out of stock.",
  },
  {
    key: "negativeStockAlerts",
    icon: ShoppingBagIcon,
    title: "Negative stock alerts",
    description: "Warn cashiers attempting to sell more inventory than available in stock.",
  },
]

export default function Page() {
  const [enabled, setEnabled] = useState({})

  function toggle(key, value) {
    setEnabled((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    toast.success("Feature settings saved")
  }

  return (
    <Card className="gap-0 py-0">
      <div className="border-b p-4">
        <h2 className="text-lg font-medium">Features</h2>
      </div>
      <CardContent className="divide-y p-0">
        {FEATURES.map((feature) => (
          <div key={feature.key} className="flex items-center gap-4 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <feature.icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{feature.title}</p>
              <p className="text-sm text-muted-foreground">
                {feature.description}{" "}
                <a href="#" className="text-emerald-600 hover:underline">
                  Learn more
                </a>
              </p>
            </div>
            <Switch
              checked={Boolean(enabled[feature.key])}
              onCheckedChange={(value) => toggle(feature.key, value)} />
          </div>
        ))}
      </CardContent>
      <div className="flex justify-end gap-2 border-t bg-muted/50 p-4">
        <Button variant="outline">Cancel</Button>
        <Button className="bg-emerald-600 hover:bg-emerald-600/90" onClick={handleSave}>
          Save
        </Button>
      </div>
    </Card>
  );
}
