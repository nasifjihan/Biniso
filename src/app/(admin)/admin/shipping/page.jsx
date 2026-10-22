"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { createShippingZone } from "@/app/actions/createShippingZone";
import { updateShippingZone } from "@/app/actions/updateShippingZone";
import { deleteShippingZone } from "@/app/actions/deleteShippingZone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function ZoneRow({ zone, onChanged, onError }) {
  const [name, setName] = useState(zone.name);
  const [fee, setFee] = useState(String(zone.fee));
  const [saving, setSaving] = useState(false);

  const dirty = name !== zone.name || fee !== String(zone.fee);

  async function run(action) {
    setSaving(true);
    try {
      const result = await action();
      if (!result?.ok) {
        throw new Error(result?.error || "Failed to update delivery option");
      }
      onError("");
      await onChanged();
    } catch (err) {
      onError(err?.message || "Failed to update delivery option");
    } finally {
      setSaving(false);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {zone.code}
      </TableCell>
      <TableCell>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </TableCell>
      <TableCell>
        <Input
          value={fee}
          inputMode="decimal"
          onChange={(e) => setFee(e.target.value)}
          className="w-28"
        />
      </TableCell>
      <TableCell>
        <Badge variant={zone.active ? "default" : "secondary"}>
          {zone.active ? "Active" : "Paused"}
        </Badge>
      </TableCell>
      <TableCell className="text-right space-x-2">
        <Button
          size="sm"
          onClick={() => run(() => updateShippingZone(zone.id, { name, fee }))}
          disabled={saving || !dirty}
        >
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => run(() => updateShippingZone(zone.id, { active: !zone.active }))}
          disabled={saving}
        >
          {zone.active ? "Pause" : "Resume"}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={saving}
          onClick={() => {
            if (
              !confirm(
                `Delete "${zone.name}"? Orders that already used it keep their delivery fee.`,
              )
            ) {
              return;
            }
            run(() => deleteShippingZone(zone.id));
          }}
        >
          Delete
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function AdminShipping() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", fee: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchZones();
  }, []);

  async function fetchZones() {
    setLoading(true);
    const { data, error: dbError } = await supabase
      .from("shipping_zones")
      .select("*")
      .order("position", { ascending: true })
      .order("name", { ascending: true });

    if (dbError) {
      setZones([]);
      setError(dbError.message);
      setLoading(false);
      return;
    }
    setZones(data || []);
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      const result = await createShippingZone(form);
      if (!result?.ok) {
        throw new Error(result?.error || "Failed to add delivery option");
      }
      setForm({ name: "", fee: "" });
      await fetchZones();
    } catch (err) {
      setError(err?.message || "Failed to add delivery option");
    }
  }

  return (
    <div className="p-10 space-y-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Delivery Zones</h1>
        <p className="text-sm text-muted-foreground">
          These are the delivery options and fees customers choose from at
          checkout.
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Add Delivery Option</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zone-name">Name</Label>
                <Input
                  id="zone-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Chattogram"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zone-fee">Fee (৳)</Label>
                <Input
                  id="zone-fee"
                  value={form.fee}
                  inputMode="decimal"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fee: e.target.value }))
                  }
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <Button type="submit">Add Delivery Option</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Current Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {loading && <div className="text-muted-foreground">Loading...</div>}
          {!loading && zones.length === 0 && (
            <div className="text-muted-foreground">
              No delivery options yet. Checkout will not offer any.
            </div>
          )}
          {!loading && zones.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Fee (৳)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((zone) => (
                  <ZoneRow
                    key={zone.id}
                    zone={zone}
                    onChanged={fetchZones}
                    onError={setError}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
