"use server";

import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendOrderEmail, sendOrderConfirmation } from "@/lib/email";
import { rateLimit } from "@/lib/rateLimit";
import { parseCheckoutForm } from "@/lib/validation";
import { variantLabel } from "@/lib/variants";
import { COUPON_COLUMNS, checkCoupon, normaliseCode } from "@/lib/coupons";

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
      .select("id, name, price, stock")
      .in(
        "id",
        cart.map((item) => item.id),
      );

    if (productsError) {
      return { ok: false, error: productsError.message };
    }

    const productsById = new Map(
      (products || []).map((p) => [
        p.id,
        { name: p.name, price: Number(p.price), stock: p.stock },
      ]),
    );

    // Variant lines are priced and reserved from the variant, not the product.
    const variantIds = cart
      .map((item) => item.variantId)
      .filter((id) => typeof id === "string" && id);

    const variantsById = new Map();
    if (variantIds.length > 0) {
      const { data: variants, error: variantsError } = await supabase
        .from("product_variants")
        .select("id, product_id, attributes, sku, price, stock")
        .in("id", variantIds);

      if (variantsError) {
        return { ok: false, error: variantsError.message };
      }

      for (const variant of variants || []) {
        variantsById.set(variant.id, variant);
      }
    }

    const items = [];
    for (const item of cart) {
      const product = productsById.get(item.id);
      if (!product) {
        return {
          ok: false,
          error: "One of the products in your cart is no longer available.",
        };
      }

      const variant = item.variantId
        ? variantsById.get(item.variantId)
        : undefined;

      if (item.variantId && (!variant || variant.product_id !== item.id)) {
        return {
          ok: false,
          error: `The selected option for ${product.name} is no longer available.`,
        };
      }

      const price =
        variant?.price != null ? Number(variant.price) : product.price;
      // `stock === null` means the line is not stock-tracked.
      const stock = variant ? variant.stock : product.stock;
      const label = variant ? variantLabel(variant) : null;

      const quantity = Math.max(1, Number(item.quantity) || 1);
      if (stock !== null && quantity > stock) {
        const what = label ? `${product.name} (${label})` : product.name;
        return {
          ok: false,
          error:
            stock <= 0
              ? `${what} is out of stock.`
              : `Only ${stock} left of ${what}.`,
        };
      }

      items.push({
        product_id: item.id,
        variant_id: variant?.id ?? null,
        variant_label: label,
        name: product.name,
        quantity,
        price,
      });
    }

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // The discount is worked out here, never from the client's claimed total.
    const couponCode = normaliseCode(formData.get("coupon_code"));
    let appliedCoupon = null;
    let discount = 0;

    if (couponCode) {
      const { data: coupon, error: couponError } = await supabase
        .from("coupons")
        .select(COUPON_COLUMNS)
        .eq("code", couponCode)
        .maybeSingle();

      if (couponError) {
        return { ok: false, error: couponError.message };
      }

      const check = checkCoupon(coupon, subtotal);
      if (!check.ok) {
        return { ok: false, error: check.error, fieldErrors: { coupon_code: check.error } };
      }

      appliedCoupon = coupon;
      discount = check.discount;
    }

    const delivery_fee = DELIVERY_FEES[delivery_method];
    const total = subtotal - discount + delivery_fee;

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
          coupon_code: appliedCoupon?.code ?? null,
          discount,
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
      items.map(({ product_id, variant_id, variant_label, quantity, price }) => ({
        order_id: order.id,
        product_id,
        variant_id,
        variant_label,
        quantity,
        price,
      })),
    );

    if (itemsError) {
      // Keep the order table consistent if the items could not be saved.
      await supabase.from("orders").delete().eq("id", order.id);
      return { ok: false, error: itemsError.message || "Failed to save items" };
    }

    // Reserve stock atomically. The SQL function rolls back all of its updates
    // when any line item is short, so a failed reservation changes nothing.
    const stockItems = items.map(({ product_id, variant_id, quantity }) => ({
      product_id,
      variant_id,
      quantity,
    }));

    const { error: stockError } = await supabase.rpc("decrement_stock", {
      items: stockItems,
    });

    if (stockError) {
      // Nothing was reserved, so drop the order and let the customer retry.
      await supabase.from("orders").delete().eq("id", order.id);

      const shortId = /insufficient_stock:([0-9a-fA-F-]{36})/.exec(
        stockError.message || "",
      )?.[1];
      // The SQL function reports the id that ran short: a variant when the line
      // was variant-priced, otherwise the product itself.
      const shortItem = shortId
        ? items.find(
            (i) => i.product_id === shortId || i.variant_id === shortId,
          )
        : null;
      const shortName = shortItem
        ? shortItem.variant_label
          ? `${shortItem.name} (${shortItem.variant_label})`
          : shortItem.name
        : null;

      return {
        ok: false,
        error: shortName
          ? `${shortName} just went out of stock. Please update your cart.`
          : "One of the products is no longer available in the requested quantity.",
      };
    }

    // Count the redemption only once the stock is held, so a failed checkout
    // never burns a use of the code. The function refuses a code that ran out
    // of uses (or expired) while this customer was checking out.
    if (appliedCoupon) {
      const { data: redeemed, error: redeemError } = await supabase.rpc(
        "redeem_coupon",
        { coupon_code: appliedCoupon.code },
      );

      if (redeemError || !redeemed) {
        await supabase.rpc("restore_stock", { items: stockItems });
        await supabase.from("orders").delete().eq("id", order.id);

        return {
          ok: false,
          error: redeemError?.message
            ? redeemError.message
            : "That promo code is no longer available. Please try again.",
          fieldErrors: { coupon_code: "That promo code is no longer available." },
        };
      }
    }

    const result = {
      ok: true,
      orderId: order.id,
      subtotal,
      discount,
      coupon_code: appliedCoupon?.code ?? null,
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
