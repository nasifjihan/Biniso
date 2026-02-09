"use server";

import { supabase } from "@/lib/supabase";

export async function updateOrderStatus(id, status) {
  await supabase.from("orders").update({ status }).eq("id", id);
}
