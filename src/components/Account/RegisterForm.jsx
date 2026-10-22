"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/app/actions/signUp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  // Set when the project requires email confirmation before the first sign-in.
  const [confirmEmail, setConfirmEmail] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const res = await signUp(formData);

    if (!res?.ok) {
      setLoading(false);
      setError(res?.error || "Could not create your account");
      setFieldErrors(res?.fieldErrors || {});
      return;
    }

    if (res.needsConfirmation) {
      setLoading(false);
      setConfirmEmail(String(formData.get("email") || "").trim());
      return;
    }

    router.replace("/account");
    router.refresh();
  }

  if (confirmEmail) {
    return (
      <Card className="w-full max-w-md rounded-2xl">
        <CardHeader>
          <CardTitle>Confirm your email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            We sent a confirmation link to <strong>{confirmEmail}</strong>. Open
            it to activate your account, then log in.
          </p>
          <Button className="w-full" variant="outline" asChild>
            <Link href="/account/login">Go to login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md rounded-2xl">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
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
              autoComplete="new-password"
              required
              placeholder="At least 8 characters"
            />
            {fieldErrors.password && (
              <p className="text-xs text-destructive">{fieldErrors.password}</p>
            )}
          </div>

          {error && (
            <div className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Button className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link href="/account/login" className="text-foreground underline">
              Log in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
