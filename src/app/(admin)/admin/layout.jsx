"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/Logout";
import ThemeToggle from "@/components/ThemeToggle";

// Authentication and the admin role are enforced in middleware.js, so this
// layout only decides whether to render the admin chrome.
export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const isLoginRoute = pathname === "/admin/login";

  if (isLoginRoute) {
    return <main className="flex-1 flex flex-col">{children}</main>;
  }

  return (
    <>
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container mx-auto flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xl font-bold">
              Admin
            </Link>
            <nav className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/admin/orders">Orders</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/admin/products">Products</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/admin/categories">Categories</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/admin/coupons">Coupons</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/admin/shipping">Delivery</Link>
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" asChild>
              <Link href="/">Store</Link>
            </Button>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>
    </>
  );
}
