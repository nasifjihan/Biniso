import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";
import { csvFilename, csvResponse, toCsv } from "@/lib/csv";

// Admin-only export. The middleware guard covers `/admin/*`, not `/api/*`, so
// the route checks the session itself.
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, stock, status, featured, created_at, category:categories(name)")
    .order("created_at", { ascending: false });

  if (error) return new Response(error.message, { status: 500 });

  const columns = [
    { label: "Product ID", value: "id" },
    { label: "Name", value: "name" },
    { label: "Category", value: (row) => row.category?.name || "" },
    { label: "Price", value: "price" },
    // An untracked product has no stock, which is not the same as zero.
    { label: "Stock", value: (row) => (row.stock === null ? "not tracked" : row.stock) },
    { label: "Status", value: "status" },
    { label: "Featured", value: (row) => (row.featured ? "yes" : "no") },
    { label: "Created at", value: (row) => new Date(row.created_at).toISOString() },
  ];

  return csvResponse(csvFilename("products"), toCsv(columns, data));
}
