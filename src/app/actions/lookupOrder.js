"use server";

import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rateLimit";
import { reportError } from "@/lib/monitoring";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Digits only, so "+880 1712-345678" and "01712345678" can be compared.
const digits = (value) => String(value ?? "").replace(/\D/g, "");

const NOT_FOUND = {
  ok: false,
  error: "No order matches that order ID and phone number.",
};

/**
 * Status lookup for a guest: order ID plus the phone number used at checkout.
 * Only the status, date and total are returned — never the address or contact
 * details the order holds.
 */
export async function lookupOrder({ orderId, phone }) {
  const id = String(orderId ?? "").trim();
  const entered = digits(phone);

  if (!UUID.test(id) || entered.length < 10) {
    return {
      ok: false,
      error: "Enter the order ID and the phone number used at checkout.",
    };
  }

  const requestHeaders = await headers();
  const ip =
    (requestHeaders.get("x-forwarded-for") || "").split(",")[0].trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown";

  const limited = rateLimit(`track:${ip}`, { limit: 10 });
  if (!limited.ok) {
    return {
      ok: false,
      error: "Too many attempts. Please try again in a minute.",
    };
  }

  // Orders are admin-only under RLS, so this lookup runs with the service role.
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, created_at, total, phone")
    .eq("id", id)
    .maybeSingle();

  // A raw PostgREST message would name tables and columns, and this runs with no
  // session at all, so the detail goes to the server log and the caller gets a
  // generic reply.
  if (error) {
    await reportError(error, { where: "lookupOrder" });
    return { ok: false, error: "Could not look that order up. Please try again." };
  }

  // An unknown id and a wrong phone give the same answer, so the form cannot be
  // used to discover which order ids exist.
  if (!data) return NOT_FOUND;

  // The last ten digits are the subscriber number, so a number stored with the
  // +880 country code still matches one typed as 01…
  if (digits(data.phone).slice(-10) !== entered.slice(-10)) return NOT_FOUND;

  return {
    ok: true,
    order: {
      id: data.id,
      status: data.status,
      created_at: data.created_at,
      total: data.total,
    },
  };
}
