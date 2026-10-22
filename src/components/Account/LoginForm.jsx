"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/app/actions/signIn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Where to go after signing in. The middleware fills `next` in when it sends a
// signed-out visitor here, so only same-site paths are followed.
function targetFor(next) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export default function LoginForm({ next = "", notice = "" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    const res = await signIn(new FormData(e.currentTarget));

    if (!res?.ok) {
      setLoading(false);
      setError(res?.error || "Could not sign you in");
      setFieldErrors(res?.fieldErrors || {});
      return;
    }

    // The session lives in cookies, so a refresh lets server components see it.
    router.replace(targetFor(next));
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md rounded-2xl">
      <CardHeader>
        <CardTitle>Log in</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@email.com"
            />
            {fieldErrors.email && (
              <p className="text-xs text-destructive">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
            {fieldErrors.password && (
              <p className="text-xs text-destructive">{fieldErrors.password}</p>
            )}
          </div>

          {notice === "confirm" && (
            <div className="text-sm border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2">
              That confirmation link has expired or has already been used. Log in
              if you have confirmed your email, or sign up again.
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Button className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            New to Biniso?{" "}
            <Link href="/account/register" className="text-foreground underline">
              Create an account
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
