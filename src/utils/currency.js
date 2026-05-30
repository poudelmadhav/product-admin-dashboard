const rupeeFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatRupees(value) {
  return `Rs. ${rupeeFormatter.format(Number(value) || 0)}`;
}
