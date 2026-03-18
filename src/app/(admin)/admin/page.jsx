import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminHomePage() {
  return (
    <div className="container mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

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

