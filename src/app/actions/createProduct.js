"use server";

import { supabase } from "@/lib/supabase";

export async function createProduct(data) {
  const { name, price, description, image, featured } = data;

  await supabase.from("products").insert([
    {
      name,
      price,
      description,
      image,
      featured,
      status: "active",
    },
  ]);
}
