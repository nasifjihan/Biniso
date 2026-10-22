import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const fromAddress = () => process.env.ORDER_FROM_EMAIL || "onboarding@resend.dev";

function formatItems(items) {
  if (!Array.isArray(items) || items.length === 0) return "";

  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:4px 8px;border:1px solid #ddd">${item.name}${
            item.variant_label
              ? `<br><span style="color:#666;font-size:12px">${item.variant_label}</span>`
              : ""
          }</td>
          <td style="padding:4px 8px;border:1px solid #ddd;text-align:center">${item.quantity}</td>
          <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">৳ ${item.price}</td>
          <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">৳ ${item.price * item.quantity}</td>
        </tr>`,
    )
    .join("");

  return `
    <table style="border-collapse:collapse;margin-top:8px">
      <thead>
        <tr>
          <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Item</th>
          <th style="padding:4px 8px;border:1px solid #ddd">Qty</th>
          <th style="padding:4px 8px;border:1px solid #ddd;text-align:right">Price</th>
          <th style="padding:4px 8px;border:1px solid #ddd;text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildOrderHtml(order, heading) {
  return `
    <h2>${heading}</h2>
    <p>Order ID: ${order.id}</p>
    <p>Name: ${order.customer_name}</p>
    <p>Phone: ${order.phone}</p>
    ${order.email ? `<p>Email: ${order.email}</p>` : ""}
    <p>Address: ${order.address}</p>
    ${order.city ? `<p>City: ${order.city}</p>` : ""}
    ${
      order.delivery_method
        ? `<p>Delivery: ${order.delivery_name || String(order.delivery_method).replaceAll("_", " ")} (৳ ${order.delivery_fee || 0})</p>`
        : ""
    }
    ${order.notes ? `<p>Notes: ${order.notes}</p>` : ""}
    ${formatItems(order.items)}
    ${order.subtotal ? `<p>Subtotal: ৳ ${order.subtotal}</p>` : ""}
    ${
      Number(order.discount) > 0
        ? `<p>Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}: - ৳ ${order.discount}</p>`
        : ""
    }
    <p><strong>Total: ৳ ${order.total}</strong></p>
  `;
}

// What the customer is told for each status worth an email. `pending` is the
// state the confirmation email already covers.
const STATUS_EMAILS = {
  confirmed: {
    subject: "Your order is confirmed",
    heading: "Order confirmed",
    message:
      "We have received your order and it is now being prepared for delivery.",
  },
  shipped: {
    subject: "Your order is on the way",
    heading: "Order shipped",
    message: "Your order has left our store and is on its way to you.",
  },
  delivered: {
    subject: "Your order has been delivered",
    heading: "Order delivered",
    message: "Your order has been delivered. We hope you enjoy it!",
  },
  cancelled: {
    subject: "Your order has been cancelled",
    heading: "Order cancelled",
    message:
      "Your order has been cancelled and anything reserved for it is back in stock. If you did not expect this, please contact us.",
  },
};

function buildStatusHtml(order, copy) {
  return `
    <h2>${copy.heading}</h2>
    <p>Hi ${order.customer_name},</p>
    <p>${copy.message}</p>
    <p>Order ID: ${order.id}</p>
    ${formatItems(order.items)}
    <p><strong>Total: ৳ ${order.total}</strong></p>
  `;
}

// Notification to the store owner.
export async function sendOrderEmail(order) {
  const to = process.env.ORDER_RECEIVER_EMAIL || order?.email;
  if (!to || !process.env.RESEND_API_KEY) return;

  try {
    await resend.emails.send({
      from: fromAddress(),
      to,
      subject: "New Order Received",
      html: buildOrderHtml(order, "New Order"),
    });
  } catch (e) {
    throw new Error(e?.message || "Failed to send email");
  }
}

// Receipt for the customer.
export async function sendOrderConfirmation(order) {
  if (!order?.email || !process.env.RESEND_API_KEY) return;

  try {
    await resend.emails.send({
      from: fromAddress(),
      to: order.email,
      subject: `Order confirmed — ${order.id}`,
      html: buildOrderHtml(order, "Thanks for your order!"),
    });
  } catch (e) {
    throw new Error(e?.message || "Failed to send confirmation email");
  }
}

// Progress update for the customer. Statuses without copy send nothing.
export async function sendOrderStatusEmail(order, status) {
  const copy = STATUS_EMAILS[status];
  if (!copy || !order?.email || !process.env.RESEND_API_KEY) return;

  try {
    await resend.emails.send({
      from: fromAddress(),
      to: order.email,
      subject: `${copy.subject} — ${order.id}`,
      html: buildStatusHtml(order, copy),
    });
  } catch (e) {
    throw new Error(e?.message || "Failed to send status email");
  }
}

// Alert to the store owner. Sent from the checkout when a sale pushes a tracked
// product to or below the low-stock threshold.
export async function sendLowStockEmail(items) {
  const to = process.env.ORDER_RECEIVER_EMAIL;
  if (!to || !process.env.RESEND_API_KEY || !items?.length) return;

  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:4px 8px;border:1px solid #ddd">${item.name}</td>
          <td style="padding:4px 8px;border:1px solid #ddd;text-align:center">${item.stock}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <h2>Low stock</h2>
    <p>These products have sold down to the alert level and need restocking:</p>
    <table style="border-collapse:collapse;margin-top:8px">
      <thead>
        <tr>
          <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Product</th>
          <th style="padding:4px 8px;border:1px solid #ddd">Left</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;

  try {
    await resend.emails.send({
      from: fromAddress(),
      to,
      subject: `Low stock: ${items.length} product${items.length > 1 ? "s" : ""}`,
      html,
    });
  } catch (e) {
    throw new Error(e?.message || "Failed to send low-stock email");
  }
}
