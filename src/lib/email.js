import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
        <p>Total: ৳ ${order.total}</p>
      `,
    });
  } catch (e) {
    throw new Error(e?.message || "Failed to send email");
  }
}
