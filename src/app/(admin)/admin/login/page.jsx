"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AdminLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    const email = e.target.email.value;
    const password = e.target.password.value;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) return alert("Invalid credentials");

    router.push("/admin/orders");
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <form onSubmit={handleLogin} className="space-y-4 w-80">
        <h1 className="text-2xl font-bold text-center">Admin Login</h1>

        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full border p-2 rounded"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          className="w-full border p-2 rounded"
        />

        <Button className="w-full" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </div>
  );
}
