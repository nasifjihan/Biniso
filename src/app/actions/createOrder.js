"use server";

import { supabase } from "@/lib/supabase";
import { sendOrderEmail } from "@/lib/email";

export async function createOrder(formData, cart) {
  const customer_name = formData.get("name");
  const phone = formData.get("phone");
  const address = formData.get("address");
  const notes = formData.get("notes");

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Insert order
  const { data: order, error } = await supabase
    .from("orders")
    .insert([{ customer_name, phone, address, notes, total }])
    .select()
    .single();

  if (error) throw error;

  // Insert order items
  const items = cart.map((item) => ({
    order_id: order.id,
    product_id: item.id,
    quantity: item.quantity,
    price: item.price,
  }));

  await supabase.from("order_items").insert(items);

  await sendOrderEmail({ customer_name, phone, address, total });

  return order.id;
}
