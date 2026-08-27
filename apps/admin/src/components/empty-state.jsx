import { Button } from "@/components/ui/button"

export function EmptyState({ image, imageAlt = "", title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <img src={image} alt={imageAlt} className="h-40 w-40 object-contain" />
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {actionLabel && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
