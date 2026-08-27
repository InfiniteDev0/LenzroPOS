export function formatCurrency(amount, { decimals = 0 } = {}) {
  const value = Number(amount) || 0;
  return `KSh ${value.toLocaleString("en-KE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
