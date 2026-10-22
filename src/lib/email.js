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
        ? `<p>Delivery: ${String(order.delivery_method).replaceAll("_", " ")} (৳ ${order.delivery_fee || 0})</p>`
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
