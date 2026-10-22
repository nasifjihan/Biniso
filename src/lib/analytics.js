import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LOW_STOCK_THRESHOLD } from "@/lib/inventory";

// How far back the "recent" figures and the best-sellers look.
const WINDOW_DAYS = 30;

const TOP_PRODUCT_LIMIT = 5;
const LOW_STOCK_LIMIT = 10;

export const DASHBOARD_WINDOW_DAYS = WINDOW_DAYS;

/**
 * The numbers behind the admin dashboard.
 *
 * Orders are read as two columns rather than aggregated in SQL, which is fine
 * for a store of this size; if the table ever grows past that, the totals belong
 * in a database function.
 */
export async function getDashboardStats() {
  const supabase = await createSupabaseServerClient();
  const since = new Date(
    Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("status, total, created_at");

  if (ordersError) throw ordersError;

  const byStatus = {
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  let revenue = 0;
  let paidOrders = 0;
  let recentRevenue = 0;
  let recentOrders = 0;

  for (const order of orders || []) {
    const status = order.status;
    if (status in byStatus) byStatus[status] += 1;

    // A cancelled order is not money the store took, so it counts towards the
    // order tally but never towards revenue.
    if (status !== "cancelled") {
      const total = Number(order.total || 0);
      revenue += total;
      paidOrders += 1;
      if (order.created_at >= since) recentRevenue += total;
    }

    if (order.created_at >= since) recentOrders += 1;
  }

  const { data: recent, error: recentError } = await supabase
    .from("orders")
    .select("id, order_items ( quantity, price, product_id, products ( name ) )")
    .gte("created_at", since)
    .neq("status", "cancelled");

  if (recentError) throw recentError;

  const perProduct = new Map();

  for (const order of recent || []) {
    for (const item of order.order_items || []) {
      // A line whose product was deleted has nothing to report it against.
      if (!item.product_id) continue;

      const line = perProduct.get(item.product_id) || {
        id: item.product_id,
        name: item.products?.name || "Deleted product",
        quantity: 0,
        revenue: 0,
      };

      const quantity = Number(item.quantity || 0);
      line.quantity += quantity;
      line.revenue += quantity * Number(item.price || 0);
      perProduct.set(item.product_id, line);
    }
  }

  const topProducts = Array.from(perProduct.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, TOP_PRODUCT_LIMIT);

  const { data: lowStock, error: lowStockError } = await supabase
    .from("products")
    .select("id, name, stock")
    .not("stock", "is", null)
    .lte("stock", LOW_STOCK_THRESHOLD)
    .order("stock", { ascending: true })
    .limit(LOW_STOCK_LIMIT);

  if (lowStockError) throw lowStockError;

  return {
    revenue,
    orders: (orders || []).length,
    paidOrders,
    averageOrder: paidOrders > 0 ? revenue / paidOrders : 0,
    recentRevenue,
    recentOrders,
    byStatus,
    topProducts,
    lowStock: lowStock || [],
    lowStockThreshold: LOW_STOCK_THRESHOLD,
  };
}
