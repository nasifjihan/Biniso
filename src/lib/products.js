import { supabase } from "@/lib/supabase";

export async function getAllProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getFeaturedProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("featured", true)
    .eq("status", "active");

  if (error) throw error;
  return data;
}

export async function getProductById(id) {
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, product_variants(id, attributes, sku, price, stock, created_at), product_images(id, url, position)",
    )
    .eq("id", id)
    .order("created_at", { referencedTable: "product_variants", ascending: true })
    .single();

  if (error) throw error;
  return data;
}
