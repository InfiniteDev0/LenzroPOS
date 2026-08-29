"use client"

import { useRef } from "react"

export function PinInput({ pin, onChange }) {
  const digits = pin.padEnd(4, " ").slice(0, 4).split("")
  const refs = useRef([])

  function setDigit(index, value) {
    const clean = value.replace(/\D/g, "").slice(-1)
    const next = digits.slice()
    next[index] = clean || " "
    onChange(next.join("").trimEnd())
    if (clean && index < 3) refs.current[index + 1]?.focus()
  }

  return (
    <div className="flex gap-3">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={digit.trim()}
          onChange={(e) => setDigit(i, e.target.value)}
          inputMode="numeric"
          maxLength={1}
          className="size-10 border-b-2 border-input text-center text-lg outline-none focus:border-ring" />
      ))}
    </div>
  );
}
