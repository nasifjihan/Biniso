import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/signOut";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await getUser();

  // The middleware already gates this route; this covers a session that expired
  // between the check and the render.
  if (!user) redirect("/account/login");

  const memberSince = new Date(user.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="container mx-auto py-16 max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold">My account</h1>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Your details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{user.email}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Member since</span>
            <span>{memberSince}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href="/products">Continue shopping</Link>
        </Button>
        <form action={signOut}>
          <Button variant="destructive">Log out</Button>
        </form>
      </div>
    </div>
  );
}
