"use server";

import { supabase } from "@/lib/supabase";
import { sendOrderEmail } from "@/lib/email";

export async function createOrder(formData, cart) {
  try {
    const customer_name = formData.get("name");
    const phone = formData.get("phone");
    const email = formData.get("email");
    const city = formData.get("city");
    const address = formData.get("address");
    const notes = formData.get("notes");
    const delivery_method = formData.get("delivery_method") || "inside_dhaka";

    if (!Array.isArray(cart) || cart.length === 0) {
      return { ok: false, error: "Cart is empty" };
    }

    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const delivery_fee =
      delivery_method === "outside_dhaka"
        ? 120
        : delivery_method === "pickup"
          ? 0
          : 60;
    const total = subtotal + delivery_fee;

    const fullPayload = {
      customer_name,
      phone,
      email,
      city,
      address,
      notes,
      subtotal,
      delivery_method,
      delivery_fee,
      total,
      status: "pending",
    };

    let order;
    const { data: created1, error: err1 } = await supabase
      .from("orders")
      .insert([fullPayload])
      .select()
      .single();

    if (!err1) {
      order = created1;
    } else {
      const minimalPayload = {
        customer_name,
        phone,
        address,
        notes,
        total,
        status: "pending",
      };
      const { data: created2, error: err2 } = await supabase
        .from("orders")
        .insert([minimalPayload])
        .select()
        .single();

      if (!err2) {
        order = created2;
      } else {
        const { data: created3, error: err3 } = await supabase
          .from("orders")
          .insert([{ customer_name, phone, address, notes, total }])
          .select()
          .single();

        if (err3) {
          return { ok: false, error: err3.message || "Failed to create order" };
        }
        order = created3;
      }
    }

    const items = cart.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(items);
    if (itemsError) {
      return { ok: false, error: itemsError.message || "Failed to save items" };
    }

    try {
      await sendOrderEmail({
        customer_name,
        phone,
        email,
        city,
        address,
        subtotal,
        delivery_method,
        delivery_fee,
        total,
      });
    } catch (e) {
      return {
        ok: true,
        orderId: order.id,
        subtotal,
        delivery_method,
        delivery_fee,
        total,
        emailWarning: e?.message || "Email failed",
      };
    }

    return {
      ok: true,
      orderId: order.id,
      subtotal,
      delivery_method,
      delivery_fee,
      total,
    };
  } catch (e) {
    return { ok: false, error: e?.message || "Checkout failed" };
  }
}
