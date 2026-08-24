"use client"

import { useState } from "react"
import { ChevronDown, Mail, MessageCircle, Phone } from "lucide-react"

import { cn } from "@/lib/utils"
import { faqItems } from "@/lib/mock-data-pages"

export default function HelpCenterPage() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div className="max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Help Center</h1>
        <p className="text-sm text-muted-foreground">Answers to common questions, or reach out to us directly</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: MessageCircle, label: "Live Chat", detail: "Avg. reply in 5 min" },
          { icon: Mail, label: "Email Support", detail: "support@lenzro.pos" },
          { icon: Phone, label: "Call Us", detail: "+1 (555) 010-2938" },
        ].map(({ icon: Icon, label, detail }) => (
          <div key={label} className="rounded-xl border border-border bg-background p-4 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950/40">
              <Icon className="size-5" />
            </div>
            <p className="mt-2 font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{detail}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">Frequently Asked Questions</h2>
        </div>
        <div className="divide-y divide-border">
          {faqItems.map((item, index) => {
            const open = openIndex === index
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? -1 : index)}
                  className="flex w-full items-center justify-between p-4 text-left text-sm font-medium"
                >
                  {item.q}
                  <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} />
                </button>
                {open && (
                  <p className="px-4 pb-4 text-sm text-muted-foreground">{item.a}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
