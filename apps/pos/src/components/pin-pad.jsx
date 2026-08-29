"use client"

import { DeleteIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

export function PinPad({ value, onChange, length = 4 }) {
  function press(key) {
    if (key === "back") {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length >= length) return;
    onChange(value + key);
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8 sm:max-w-sm">
      <div className="flex gap-4">
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "size-5 rounded-full border-2 sm:size-6",
              i < value.length ? "border-emerald-600 bg-emerald-600" : "border-border"
            )}
          />
        ))}
      </div>
      <div className="grid w-full grid-cols-3 overflow-hidden rounded-2xl border border-border">
        {KEYS.map((key, i) =>
          key === "" ? (
            <div key={i} className="aspect-square border border-border/60" />
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => press(key)}
              className="flex aspect-square items-center justify-center border border-border/60 text-3xl font-semibold hover:bg-muted active:bg-muted sm:text-4xl"
            >
              {key === "back" ? <DeleteIcon className="size-7 sm:size-8" /> : key}
            </button>
          )
        )}
      </div>
    </div>
  );
}
