export function formatCurrency(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString("en-US")}`;
}
