"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendOrderEmail } from "@/lib/email";

const DELIVERY_FEES = {
  inside_dhaka: 60,
  outside_dhaka: 120,
  pickup: 0,
};

export async function createOrder(formData, cart) {
  try {
    if (!Array.isArray(cart) || cart.length === 0) {
      return { ok: false, error: "Cart is empty" };
    }

    const customer_name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const email = String(formData.get("email") || "").trim() || null;
    const city = String(formData.get("city") || "").trim() || null;
    const notes = String(formData.get("notes") || "").trim() || null;

    const requestedMethod = formData.get("delivery_method");
    const delivery_method = Object.hasOwn(DELIVERY_FEES, requestedMethod)
      ? requestedMethod
      : "inside_dhaka";

    if (!customer_name || !phone || !address) {
      return { ok: false, error: "Name, phone and address are required" };
    }

    // Guest checkout runs with the service role key so it bypasses RLS.
    const supabase = createSupabaseAdminClient();

    // Price the order from the database, never from the client cart.
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price")
      .in(
        "id",
        cart.map((item) => item.id),
      );

    if (productsError) {
      return { ok: false, error: productsError.message };
    }

    const productsById = new Map(
      (products || []).map((p) => [p.id, { name: p.name, price: Number(p.price) }]),
    );

    const items = [];
    for (const item of cart) {
      const product = productsById.get(item.id);
      if (!product) {
        return {
          ok: false,
          error: "One of the products in your cart is no longer available.",
        };
      }
      items.push({
        product_id: item.id,
        name: product.name,
        quantity: Math.max(1, Number(item.quantity) || 1),
        price: product.price,
      });
    }

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const delivery_fee = DELIVERY_FEES[delivery_method];
    const total = subtotal + delivery_fee;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
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
        },
      ])
      .select()
      .single();

    if (orderError) {
      return { ok: false, error: orderError.message };
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map(({ product_id, quantity, price }) => ({
        order_id: order.id,
        product_id,
        quantity,
        price,
      })),
    );

    if (itemsError) {
      // Keep the order table consistent if the items could not be saved.
      await supabase.from("orders").delete().eq("id", order.id);
      return { ok: false, error: itemsError.message || "Failed to save items" };
    }

    const result = {
      ok: true,
      orderId: order.id,
      subtotal,
      delivery_method,
      delivery_fee,
      total,
    };

    try {
      await sendOrderEmail({ ...order, items });
    } catch (e) {
      return { ...result, emailWarning: e?.message || "Email failed" };
    }

    return result;
  } catch (e) {
    return { ok: false, error: e?.message || "Checkout failed" };
  }
}
