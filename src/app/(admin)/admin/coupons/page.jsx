"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { createCoupon } from "@/app/actions/createCoupon";
import { setCouponActive } from "@/app/actions/setCouponActive";
import { deleteCoupon } from "@/app/actions/deleteCoupon";
import { COUPON_TYPES, describeCoupon } from "@/lib/coupons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const EMPTY_FORM = {
  code: "",
  type: "percent",
  value: "",
  min_order: "",
  expires_at: "",
  usage_limit: "",
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    setLoading(true);
    setError("");
    const { data, error: dbError } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (dbError) {
      setCoupons([]);
      setError(dbError.message);
      setLoading(false);
      return;
    }
    setCoupons(data || []);
    setLoading(false);
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      const result = await createCoupon(form);
      if (!result?.ok) {
        throw new Error(result?.error || "Failed to create coupon");
      }
      setForm(EMPTY_FORM);
      await fetchCoupons();
    } catch (err) {
      setError(err?.message || "Failed to create coupon");
    }
  }

  async function handleToggle(coupon) {
    setError("");
    try {
      const result = await setCouponActive(coupon.id, !coupon.active);
      if (!result?.ok) {
        throw new Error(result?.error || "Failed to update coupon");
      }
      await fetchCoupons();
    } catch (err) {
      setError(err?.message || "Failed to update coupon");
    }
  }

  async function handleDelete(coupon) {
    if (
      !confirm(
        `Delete "${coupon.code}"? Orders that already used it keep their discount.`,
      )
    ) {
      return;
    }

    setError("");
    try {
      const result = await deleteCoupon(coupon.id);
      if (!result?.ok) {
        throw new Error(result?.error || "Failed to delete coupon");
      }
      await fetchCoupons();
    } catch (err) {
      setError(err?.message || "Failed to delete coupon");
    }
  }

  return (
    <div className="p-10 space-y-10">
      <h1 className="text-3xl font-bold">Coupons</h1>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Add Coupon</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-code">Code</Label>
                <Input
                  id="coupon-code"
                  value={form.code}
                  onChange={(e) => set("code", e.target.value.toUpperCase())}
                  placeholder="e.g. WINTER20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => set("type", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUPON_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon-value">
                  {form.type === "percent" ? "Percent off" : "Amount off (৳)"}
                </Label>
                <Input
                  id="coupon-value"
                  value={form.value}
                  inputMode="decimal"
                  onChange={(e) => set("value", e.target.value)}
                  placeholder={form.type === "percent" ? "20" : "100"}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon-min">Minimum order (৳)</Label>
                <Input
                  id="coupon-min"
                  value={form.min_order}
                  inputMode="decimal"
                  onChange={(e) => set("min_order", e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon-expiry">Expires on (optional)</Label>
                <Input
                  id="coupon-expiry"
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => set("expires_at", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon-limit">Usage limit (optional)</Label>
                <Input
                  id="coupon-limit"
                  value={form.usage_limit}
                  inputMode="numeric"
                  onChange={(e) => set("usage_limit", e.target.value)}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <Button type="submit">Add Coupon</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {loading && <div className="text-muted-foreground">Loading...</div>}
          {!loading && coupons.length === 0 && (
            <div className="text-muted-foreground">No coupons yet.</div>
          )}
          {!loading && coupons.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Minimum order</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.code}</TableCell>
                    <TableCell>{describeCoupon(c)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {Number(c.min_order) > 0 ? `৳ ${c.min_order}` : "None"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.expires_at
                        ? new Date(c.expires_at).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.usage_limit
                        ? `${c.used_count} / ${c.usage_limit}`
                        : c.used_count}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.active ? "default" : "secondary"}>
                        {c.active ? "Active" : "Paused"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggle(c)}
                      >
                        {c.active ? "Pause" : "Resume"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(c)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
