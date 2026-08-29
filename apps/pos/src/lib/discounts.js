// "apply_to: item" means applied to every line in the current cart, not a
// per-line picker — see IMPROVISING_LOG.md for why. For a percentage,
// that's mathematically identical to applying it to the subtotal once; the
// only real difference is for a fixed amount, which multiplies by the
// total quantity across the cart instead of being taken off once.
export function computeDiscountAmount(discountType, cart, subtotal) {
  if (!discountType) return 0;

  if (discountType.apply_to === "item") {
    if (discountType.kind === "percentage") {
      return round2(subtotal * (discountType.value / 100));
    }
    const totalQty = cart.reduce((sum, line) => sum + line.quantity, 0);
    return round2(Math.min(discountType.value * totalQty, subtotal));
  }

  return round2(
    discountType.kind === "percentage"
      ? subtotal * (discountType.value / 100)
      : Math.min(discountType.value, subtotal)
  );
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
