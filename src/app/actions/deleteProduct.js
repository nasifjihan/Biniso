"use server";
import { supabase } from "@/lib/supabase";

export async function deleteProduct(id) {
  await supabase.from("products").delete().eq("id", id);
}
