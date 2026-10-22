import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function formatItems(items) {
  if (!Array.isArray(items) || items.length === 0) return "";

  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:4px 8px;border:1px solid #ddd">${item.name}</td>
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

export async function sendOrderEmail(order) {
  const to = process.env.ORDER_RECEIVER_EMAIL || order?.email;
  if (!to || !process.env.RESEND_API_KEY) return;

  const from = process.env.ORDER_FROM_EMAIL || "onboarding@resend.dev";

  try {
    await resend.emails.send({
      from,
      to,
      subject: "New Order Received",
      html: `
        <h2>New Order</h2>
        <p>Name: ${order.customer_name}</p>
        <p>Phone: ${order.phone}</p>
        ${order.email ? `<p>Email: ${order.email}</p>` : ""}
        <p>Address: ${order.address}</p>
        ${order.city ? `<p>City: ${order.city}</p>` : ""}
        ${
          order.delivery_method
            ? `<p>Delivery: ${order.delivery_method} (৳ ${
                order.delivery_fee || 0
              })</p>`
            : ""
        }
        ${order.notes ? `<p>Notes: ${order.notes}</p>` : ""}
        ${formatItems(order.items)}
        ${order.subtotal ? `<p>Subtotal: ৳ ${order.subtotal}</p>` : ""}
        <p><strong>Total: ৳ ${order.total}</strong></p>
      `,
    });
  } catch (e) {
    throw new Error(e?.message || "Failed to send email");
  }
}
