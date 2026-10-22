"use client";

import { useEffect, useState } from "react";
import { createAddress } from "@/app/actions/createAddress";
import { deleteAddress } from "@/app/actions/deleteAddress";
import { ADDRESS_COLUMNS } from "@/lib/addresses";
import { supabase } from "@/lib/supabaseClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const EMPTY_FORM = { label: "", name: "", phone: "", city: "", address: "" };

export default function AddressBook() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let active = true;

    async function load() {
      // The customer's own session, so RLS returns only their addresses.
      const { data, error } = await supabase
        .from("addresses")
        .select(ADDRESS_COLUMNS)
        .order("created_at", { ascending: false });

      if (!active) return;
      if (error) toast.error(error.message);
      setAddresses(data || []);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});

    const res = await createAddress(form);
    setSaving(false);

    if (!res?.ok) {
      setFieldErrors(res?.fieldErrors || {});
      toast.error(res?.error || "Could not save that address");
      return;
    }

    setForm(EMPTY_FORM);
    toast.success(
      res.duplicate ? "That address was already saved" : "Address saved",
    );

    if (!res.duplicate) {
      setAddresses((current) => [res.data, ...current]);
    }
  }

  async function handleDelete(address) {
    if (!confirm(`Delete the address for "${address.name}"?`)) return;

    const res = await deleteAddress(address.id);
    if (!res?.ok) {
      toast.error(res?.error || "Could not delete that address");
      return;
    }

    setAddresses((current) => current.filter((row) => row.id !== address.id));
    toast.success("Address deleted");
  }

  return (
    <div className="space-y-8">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Saved addresses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}

          {!loading && addresses.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No saved addresses yet. Add one below and checkout will fill it in.
            </p>
          )}

          {addresses.map((address) => (
            <div
              key={address.id}
              className="border rounded-xl p-4 flex flex-wrap items-start justify-between gap-3"
            >
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{address.name}</span>
                  {address.label && (
                    <Badge variant="secondary">{address.label}</Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{address.phone}</p>
                <p>
                  {address.address}
                  {address.city ? `, ${address.city}` : ""}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(address)}
              >
                Delete
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Add an address</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label (optional)</Label>
                <Input
                  id="label"
                  value={form.label}
                  onChange={(e) => setField("label", e.target.value)}
                  placeholder="Home, Office..."
                />
                {fieldErrors.label && (
                  <p className="text-sm text-destructive">{fieldErrors.label}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  required
                />
                {fieldErrors.name && (
                  <p className="text-sm text-destructive">{fieldErrors.name}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder="01XXXXXXXXX"
                  required
                />
                {fieldErrors.phone && (
                  <p className="text-sm text-destructive">{fieldErrors.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City (optional)</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                />
                {fieldErrors.city && (
                  <p className="text-sm text-destructive">{fieldErrors.city}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Delivery address</Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="House, road, area"
                className="min-h-24"
                required
              />
              {fieldErrors.address && (
                <p className="text-sm text-destructive">{fieldErrors.address}</p>
              )}
            </div>

            <Button disabled={saving}>
              {saving ? "Saving..." : "Save address"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
