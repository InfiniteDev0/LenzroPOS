"use client"

import { useRef, useState } from "react"
import { UploadIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const MAX_SIZE_MB = 5

export function ImageDropzone({ value, onUpload, onRemove, uploading }) {
  const inputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  function handleFile(file) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("That's not an image file")
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image is too large — max ${MAX_SIZE_MB}MB`)
      return
    }
    onUpload(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragActive(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  if (value) {
    return (
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="" className="size-20 rounded-lg border border-border object-cover" />
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Uploading…" : "Change photo"}
          </Button>
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
          >
            <XIcon className="size-3" />
            Remove
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragActive(true)
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
        dragActive ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" : "border-border hover:bg-muted/50"
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-full border border-border text-muted-foreground">
        <UploadIcon className="size-5" />
      </div>
      <div>
        <p className="text-sm font-medium">
          {uploading ? "Uploading…" : "Drag & drop an image here"}
        </p>
        <p className="text-xs text-muted-foreground">Or click to browse (up to {MAX_SIZE_MB}MB)</p>
      </div>
      <Button type="button" variant="outline" size="sm" disabled={uploading}>
        Browse files
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={uploading}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
