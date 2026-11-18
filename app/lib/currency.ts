export const FREE_DELIVERY_THRESHOLD = 150000;

const ugxFormatter = new Intl.NumberFormat("en-UG", {
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number) {
  return `UGX ${ugxFormatter.format(amount)}`;
}
