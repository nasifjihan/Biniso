import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import AddressBook from "@/components/Account/AddressBook";
import { Button } from "@/components/ui/button";

export const metadata = { title: "My addresses" };

export default async function AddressesPage() {
  const user = await getUser();
  if (!user) redirect("/account/login");

  return (
    <div className="container mx-auto py-16 max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">My addresses</h1>
        <Button variant="outline" asChild>
          <Link href="/account">Account</Link>
        </Button>
      </div>

      <AddressBook />
    </div>
  );
}
