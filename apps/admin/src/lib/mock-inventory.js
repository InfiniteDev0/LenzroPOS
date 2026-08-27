import { MENU_ITEMS } from "@/lib/mock-transactions"

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

const rand = seededRandom(23);

function randomInt(min, max) {
  return Math.floor(min + rand() * (max - min + 1));
}

// Full-stock ("par") level and current stock per menu item. A handful of
// items are deliberately seeded low/critical so the alert states have
// something real to show.
export const initialInventory = MENU_ITEMS.map((item) => {
  const parLevel = randomInt(40, 120);
  const lowStockThreshold = Math.round(parLevel * 0.25);
  const stockRoll = rand();
  // ~20% critical, ~25% low, rest healthy
  const currentStock =
    stockRoll < 0.2
      ? randomInt(0, lowStockThreshold)
      : stockRoll < 0.45
        ? randomInt(lowStockThreshold + 1, Math.round(parLevel * 0.5))
        : randomInt(Math.round(parLevel * 0.5) + 1, parLevel);

  return {
    name: item.name,
    category: item.category,
    unit: "pcs",
    parLevel,
    lowStockThreshold,
    currentStock,
  };
});

export function stockStatus(item) {
  if (item.currentStock <= item.lowStockThreshold) return "critical";
  if (item.currentStock <= Math.round(item.parLevel * 0.5)) return "low";
  return "healthy";
}
