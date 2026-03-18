"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/Logout";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [auth, setAuth] = useState({ checkedPath: null, authed: false });

  const isLoginRoute = pathname === "/admin/login";
  const needsAuth = !isLoginRoute;
  const isChecked = auth.checkedPath === pathname;
  const showGate = needsAuth && (!isChecked || !auth.authed);

  useEffect(() => {
    if (isLoginRoute) {
      setAuth({ checkedPath: pathname, authed: false });
      return;
    }

    let active = true;

    async function check() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      const session = data?.session;
      if (!session) {
        setAuth({ checkedPath: pathname, authed: false });
        const next = pathname || "/admin";
        router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
        return;
      }

      setAuth({ checkedPath: pathname, authed: true });
    }

    check();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "SIGNED_OUT" || !session) {
        setAuth({ checkedPath: pathname, authed: false });
        const next = pathname || "/admin";
        router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
        return;
      }

      if (event === "SIGNED_IN") {
        setAuth({ checkedPath: pathname, authed: true });
      }
    });

    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
    };
  }, [isLoginRoute, pathname, router]);

  if (isLoginRoute) {
    return <main className="flex-1 flex flex-col">{children}</main>;
  }

  if (showGate) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Checking login...</div>
      </main>
    );
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
