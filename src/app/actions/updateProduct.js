"use server";
import { supabase } from "@/lib/supabase";

export async function updateProduct(id, data) {
  await supabase.from("products").update(data).eq("id", id);
}
