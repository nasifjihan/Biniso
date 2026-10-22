import Link from "next/link";
import { getDashboardStats, DASHBOARD_WINDOW_DAYS } from "@/lib/analytics";
import { orderStatusVariant } from "@/lib/orderStatus";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Dashboard" };

const money = (value) =>
  `৳ ${Math.round(Number(value) || 0).toLocaleString("en-US")}`;

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default async function AdminHomePage() {
  const stats = await getDashboardStats();

  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money(stats.revenue)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.paidOrders} paid orders, cancelled ones excluded
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.byStatus.pending} waiting to be confirmed
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Average order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {money(stats.averageOrder)}
            </div>
            <p className="text-xs text-muted-foreground">Across paid orders</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Last {DASHBOARD_WINDOW_DAYS} days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {money(stats.recentRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.recentOrders} orders placed
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Orders by status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {STATUSES.map((status) => (
            <div
              key={status}
              className="flex items-center gap-2 border rounded-xl px-3 py-2"
            >
              <Badge variant={orderStatusVariant(status)}>{status}</Badge>
              <span className="font-semibold">{stats.byStatus[status]}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Top products</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sales in the last {DASHBOARD_WINDOW_DAYS} days.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {money(product.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Low stock</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing at or below {stats.lowStockThreshold} units.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Left</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.lowStock.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={Number(product.stock) <= 0 ? "destructive" : "secondary"}
                        >
                          {product.stock}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              Threshold is {stats.lowStockThreshold} units — change it with the
              LOW_STOCK_THRESHOLD environment variable. Products without a stock
              figure are not tracked.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link href="/admin/orders">
          <Card className="rounded-2xl hover:bg-accent transition-colors">
            <CardHeader>
              <CardTitle>Manage Orders</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              View orders, update status, and print invoices.
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/products">
          <Card className="rounded-2xl hover:bg-accent transition-colors">
            <CardHeader>
              <CardTitle>Manage Products</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Add, edit, and delete products from the catalog.
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
