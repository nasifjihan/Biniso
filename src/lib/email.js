import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderEmail(order) {
  await resend.emails.send({
    from: "nasifzeehan1@gmail.com",
    to: order.email,
    subject: "New Order Received",
    html: `
      <h2>New Order</h2>
      <p>Name: ${order.customer_name}</p>
      <p>Phone: ${order.phone}</p>
      <p>Address: ${order.address}</p>
      <p>Total: ৳ ${order.total}</p>
    `,
  });
}
