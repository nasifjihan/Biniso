"use server";

import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendOrderEmail, sendOrderConfirmation } from "@/lib/email";
import { rateLimit } from "@/lib/rateLimit";
import { parseCheckoutForm } from "@/lib/validation";

const DELIVERY_FEES = {
  inside_dhaka: 60,
  outside_dhaka: 120,
  pickup: 0,
};

export async function createOrder(formData, cart) {
  try {
    // Honeypot: real users never fill this hidden field.
    if (String(formData.get("company") || "").trim()) {
      return { ok: false, error: "Invalid submission" };
    }

    if (!Array.isArray(cart) || cart.length === 0) {
      return { ok: false, error: "Cart is empty" };
    }

    const requestHeaders = await headers();
    const ip =
      (requestHeaders.get("x-forwarded-for") || "").split(",")[0].trim() ||
      requestHeaders.get("x-real-ip") ||
      "unknown";

    const limited = rateLimit(`checkout:${ip}`);
    if (!limited.ok) {
      return {
        ok: false,
        error: "Too many attempts. Please try again in a minute.",
      };
    }

    const parsed = parseCheckoutForm(formData);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error,
        fieldErrors: parsed.fieldErrors,
      };
    }

    const {
      name: customer_name,
      phone,
      address,
      email,
      city,
      notes,
      delivery_method,
    } = parsed.data;

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
      await sendOrderConfirmation({ ...order, items });
    } catch (e) {
      return { ...result, emailWarning: e?.message || "Email failed" };
    }

    return result;
  } catch (e) {
    return { ok: false, error: e?.message || "Checkout failed" };
  }
}
