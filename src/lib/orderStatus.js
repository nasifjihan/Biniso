// Status presentation, kept free of server imports so both server pages and
// client components can use it.

// The colour language for a status, shared by the admin list, the customer's
// orders and order tracking.
export function orderStatusVariant(status) {
  if (status === "pending") return "secondary";
  if (status === "cancelled") return "destructive";
  if (status === "confirmed") return "default";
  return "outline";
}

// What a status means for the customer, beyond the raw label.
export const STATUS_NOTES = {
  pending: "We have your order and will confirm it shortly.",
  confirmed: "Confirmed and being prepared for delivery.",
  shipped: "On its way to you.",
  delivered: "Delivered. Thanks for shopping with us.",
  cancelled: "Cancelled. Anything reserved for it is back in stock.",
};
